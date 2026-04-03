/**
 * Agent Reviewer Lambda Function
 * Analyzes code for security vulnerabilities using AWS Bedrock
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { BedrockAgentRuntimeClient, RetrieveCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const { buildCodeGraph, summarizeGraphForPrompt } = require('./code-graph/graph-builder');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
const bedrockAgentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

// API endpoint for saving vulnerabilities
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://aitthcp5o5.execute-api.us-east-1.amazonaws.com';

/**
 * Simple in-memory cache for RAG results
 * Note: Lambda containers may be reused, so this provides some caching benefit
 * For production, consider using ElastiCache Redis or DynamoDB for distributed caching
 */
const ragCache = {
    cache: new Map(),
    ttlMs: 5 * 60 * 1000, // 5 minutes TTL
    maxSize: 50, // Max cache entries

    generateKey(queries, documentIds, userDataSourceId = null) {
        // Create a cache key from queries, document IDs, and data source
        const sortedDocs = [...documentIds].sort().join(',');
        const queryHash = queries.map(q => q.substring(0, 50)).join('|');
        const dsPrefix = userDataSourceId ? `ds:${userDataSourceId}::` : '';
        return `${dsPrefix}${queryHash}::${sortedDocs}`;
    },

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        console.log(`RAG Cache HIT for key: ${key.substring(0, 50)}...`);
        return entry.value;
    },

    set(key, value) {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttlMs
        });
        console.log(`RAG Cache SET for key: ${key.substring(0, 50)}... (cache size: ${this.cache.size})`);
    }
};

exports.handler = async (event) => {
    console.log('Agent Reviewer - Event:', JSON.stringify(event, null, 2));
    
    try {
        const { runId, useCase } = event;
        
        if (!runId || !useCase) {
            throw new Error('Missing required fields: runId or useCase');
        }
        
        console.log(`Reviewing code for run ${runId}, use case ${useCase.id}`);
        
        // Get the code from the event (passed from Step Functions)
        let codePayload = event.code || useCase.code || event.metadata?.code || '';
        const codeType = event.codeType || useCase.codeType || event.metadata?.codeType || 'Unknown';
        const selectedDocuments = event.selectedDocuments || useCase.selectedDocuments || [];
        const userDataSourceId = event.userDataSourceId || useCase.userDataSourceId || null;

        console.log(`Selected documents for RAG: ${selectedDocuments.length}`);
        if (userDataSourceId) {
            console.log(`Using per-user data source: ${userDataSourceId}`);
        }

        // If code is an S3 reference, fetch it from S3
        if (typeof codePayload === 'object' && codePayload.s3Bucket && codePayload.s3Key) {
            console.log(`Fetching code from S3: ${codePayload.s3Bucket}/${codePayload.s3Key}`);
            try {
                const getCommand = new GetObjectCommand({
                    Bucket: codePayload.s3Bucket,
                    Key: codePayload.s3Key,
                });
                const response = await s3Client.send(getCommand);
                const bodyString = await streamToString(response.Body);
                codePayload = JSON.parse(bodyString);
                console.log(`Fetched code from S3: ${codePayload.files?.length || 0} files`);
            } catch (s3Error) {
                console.error('Error fetching code from S3:', s3Error);
                throw new Error(`Failed to fetch code from S3: ${s3Error.message}`);
            }
        }
        
        if (!codePayload) {
            console.warn('No code provided for analysis');
            return {
                vulnerabilities: [],
                analysisComplete: true,
                vulnerabilityCount: 0
            };
        }
        
        // Determine if this is a single file or multi-file project
        let isProject = false;
        let files = [];
        
        if (typeof codePayload === 'object') {
            if (codePayload.type === 'project' && Array.isArray(codePayload.files)) {
                isProject = true;
                files = codePayload.files;
                console.log(`Analyzing project with ${files.length} files`);
            } else if (codePayload.type === 'single') {
                files = [{
                    path: codePayload.fileName || 'main',
                    content: codePayload.content,
                    language: codeType
                }];
            }
        } else if (typeof codePayload === 'string') {
            // Legacy: plain string code
            files = [{
                path: 'main',
                content: codePayload,
                language: codeType
            }];
        }
        
        if (files.length === 0) {
            console.warn('No files to analyze');
            return {
                vulnerabilities: [],
                analysisComplete: true,
                vulnerabilityCount: 0
            };
        }
        
        // SECURITY: Enforce that documents are selected — analysis without RAG grounding is not allowed
        if (!selectedDocuments || selectedDocuments.length === 0) {
            throw new Error('No knowledge base documents selected. Analysis requires RAG grounding — cannot proceed without selected documents.');
        }

        // Retrieve relevant context from knowledge base (RAG)
        // SECURITY: RAG is mandatory when documents are selected. If retrieval fails,
        // the analysis MUST fail — we never silently fall back to un-grounded LLM output.
        let ragContext = '';
        let ragReferences = [];
        if (process.env.BEDROCK_KNOWLEDGE_BASE_ID) {
            const ragResult = await retrieveKnowledgeBaseContext(files, codeType, selectedDocuments, userDataSourceId);
            ragContext = ragResult.context || '';
            ragReferences = ragResult.references || [];
            console.log(`Retrieved RAG context: ${ragContext.length} characters, ${ragReferences.length} references`);

            if (ragContext.length === 0 && ragReferences.length === 0) {
                console.warn('[SECURITY] RAG returned zero context for selected documents — analysis may lack grounding');
            }
        } else {
            console.warn('[SECURITY] BEDROCK_KNOWLEDGE_BASE_ID not configured — RAG disabled, analysis will lack knowledge base grounding');
        }
        
        // Analyze all files
        let allVulnerabilities = [];
        
        if (isProject && files.length > 10) {
            // For large projects, analyze in batches and combine results
            console.log('Large project detected, analyzing in batches');
            const batchSize = 5;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const batchVulns = await analyzeFiles(useCase, batch, codeType, ragContext, selectedDocuments, ragReferences);
                allVulnerabilities.push(...batchVulns);
            }
        } else {
            // Analyze all files together
            allVulnerabilities = await analyzeFiles(useCase, files, codeType, ragContext, selectedDocuments, ragReferences);
        }
        
        console.log(`Found ${allVulnerabilities.length} vulnerabilities across ${files.length} file(s)`);
        
        // Save vulnerabilities via API
        for (const vuln of allVulnerabilities) {
            await saveVulnerabilityViaAPI(runId, vuln);
        }
        
        console.log('Vulnerabilities saved');
        
        // For large vulnerability lists, store in S3 and return reference
        let vulnerabilitiesReference = allVulnerabilities;
        
        if (allVulnerabilities.length > 10) {
            try {
                const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
                const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
                
                const s3Key = `workflow-runs/${runId}/use-cases/${useCase.id}/vulnerabilities.json`;
                const uploadCommand = new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME || 'vulniq-bucket-dev',
                    Key: s3Key,
                    Body: JSON.stringify(allVulnerabilities),
                    ContentType: 'application/json',
                });
                
                await s3.send(uploadCommand);
                console.log(`Uploaded vulnerabilities to S3: ${s3Key}`);
                
                // Return S3 reference instead of full data
                vulnerabilitiesReference = {
                    s3Bucket: process.env.AWS_S3_BUCKET_NAME || 'vulniq-bucket-dev',
                    s3Key: s3Key,
                    count: allVulnerabilities.length,
                };
            } catch (s3Error) {
                console.error('Error uploading vulnerabilities to S3:', s3Error);
                // Fall back to inline (may cause size issues)
                vulnerabilitiesReference = allVulnerabilities;
            }
        }
        
        // Return results
        return {
            vulnerabilities: vulnerabilitiesReference,
            analysisComplete: true,
            vulnerabilityCount: allVulnerabilities.length,
            filesAnalyzed: files.length
        };
        
    } catch (error) {
        console.error('Error in agent-reviewer:', error);
        throw error;
    }
};

async function saveVulnerabilityViaAPI(runId, vuln) {
    // For now, just log - we'll save via the reporter or directly in the database
    console.log(`Vulnerability: ${vuln.title} (${vuln.severity})`);
    // TODO: Call API endpoint to save vulnerability
}

/**
 * Analyze multiple files for vulnerabilities
 */
async function analyzeFiles(useCase, files, codeType, ragContext, selectedDocuments, ragReferences = []) {
    // Build code graph for multi-file structural analysis
    let codeGraph = null;
    let graphSummary = '';
    if (files.length > 1) {
        try {
            codeGraph = buildCodeGraph(files);
            if (codeGraph) {
                graphSummary = summarizeGraphForPrompt(codeGraph);
                console.log(`[CodeGraph] Built graph: ${codeGraph.stats.totalFunctions} functions, ${codeGraph.stats.totalCallEdges} call edges, ${codeGraph.entryPoints.length} entry points`);
            }
        } catch (graphErr) {
            console.warn('[CodeGraph] Graph building failed (non-fatal):', graphErr.message);
        }
    }

    // Build combined code context for analysis
    let codeContext = '';

    if (files.length === 1) {
        codeContext = files[0].content;
    } else {
        // For multiple files, include file paths and content
        codeContext = files.map(file =>
            `File: ${file.path}\n\`\`\`${file.language || 'plaintext'}\n${file.content}\n\`\`\``
        ).join('\n\n');
    }

    // Build security analysis prompt with RAG context, references, and code graph
    const prompt = buildSecurityAnalysisPrompt(useCase, codeContext, codeType, ragContext, selectedDocuments, files.length > 1, ragReferences, graphSummary);

    // Call AWS Bedrock
    const modelId = useCase.reviewerModel || 'anthropic.claude-3-haiku-20240307-v1:0';
    console.log(`Calling Bedrock model: ${modelId} for ${files.length} file(s)`);
    
    let vulnerabilities = [];
    
    try {
        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4096,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0 // Zero temperature: strict adherence to document-scoped constraints
            })
        });
        
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiResponse = responseBody.content[0].text;
        
        console.log('Bedrock response received');
        
        // Parse vulnerabilities from AI response
        vulnerabilities = parseVulnerabilities(aiResponse);

        // IMPROVEMENT: Enrich vulnerabilities with RAG references via post-processing
        // This ensures references are attached even if the LLM doesn't cite them properly
        if (ragReferences && ragReferences.length > 0) {
            vulnerabilities = enrichVulnerabilitiesWithReferences(vulnerabilities, ragReferences);
            console.log(`Enriched ${vulnerabilities.length} vulnerabilities with RAG references`);
        }

        // SECURITY: Post-processing validation — strip any vulnerability that lacks
        // documentReferences. This is the programmatic safety net: even if the LLM
        // ignores the prompt and uses its general training, findings without citations
        // to the user's selected documents are removed.
        const beforeCount = vulnerabilities.length;
        vulnerabilities = vulnerabilities.filter(vuln => {
            const refs = vuln.documentReferences;
            if (!Array.isArray(refs) || refs.length === 0) {
                console.warn(`[SECURITY] Stripping un-grounded vulnerability: "${vuln.title}" — no documentReferences`);
                return false;
            }
            return true;
        });
        if (vulnerabilities.length < beforeCount) {
            console.log(`[SECURITY] Stripped ${beforeCount - vulnerabilities.length} un-grounded vulnerabilities (had no document references)`);
        }
    } catch (bedrockError) {
        console.error('Bedrock LLM call failed:', bedrockError.message);

        // SECURITY: Do NOT silently fall back to generic pattern matching.
        // Pattern matching produces findings that are NOT grounded in the user's
        // selected documents, violating the document-scoped analysis requirement.
        // Re-throw so the caller knows the analysis failed.
        throw new Error(`Security analysis failed: LLM invocation error — ${bedrockError.message}`);
    }
    
    return vulnerabilities;
}

/**
 * IMPROVED RAG: Retrieve relevant context from Bedrock Knowledge Base
 *
 * Enhancements:
 * 1. Hybrid Search - combines semantic vector search with keyword matching
 * 2. Code-aware query generation - extracts patterns from actual code
 * 3. Deduplication and reranking - removes duplicates and sorts by relevance
 * 4. LLM-based Contextual Compression - uses LLM to extract most relevant parts
 * 5. Metadata enrichment - adds useful metadata to references
 * 6. Metadata Filtering - filters by CWE, OWASP, language-specific tags
 * 7. Result caching - caches results for repeated queries
 *
 * IMPORTANT: Only retrieves from the explicitly selected documents.
 * When userDataSourceId is provided, queries are scoped to that user's data source only.
 */
async function retrieveKnowledgeBaseContext(files, codeType, selectedDocuments, userDataSourceId = null) {
    try {
        const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
        if (!knowledgeBaseId) {
            throw new Error('BEDROCK_KNOWLEDGE_BASE_ID is not configured — RAG cannot function');
        }

        if (!selectedDocuments || selectedDocuments.length === 0) {
            throw new Error('No documents selected for RAG context — knowledge base grounding is required');
        }

        // Generate queries first (needed for cache key)
        const queries = generateMultipleQueries(files, codeType);
        const documentIds = selectedDocuments.map(d => d.id).filter(Boolean);

        // Check cache — include userDataSourceId to prevent cross-user cache hits
        const cacheKey = ragCache.generateKey(queries, documentIds, userDataSourceId);
        const cachedResult = ragCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        // Log selected documents for audit
        console.log('Selected documents for RAG:');
        selectedDocuments.forEach(doc => {
            console.log(`  - ${doc.title} (${doc.id})`);
        });

        // Build S3 URI filters for the selected documents only
        const s3Bucket = process.env.AWS_S3_BUCKET_NAME || 'vulniq-bucket-dev';
        const documentFilters = selectedDocuments
            .filter(doc => doc.s3Key)
            .map(doc => ({
                equals: {
                    key: "x-amz-bedrock-kb-source-uri",
                    value: `s3://${s3Bucket}/${doc.s3Key}`
                }
            }));

        // Per-user data source filter — scopes retrieval to only this user's vectors
        if (userDataSourceId) {
            documentFilters.push({
                equals: {
                    key: "x-amz-bedrock-kb-data-source-id",
                    value: userDataSourceId
                }
            });
            console.log(`Added data source filter: ${userDataSourceId}`);
        }

        // IMPROVEMENT 6: Extract metadata filters based on code patterns
        const metadataFilters = buildMetadataFilters(files, codeType);
        console.log(`Metadata filters: ${JSON.stringify(metadataFilters)}`);

        // Queries already generated above for cache key
        console.log(`Generated ${queries.length} queries for multi-query retrieval`);

        // IMPROVEMENT 1: Generate keyword queries for hybrid search
        const keywordQueries = generateKeywordQueries(files, codeType);
        console.log(`Generated ${keywordQueries.length} keyword queries for hybrid search`);

        // Build base retrieval configuration
        const baseRetrievalConfig = {
            vectorSearchConfiguration: {
                numberOfResults: 8 // Per query, will be deduplicated
            }
        };

        // Combine document filters with metadata filters
        const combinedFilter = buildCombinedFilter(documentFilters, metadataFilters);

        // SECURITY: Fail closed — never query without document filters.
        // Without filters, Bedrock would return results from ALL documents in the KB,
        // violating the user's document selection.
        if (!combinedFilter) {
            throw new Error(
                'SECURITY: Could not build document filters for RAG query. ' +
                'This means none of the selected documents have valid S3 keys. ' +
                'Refusing to query knowledge base without scoping filters.'
            );
        }
        baseRetrievalConfig.vectorSearchConfiguration.filter = combinedFilter;

        // Execute semantic queries in parallel
        const allResults = [];
        const semanticPromises = queries.map(async (query, queryIndex) => {
            try {
                console.log(`Semantic Query ${queryIndex + 1}: ${query.substring(0, 100)}...`);

                const command = new RetrieveCommand({
                    knowledgeBaseId: knowledgeBaseId,
                    retrievalQuery: { text: query },
                    retrievalConfiguration: baseRetrievalConfig
                });

                const response = await bedrockAgentClient.send(command);

                if (response.retrievalResults) {
                    return response.retrievalResults.map(r => ({
                        ...r,
                        queryType: 'semantic',
                        queryCategory: queryIndex === 0 ? 'general' : queryIndex === 1 ? 'code-patterns' : 'vulnerability-specific'
                    }));
                }
                return [];
            } catch (err) {
                console.error(`Semantic Query ${queryIndex + 1} failed:`, err.message);
                return [];
            }
        });

        // IMPROVEMENT 1: Execute keyword queries for hybrid search
        const keywordPromises = keywordQueries.map(async (query, queryIndex) => {
            try {
                console.log(`Keyword Query ${queryIndex + 1}: ${query.substring(0, 80)}...`);

                // For keyword search, we use exact match queries
                const command = new RetrieveCommand({
                    knowledgeBaseId: knowledgeBaseId,
                    retrievalQuery: { text: query },
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 5,
                            // SECURITY: Same document scope filters as semantic queries (mandatory)
                            filter: combinedFilter
                        }
                    }
                });

                const response = await bedrockAgentClient.send(command);

                if (response.retrievalResults) {
                    return response.retrievalResults.map(r => ({
                        ...r,
                        queryType: 'keyword',
                        queryCategory: 'exact-match'
                    }));
                }
                return [];
            } catch (err) {
                console.error(`Keyword Query ${queryIndex + 1} failed:`, err.message);
                return [];
            }
        });

        // Wait for all queries
        const [semanticResults, keywordResults] = await Promise.all([
            Promise.all(semanticPromises),
            Promise.all(keywordPromises)
        ]);

        // Combine results
        semanticResults.forEach(results => allResults.push(...results));
        keywordResults.forEach(results => allResults.push(...results));

        console.log(`Total raw results: ${allResults.length} (semantic + keyword hybrid search)`);

        // Deduplicate and rerank with hybrid scoring
        const dedupedResults = deduplicateAndRerankHybrid(allResults, selectedDocuments);
        console.log(`After deduplication and hybrid reranking: ${dedupedResults.length} unique chunks`);

        // IMPROVEMENT 4: LLM-based contextual compression
        const compressedResults = await compressWithLLM(dedupedResults, codeType, files);
        console.log(`After LLM compression: ${compressedResults.length} compressed chunks`);

        // Build context with better formatting
        const { context, references } = buildEnhancedContext(compressedResults, selectedDocuments);

        console.log(`Final context: ${context.length} characters, ${references.length} references`);

        // Cache the result for future queries
        const result = { context, references };
        ragCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Error retrieving from knowledge base:', error);
        // Re-throw — RAG is required for security review, do not silently degrade
        throw error;
    }
}

/**
 * IMPROVEMENT 1: Generate keyword queries for hybrid search
 * These queries focus on exact terms that should be matched literally
 */
function generateKeywordQueries(files, codeType) {
    const queries = [];
    const codeContent = files.map(f => f.content || '').join('\n');

    // Extract CWE/CVE references from code comments
    const cweMatches = codeContent.match(/CWE-\d+/gi) || [];
    const cveMatches = codeContent.match(/CVE-\d{4}-\d+/gi) || [];

    if (cweMatches.length > 0) {
        queries.push(`${[...new Set(cweMatches)].join(' ')} vulnerability prevention remediation`);
    }

    if (cveMatches.length > 0) {
        queries.push(`${[...new Set(cveMatches)].join(' ')} patch fix mitigation`);
    }

    // Extract function/class names that might be security-relevant
    const securityFunctions = extractSecurityFunctionNames(codeContent);
    if (securityFunctions.length > 0) {
        queries.push(`${securityFunctions.slice(0, 5).join(' ')} security best practices`);
    }

    // Language + framework specific keywords
    const frameworkKeywords = detectFrameworks(codeContent, codeType);
    if (frameworkKeywords.length > 0) {
        queries.push(`${codeType} ${frameworkKeywords.join(' ')} security vulnerabilities`);
    }

    // OWASP Top 10 keywords based on code patterns
    const owaspKeywords = detectOWASPCategories(codeContent);
    if (owaspKeywords.length > 0) {
        queries.push(`OWASP ${owaspKeywords.join(' ')} prevention guidelines`);
    }

    return queries;
}

/**
 * Extract function names that might be security-relevant
 */
function extractSecurityFunctionNames(code) {
    const securityPatterns = [
        /(?:def|function|func|fn)\s+(auth\w*|login\w*|validate\w*|sanitize\w*|encrypt\w*|decrypt\w*|hash\w*|verify\w*|check\w*|secure\w*)/gi,
        /(?:class)\s+(Auth\w*|Security\w*|Crypto\w*|Session\w*|Token\w*)/gi
    ];

    const matches = [];
    for (const pattern of securityPatterns) {
        const found = code.match(pattern) || [];
        matches.push(...found.map(m => m.split(/\s+/).pop()));
    }

    return [...new Set(matches)];
}

/**
 * Detect frameworks used in the code
 */
function detectFrameworks(code, codeType) {
    const frameworks = [];

    const frameworkPatterns = {
        'django': /from django|import django|Django/i,
        'flask': /from flask|import flask|Flask/i,
        'fastapi': /from fastapi|FastAPI/i,
        'express': /require\(['"]express['"]\)|from ['"]express['"]/i,
        'react': /from ['"]react['"]\)|import React/i,
        'angular': /@angular|@Component/i,
        'vue': /from ['"]vue['"]/i,
        'spring': /@SpringBoot|@RestController|springframework/i,
        'rails': /ActionController|ActiveRecord/i,
        'laravel': /Illuminate\\|Laravel/i,
        'asp.net': /Microsoft\.AspNetCore|System\.Web/i
    };

    for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
        if (pattern.test(code)) {
            frameworks.push(framework);
        }
    }

    return frameworks;
}

/**
 * Detect OWASP Top 10 categories based on code patterns
 */
function detectOWASPCategories(code) {
    const categories = [];

    // A01:2021 – Broken Access Control
    if (code.match(/admin|role|permission|authorize|access.?control/i)) {
        categories.push('A01 Broken Access Control');
    }

    // A02:2021 – Cryptographic Failures
    if (code.match(/encrypt|decrypt|hash|md5|sha1|aes|rsa|secret|key/i)) {
        categories.push('A02 Cryptographic Failures');
    }

    // A03:2021 – Injection
    if (code.match(/sql|query|exec|eval|system|command/i)) {
        categories.push('A03 Injection');
    }

    // A04:2021 – Insecure Design
    if (code.match(/trust|boundary|threat|model/i)) {
        categories.push('A04 Insecure Design');
    }

    // A05:2021 – Security Misconfiguration
    if (code.match(/config|settings|debug|cors|header/i)) {
        categories.push('A05 Security Misconfiguration');
    }

    // A06:2021 – Vulnerable Components
    if (code.match(/require|import|dependency|package/i)) {
        categories.push('A06 Vulnerable Components');
    }

    // A07:2021 – Identification and Authentication Failures
    if (code.match(/login|auth|session|password|credential|token/i)) {
        categories.push('A07 Authentication Failures');
    }

    // A08:2021 – Software and Data Integrity Failures
    if (code.match(/deserialize|pickle|yaml\.load|json\.parse|unserialize/i)) {
        categories.push('A08 Data Integrity Failures');
    }

    // A09:2021 – Security Logging and Monitoring Failures
    if (code.match(/log|audit|monitor|trace/i)) {
        categories.push('A09 Logging Failures');
    }

    // A10:2021 – Server-Side Request Forgery
    if (code.match(/fetch|request|http|url|redirect/i)) {
        categories.push('A10 SSRF');
    }

    return categories.slice(0, 3); // Return top 3 most relevant
}

/**
 * IMPROVEMENT 6: Build metadata filters based on code analysis
 */
function buildMetadataFilters(files, codeType) {
    const filters = {};
    const codeContent = files.map(f => f.content || '').join('\n');

    // Extract CWE numbers for filtering
    const cweNumbers = [...new Set((codeContent.match(/CWE-(\d+)/gi) || [])
        .map(m => m.toUpperCase()))];
    if (cweNumbers.length > 0) {
        filters.cweIds = cweNumbers;
    }

    // Language filter
    filters.language = codeType.toLowerCase();

    // Detected vulnerability categories
    const vulnCategories = [];
    if (codeContent.match(/sql|query|database/i)) vulnCategories.push('injection');
    if (codeContent.match(/auth|login|session|token/i)) vulnCategories.push('authentication');
    if (codeContent.match(/file|path|directory/i)) vulnCategories.push('file-access');
    if (codeContent.match(/encrypt|crypto|hash/i)) vulnCategories.push('cryptography');
    if (codeContent.match(/input|request|form|param/i)) vulnCategories.push('input-validation');

    if (vulnCategories.length > 0) {
        filters.categories = vulnCategories;
    }

    return filters;
}

/**
 * Build combined filter from document filters and metadata filters
 */
function buildCombinedFilter(documentFilters, metadataFilters) {
    // Start with document filters (required)
    if (documentFilters.length === 0) {
        return null;
    }

    // Separate data source filter from document URI filters
    const dataSourceFilters = documentFilters.filter(f =>
        f.equals?.key === 'x-amz-bedrock-kb-data-source-id'
    );
    const uriFilters = documentFilters.filter(f =>
        f.equals?.key !== 'x-amz-bedrock-kb-data-source-id'
    );

    // Document URI filters are OR'd (match any of the selected documents)
    let uriFilter = null;
    if (uriFilters.length === 1) {
        uriFilter = uriFilters[0];
    } else if (uriFilters.length > 1) {
        uriFilter = { orAll: uriFilters };
    }

    // If we have a data source filter, AND it with the URI filter
    if (dataSourceFilters.length > 0 && uriFilter) {
        return {
            andAll: [
                dataSourceFilters[0], // Per-user data source constraint
                uriFilter,            // Selected document URIs
            ]
        };
    }

    // No data source filter — just use URI filters
    if (uriFilter) {
        return uriFilter;
    }

    // Only data source filter (no specific docs — shouldn't happen but handle gracefully)
    if (dataSourceFilters.length > 0) {
        return dataSourceFilters[0];
    }

    return null;
}

/**
 * Deduplicate and rerank with hybrid scoring (semantic + keyword)
 */
function deduplicateAndRerankHybrid(results, selectedDocuments) {
    const seen = new Map();
    const uniqueResults = [];

    // Build allowed S3 keys for validation
    const allowedS3Keys = new Set(
        (selectedDocuments || []).filter(d => d.s3Key).map(d => d.s3Key)
    );

    for (const result of results) {
        const text = result.content?.text || '';
        if (!text) continue;

        // SECURITY: Validate result belongs to a selected document
        if (allowedS3Keys.size > 0) {
            const sourceUri = result.location?.s3Location?.uri || '';
            const belongsToSelected = [...allowedS3Keys].some(key => sourceUri.includes(key));
            if (!belongsToSelected && sourceUri) {
                // Skip results from unselected documents
                continue;
            }
        }

        // Simple hash for deduplication
        const hash = `${text.substring(0, 100)}_${text.length}`;

        if (seen.has(hash)) {
            const existingIdx = seen.get(hash);
            const existing = uniqueResults[existingIdx];

            // Hybrid scoring: boost if found by both semantic and keyword search
            if (existing.queryType !== result.queryType) {
                existing.hybridBoost = (existing.hybridBoost || 0) + 0.15;
            }

            // Keep higher score
            if ((result.score || 0) > (existing.score || 0)) {
                uniqueResults[existingIdx] = { ...result, hybridBoost: existing.hybridBoost };
            }
        } else {
            seen.set(hash, uniqueResults.length);
            uniqueResults.push({ ...result, hybridBoost: 0 });
        }
    }

    // Sort by combined score
    uniqueResults.sort((a, b) => {
        const aScore = (a.score || 0) + (a.hybridBoost || 0) +
            (a.queryType === 'keyword' ? 0.05 : 0) + // Slight boost for keyword matches
            (a.queryCategory === 'code-patterns' ? 0.1 : 0);
        const bScore = (b.score || 0) + (b.hybridBoost || 0) +
            (b.queryType === 'keyword' ? 0.05 : 0) +
            (b.queryCategory === 'code-patterns' ? 0.1 : 0);

        return bScore - aScore;
    });

    return uniqueResults.slice(0, 15);
}

/**
 * IMPROVEMENT 4: Use LLM to compress chunks and extract most relevant information
 */
async function compressWithLLM(results, codeType, files) {
    // Skip if no results or LLM compression is disabled
    if (results.length === 0 || process.env.DISABLE_LLM_COMPRESSION === 'true') {
        return results.map(r => ({
            ...r,
            compressedText: r.content?.text || ''
        }));
    }

    // Extract code patterns for context
    const codePatterns = extractCodePatterns(files);
    const patternContext = codePatterns.length > 0
        ? `The code contains: ${codePatterns.join(', ')}.`
        : '';

    // Process chunks in batches to avoid token limits
    const batchSize = 5;
    const compressedResults = [];

    for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);

        try {
            const compressionPrompt = buildCompressionPrompt(batch, codeType, patternContext);

            const command = new InvokeModelCommand({
                modelId: 'anthropic.claude-3-haiku-20240307-v1:0', // Use fast model for compression
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    max_tokens: 2048,
                    messages: [{ role: "user", content: compressionPrompt }],
                    temperature: 0.1 // Low temperature for consistent extraction
                })
            });

            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const compressedTexts = parseCompressionResponse(responseBody.content[0].text, batch.length);

            // Map compressed texts back to results
            batch.forEach((result, idx) => {
                compressedResults.push({
                    ...result,
                    compressedText: compressedTexts[idx] || result.content?.text || '',
                    originalLength: (result.content?.text || '').length,
                    compressedLength: (compressedTexts[idx] || '').length
                });
            });

            console.log(`Compressed batch ${Math.floor(i/batchSize) + 1}: avg reduction ${calculateCompressionRatio(batch, compressedTexts)}%`);
        } catch (err) {
            console.error(`LLM compression failed for batch ${Math.floor(i/batchSize) + 1}:`, err.message);
            // Fallback to rule-based compression
            batch.forEach(result => {
                compressedResults.push({
                    ...result,
                    compressedText: compressChunk(result.content?.text || '', 600)
                });
            });
        }
    }

    return compressedResults;
}

/**
 * Build prompt for LLM-based chunk compression
 */
function buildCompressionPrompt(chunks, codeType, patternContext) {
    const chunkTexts = chunks.map((c, i) =>
        `[CHUNK ${i + 1}]\n${c.content?.text || ''}\n[/CHUNK ${i + 1}]`
    ).join('\n\n');

    return `You are a security documentation expert. Extract and compress the most security-relevant information from these knowledge base chunks.

Context: Analyzing ${codeType} code for security vulnerabilities. ${patternContext}

For each chunk, extract ONLY the information relevant to:
- Specific vulnerability descriptions and CWE/CVE references
- Concrete remediation steps and code examples
- Security best practices and guidelines
- Attack patterns and exploitation techniques

Remove:
- Generic introductions and conclusions
- Redundant explanations
- Non-security related content
- Verbose formatting

${chunkTexts}

Return a JSON array with ${chunks.length} compressed strings, one for each chunk:
["compressed chunk 1 text...", "compressed chunk 2 text...", ...]

Keep each compressed chunk under 400 characters while preserving critical security information.
Return ONLY the JSON array, no other text.`;
}

/**
 * Parse the compression response from LLM
 */
function parseCompressionResponse(response, expectedCount) {
    try {
        // Clean the response
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed) && parsed.length === expectedCount) {
            return parsed;
        }

        // If wrong count, return empty to trigger fallback
        console.warn(`Compression returned ${parsed.length} items, expected ${expectedCount}`);
        return [];
    } catch (err) {
        console.error('Failed to parse compression response:', err.message);
        return [];
    }
}

/**
 * Calculate compression ratio for logging
 */
function calculateCompressionRatio(original, compressed) {
    const originalTotal = original.reduce((sum, c) => sum + (c.content?.text?.length || 0), 0);
    const compressedTotal = compressed.reduce((sum, t) => sum + (t?.length || 0), 0);

    if (originalTotal === 0) return 0;
    return Math.round((1 - compressedTotal / originalTotal) * 100);
}

/**
 * Generate multiple targeted queries for comprehensive retrieval
 */
function generateMultipleQueries(files, codeType) {
    const queries = [];

    // Query 1: General security guidelines for the code type
    let fileTypes = '';
    if (Array.isArray(files) && files.length > 1) {
        const languages = [...new Set(files.map(f => f.language).filter(Boolean))];
        fileTypes = languages.length > 0 ? ` including ${languages.join(', ')}` : '';
    }
    queries.push(`Security vulnerabilities, best practices, and guidelines for ${codeType} code${fileTypes}. OWASP guidelines, secure coding standards.`);

    // Query 2: Code-pattern specific query (analyze actual code for patterns)
    const codePatterns = extractCodePatterns(files);
    if (codePatterns.length > 0) {
        queries.push(`Security vulnerabilities related to: ${codePatterns.join(', ')}. Prevention methods and secure alternatives.`);
    }

    // Query 3: Common vulnerability types for this language
    const vulnTypeQuery = getLanguageSpecificVulnQuery(codeType);
    if (vulnTypeQuery) {
        queries.push(vulnTypeQuery);
    }

    return queries;
}

/**
 * Extract security-relevant patterns from code
 */
function extractCodePatterns(files) {
    const patterns = new Set();
    const codeContent = files.map(f => f.content || '').join('\n');

    // SQL patterns
    if (codeContent.match(/SELECT|INSERT|UPDATE|DELETE|FROM|WHERE/i)) {
        patterns.add('SQL queries');
        patterns.add('database operations');
    }

    // Authentication patterns
    if (codeContent.match(/password|login|auth|session|token|jwt|oauth/i)) {
        patterns.add('authentication');
        patterns.add('session management');
    }

    // Input handling
    if (codeContent.match(/request\.|req\.|input|form|param|query/i)) {
        patterns.add('user input handling');
        patterns.add('input validation');
    }

    // File operations
    if (codeContent.match(/file|path|read|write|open|fs\.|io\./i)) {
        patterns.add('file operations');
        patterns.add('path traversal');
    }

    // Network/HTTP
    if (codeContent.match(/http|fetch|axios|request|curl|api/i)) {
        patterns.add('HTTP requests');
        patterns.add('API security');
    }

    // Crypto
    if (codeContent.match(/encrypt|decrypt|hash|md5|sha|crypto|bcrypt/i)) {
        patterns.add('cryptography');
        patterns.add('encryption');
    }

    // Command execution
    if (codeContent.match(/exec|system|spawn|shell|subprocess|eval/i)) {
        patterns.add('command execution');
        patterns.add('code injection');
    }

    // Serialization
    if (codeContent.match(/serialize|deserialize|pickle|json\.parse|yaml\.load/i)) {
        patterns.add('deserialization');
        patterns.add('data parsing');
    }

    return Array.from(patterns);
}

/**
 * Get language-specific vulnerability query
 */
function getLanguageSpecificVulnQuery(codeType) {
    const langVulns = {
        'python': 'Python security: pickle deserialization, eval injection, SSTI, command injection, SQL injection with format strings',
        'javascript': 'JavaScript security: prototype pollution, XSS, CSRF, insecure deserialization, npm dependency vulnerabilities',
        'java': 'Java security: deserialization attacks, XXE injection, SQL injection, LDAP injection, path traversal',
        'php': 'PHP security: SQL injection, RCE, file inclusion, object injection, type juggling',
        'go': 'Go security: race conditions, integer overflow, path traversal, SSRF, improper error handling',
        'rust': 'Rust security: unsafe blocks, memory leaks, panic handling, integer overflow',
        'c': 'C security: buffer overflow, format string, use after free, integer overflow, null pointer dereference',
        'cpp': 'C++ security: buffer overflow, use after free, double free, dangling pointers, RAII violations',
        'csharp': 'C# security: SQL injection, XXE, deserialization, path traversal, LDAP injection',
        'ruby': 'Ruby security: mass assignment, SQL injection, command injection, YAML deserialization',
        'typescript': 'TypeScript security: XSS, prototype pollution, type confusion, npm vulnerabilities'
    };

    const normalizedType = codeType.toLowerCase().replace(/[^a-z]/g, '');
    return langVulns[normalizedType] || null;
}

/**
 * Build enhanced context with better formatting
 * Now uses LLM-compressed text if available from compressWithLLM step
 */
function buildEnhancedContext(results, selectedDocuments) {
    const references = [];
    const contextParts = [];

    // Group results by document for better organization
    const byDocument = new Map();

    for (const result of results) {
        const sourceUri = result.location?.s3Location?.uri || '';
        // Use compressed text if available, otherwise fall back to original
        const text = result.compressedText || result.content?.text || '';
        const originalText = result.content?.text || '';
        const score = result.score || 0;

        if (!text) continue;

        // SECURITY: Verify this result belongs to a selected document
        // This is a defense-in-depth check — Bedrock filters should already scope results,
        // but we validate again to ensure no unselected documents leak into the context.
        const matchingDoc = selectedDocuments.find(doc =>
            doc.s3Key && sourceUri.includes(doc.s3Key)
        );

        if (!matchingDoc) {
            // Result does NOT match any selected document — skip it entirely
            console.warn(`[SECURITY] Discarding RAG result from unselected source: ${sourceUri}`);
            continue;
        }

        const docKey = matchingDoc.id;

        if (!byDocument.has(docKey)) {
            byDocument.set(docKey, {
                document: matchingDoc,
                docName: matchingDoc.title,
                chunks: []
            });
        }

        byDocument.get(docKey).chunks.push({
            text,
            originalText,
            score,
            sourceUri,
            wasCompressed: !!result.compressedText,
            hybridBoost: result.hybridBoost || 0,
            queryType: result.queryType
        });
    }

    // Build context organized by document
    let refIndex = 1;
    for (const [docKey, docData] of byDocument) {
        const { document, docName, chunks } = docData;

        // Add reference for this document
        references.push({
            id: `ref-${refIndex}`,
            documentId: document?.id || null,
            documentTitle: docName,
            sourceUri: chunks[0]?.sourceUri || '',
            chunkCount: chunks.length,
            avgRelevance: chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length,
            excerpt: chunks[0]?.originalText?.substring(0, 200) + (chunks[0]?.originalText?.length > 200 ? '...' : ''),
            // Add metadata about search type
            searchTypes: [...new Set(chunks.map(c => c.queryType).filter(Boolean))],
            wasCompressed: chunks.some(c => c.wasCompressed)
        });

        // Build context section for this document
        const docContext = chunks.map((chunk, idx) => {
            // Use already compressed text if available, otherwise apply rule-based compression
            const displayText = chunk.wasCompressed ? chunk.text : compressChunk(chunk.text, 800);
            const relevanceScore = ((chunk.score + (chunk.hybridBoost || 0)) * 100).toFixed(0);
            const searchType = chunk.queryType === 'keyword' ? ' [keyword match]' : '';
            return `[${docName} - Section ${idx + 1}] (relevance: ${relevanceScore}%${searchType})\n${displayText}`;
        }).join('\n\n');

        contextParts.push(`=== From: ${docName} (Reference ${refIndex}) ===\n${docContext}`);
        refIndex++;
    }

    return {
        context: contextParts.join('\n\n---\n\n'),
        references
    };
}

/**
 * Compress a chunk to focus on most relevant parts
 */
function compressChunk(text, maxLength) {
    if (text.length <= maxLength) return text;

    // Split into paragraphs
    const paragraphs = text.split(/\n\n+/);

    // Prioritize paragraphs with security keywords
    const securityKeywords = [
        'vulnerability', 'attack', 'exploit', 'injection', 'security',
        'risk', 'threat', 'prevention', 'mitigation', 'best practice',
        'cwe', 'owasp', 'cve', 'remediation', 'fix', 'patch'
    ];

    const scoredParagraphs = paragraphs.map(p => {
        const lowerP = p.toLowerCase();
        const score = securityKeywords.reduce((s, kw) => s + (lowerP.includes(kw) ? 1 : 0), 0);
        return { text: p, score };
    });

    // Sort by relevance score
    scoredParagraphs.sort((a, b) => b.score - a.score);

    // Build compressed text
    let compressed = '';
    for (const p of scoredParagraphs) {
        if (compressed.length + p.text.length > maxLength) {
            if (compressed.length < maxLength * 0.5) {
                // Add truncated version if we don't have enough content
                compressed += '\n\n' + p.text.substring(0, maxLength - compressed.length - 10) + '...';
            }
            break;
        }
        compressed += (compressed ? '\n\n' : '') + p.text;
    }

    return compressed || text.substring(0, maxLength) + '...';
}

function buildSecurityAnalysisPrompt(useCase, code, codeType, ragContext = '', selectedDocuments = [], isMultiFile = false, ragReferences = [], graphSummary = '') {
    const customPrompt = useCase.reviewerPrompt || '';
    
    // Build document context section with available references
    let documentContext = '';
    if (selectedDocuments.length > 0) {
        const docList = selectedDocuments.map(doc => `- ${doc.title} (ID: ${doc.id})`).join('\n');
        documentContext = `\n\nAuthorized Reference Documents (the ONLY knowledge sources for this analysis):\n${docList}\n`;
    }
    
    // Build RAG context section
    let ragSection = '';
    if (ragContext && ragContext.length > 0) {
        ragSection = `\n\n=== KNOWLEDGE BASE CONTEXT (YOUR SOLE SOURCE OF TRUTH) ===\nBelow are excerpts from the user's selected documents. These are your ONLY source of security knowledge for this analysis. You may ONLY report vulnerabilities that are described or referenced in these excerpts.\n\n${ragContext}\n\n=== END KNOWLEDGE BASE CONTEXT ===\n`;
    } else {
        ragSection = `\n\nNo knowledge base context was retrieved. You have no authorized knowledge source. Return: {"vulnerabilities": []}\n`;
    }

    // Build reference list for the AI to use
    let referenceList = '';
    if (ragReferences.length > 0) {
        referenceList = `\n\n=== CITABLE REFERENCES ===\n${ragReferences.map(ref =>
            `[${ref.id}] "${ref.documentTitle}" - Excerpt: "${(ref.excerpt || ref.relevantExcerpt || '').substring(0, 150)}..."`
        ).join('\n')}\n=== END CITABLE REFERENCES ===\n`;
    }
    
    const fileContext = isMultiFile ?
        '\n\nThis is a multi-file project. Check all files for vulnerabilities that match the knowledge base context.\n' :
        '';

    // Include code graph summary for multi-file structural analysis
    const graphSection = graphSummary ?
        `\n\n${graphSummary}\n\nIMPORTANT: The CODE STRUCTURE GRAPH above shows compiler-analyzed cross-file call chains and data flows. Pay special attention to:\n- [TAINTED] flows where user input reaches dangerous sinks across files\n- Cross-file calls that pass untrusted data\n- Entry points that receive external input\n` :
        '';

    return `You are a security code reviewer operating under strict document-scoped constraints.

=== BINDING RULES (VIOLATION = INVALID OUTPUT) ===
1. You may ONLY identify vulnerabilities that are explicitly described, referenced, or categorized in the KNOWLEDGE BASE CONTEXT below.
2. You MUST NOT use your general training data, prior knowledge, or any information outside the provided knowledge base excerpts to discover or report vulnerabilities.
3. Every vulnerability you report MUST include a "documentReferences" array with at least one citation from the knowledge base excerpts. If you cannot cite a specific excerpt, you MUST NOT report that vulnerability.
4. If the knowledge base context is empty, missing, or does not relate to any pattern in the code, you MUST return: {"vulnerabilities": []}
5. Your role is to CHECK the code AGAINST the knowledge base — not to perform a general security audit.
=== END BINDING RULES ===

Use Case: ${useCase.title}
Description: ${useCase.content}
Code Type: ${codeType}${documentContext}${referenceList}${ragSection}${fileContext}${graphSection}

${customPrompt ? `Additional Instructions: ${customPrompt}\n` : ''}

Code to analyze:
${code}

TASK: Compare the code above against the vulnerability patterns, security rules, and best practices described in the KNOWLEDGE BASE CONTEXT. For each match — where the code exhibits a pattern that the knowledge base documents warn about — report a vulnerability with these fields:

1. title: Brief description
2. severity: Critical, High, Medium, or Low
3. type: Vulnerability type as described in the knowledge base
4. cweId: CWE identifier (only if mentioned in the knowledge base context)
5. details: 1-2 sentence summary
6. fileName: File where the vulnerability exists
7. lineNumber: Line number (estimate if unclear)
8. confidence: 0.0 to 1.0
9. vulnerableCode: The specific code snippet that contains the vulnerability
10. explanation: Why this code matches the vulnerability pattern described in the knowledge base
11. bestPractices: Remediation steps AS DESCRIBED in the knowledge base documents (do not invent your own)
12. suggestedFix: REQUIRED — The corrected code snippet that fixes the vulnerability based on the bestPractices from the knowledge base. This should be a drop-in replacement for the vulnerableCode field.
13. fixExplanation: Brief explanation of what was changed in the suggestedFix and why it resolves the vulnerability
14. exploitExamples: Only if the knowledge base provides exploit examples; otherwise omit or leave empty
15. attackPath: Only if the knowledge base describes attack scenarios; otherwise omit or leave empty
16. documentReferences: REQUIRED — array of {"documentId": "ref-X", "documentTitle": "...", "relevantExcerpt": "exact quote from knowledge base"}

IMPORTANT REQUIREMENTS:
- Every vulnerability MUST include both "vulnerableCode" and "suggestedFix" fields
- The suggestedFix must be actual code that can replace vulnerableCode directly
- Base the fix on the remediation guidance from the knowledge base context
- Return ONLY a JSON object: {"vulnerabilities": [...]}
- If no code patterns match the knowledge base context, return: {"vulnerabilities": []}
- Do NOT add text outside the JSON. Do NOT report vulnerabilities without knowledge base backing.`;
}

function parseVulnerabilities(aiResponse) {
    try {
        // Remove markdown code blocks if present
        let jsonStr = aiResponse.trim();

        // Remove ```json and ``` if present
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        // Find JSON object
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}') + 1;

        if (startIdx === -1 || endIdx === 0) {
            console.error('No JSON found in response');
            return [];
        }

        jsonStr = jsonStr.substring(startIdx, endIdx);
        const data = JSON.parse(jsonStr);

        let vulnerabilities = data.vulnerabilities || [];

        // Validate that each vulnerability has required fix fields
        vulnerabilities = vulnerabilities.filter(vuln => {
            if (!vuln.vulnerableCode) {
                console.warn(`Vulnerability "${vuln.title}" missing vulnerableCode field - skipping`);
                return false;
            }
            if (!vuln.suggestedFix) {
                console.warn(`Vulnerability "${vuln.title}" missing suggestedFix field - skipping`);
                return false;
            }
            return true;
        });

        return vulnerabilities;
    } catch (error) {
        console.error('Error parsing vulnerabilities:', error);
        console.error('AI Response:', aiResponse);
        return [];
    }
}

/**
 * IMPROVEMENT: Enrich vulnerabilities with RAG references via post-processing
 * This ensures references are attached even if the LLM doesn't cite them properly
 *
 * Strategy:
 * 1. Keep any existing LLM-generated references
 * 2. Match additional references based on semantic similarity
 * 3. Use CWE types, vulnerability categories, and keyword matching
 * 4. Add confidence scores to differentiate LLM-cited vs post-processed references
 */
function enrichVulnerabilitiesWithReferences(vulnerabilities, ragReferences) {
    if (!ragReferences || ragReferences.length === 0) {
        return vulnerabilities;
    }

    return vulnerabilities.map(vuln => {
        // Keep existing references from LLM (if any) and mark them as high confidence
        const existingRefs = (vuln.documentReferences || []).map(ref => ({
            ...ref,
            confidence: 'high',
            source: 'llm-cited'
        }));

        // Find additional matching references via post-processing
        const matchedRefs = findMatchingReferences(vuln, ragReferences, existingRefs);

        // Combine and deduplicate references
        const allRefs = [...existingRefs, ...matchedRefs];
        const uniqueRefs = deduplicateReferences(allRefs);

        // Sort by confidence (high first) and relevance score
        uniqueRefs.sort((a, b) => {
            if (a.confidence === 'high' && b.confidence !== 'high') return -1;
            if (b.confidence === 'high' && a.confidence !== 'high') return 1;
            return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });

        // Limit to top 5 references per vulnerability
        return {
            ...vuln,
            documentReferences: uniqueRefs.slice(0, 5)
        };
    });
}

/**
 * Find matching RAG references for a vulnerability using keyword and semantic matching
 */
function findMatchingReferences(vuln, ragReferences, existingRefs) {
    const matchedRefs = [];
    const existingDocIds = new Set(existingRefs.map(r => r.documentId || r.documentTitle));

    // Extract keywords from vulnerability for matching
    const vulnKeywords = extractVulnerabilityKeywords(vuln);

    for (const ref of ragReferences) {
        // Skip if already cited by LLM
        if (existingDocIds.has(ref.documentId) || existingDocIds.has(ref.documentTitle)) {
            continue;
        }

        // Calculate relevance score based on keyword matching
        const score = calculateReferenceRelevance(vulnKeywords, ref);

        // Include reference if score exceeds threshold
        if (score >= 0.3) {
            matchedRefs.push({
                documentId: ref.documentId || null,
                documentTitle: ref.documentTitle,
                relevantExcerpt: ref.excerpt || ref.relevantExcerpt || '',
                relevanceScore: score,
                confidence: score >= 0.6 ? 'medium' : 'suggested',
                source: 'post-processed'
            });
        }
    }

    return matchedRefs;
}

/**
 * Extract searchable keywords from a vulnerability
 */
function extractVulnerabilityKeywords(vuln) {
    const keywords = new Set();

    // Extract CWE type
    const cweMatch = (vuln.type || '').match(/CWE-(\d+)/i);
    if (cweMatch) {
        keywords.add(`cwe-${cweMatch[1]}`);
        keywords.add(cweMatch[0].toUpperCase());
    }

    // Extract security-related keywords from title and explanation
    const textToAnalyze = `${vuln.title || ''} ${vuln.explanation || ''} ${vuln.details || ''} ${vuln.type || ''}`.toLowerCase();

    // Security vulnerability keywords
    const securityKeywords = [
        'sql injection', 'xss', 'cross-site scripting', 'csrf', 'command injection',
        'path traversal', 'directory traversal', 'authentication', 'authorization',
        'encryption', 'cryptographic', 'session', 'token', 'password', 'credential',
        'buffer overflow', 'memory', 'deserialization', 'ssrf', 'xxe', 'ldap injection',
        'input validation', 'sanitization', 'hardcoded', 'secret', 'api key',
        'owasp', 'a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07', 'a08', 'a09', 'a10',
        'injection', 'broken access', 'cryptographic failure', 'insecure design',
        'misconfiguration', 'vulnerable component', 'integrity failure', 'logging'
    ];

    for (const keyword of securityKeywords) {
        if (textToAnalyze.includes(keyword)) {
            keywords.add(keyword);
        }
    }

    // Extract severity as a keyword
    if (vuln.severity) {
        keywords.add(vuln.severity.toLowerCase());
    }

    return keywords;
}

/**
 * Calculate relevance score between vulnerability keywords and a RAG reference
 */
function calculateReferenceRelevance(vulnKeywords, ref) {
    if (vulnKeywords.size === 0) return 0;

    // Get reference text to search
    const refText = `${ref.documentTitle || ''} ${ref.excerpt || ''} ${ref.relevantExcerpt || ''}`.toLowerCase();

    // Count keyword matches
    let matchCount = 0;
    let weightedScore = 0;

    for (const keyword of vulnKeywords) {
        if (refText.includes(keyword)) {
            matchCount++;
            // CWE matches are weighted higher
            if (keyword.startsWith('cwe-')) {
                weightedScore += 0.4;
            } else if (['critical', 'high'].includes(keyword)) {
                weightedScore += 0.1;
            } else {
                weightedScore += 0.2;
            }
        }
    }

    // Base score from match count
    const baseScore = matchCount / vulnKeywords.size;

    // Combine base score with weighted score (normalize to 0-1)
    const combinedScore = Math.min(1, (baseScore * 0.5) + (weightedScore * 0.5));

    // Factor in the RAG relevance score if available
    const ragScore = ref.relevanceScore || ref.avgRelevance || 0.5;

    return (combinedScore * 0.7) + (ragScore * 0.3);
}

/**
 * Deduplicate references by document ID or title
 */
function deduplicateReferences(refs) {
    const seen = new Map();

    for (const ref of refs) {
        const key = ref.documentId || ref.documentTitle;
        if (!seen.has(key)) {
            seen.set(key, ref);
        } else {
            // Keep the one with higher confidence/score
            const existing = seen.get(key);
            if (ref.confidence === 'high' && existing.confidence !== 'high') {
                seen.set(key, ref);
            } else if ((ref.relevanceScore || 0) > (existing.relevanceScore || 0)) {
                seen.set(key, ref);
            }
        }
    }

    return Array.from(seen.values());
}

// Fallback: Basic pattern matching for common vulnerabilities
// Now accepts ragReferences to suggest relevant documents for pattern-matched vulnerabilities
function detectVulnerabilitiesWithPatterns(code, codeType, ragReferences = []) {
    const vulnerabilities = [];
    
    // SQL Injection patterns
    if (code.match(/f["'].*SELECT.*FROM.*WHERE.*\{.*\}|["'].*SELECT.*FROM.*WHERE.*\+.*\+|execute\(.*\+.*\+|query\s*=\s*f["']/i)) {
        vulnerabilities.push({
            title: "Potential SQL Injection",
            severity: "Critical",
            type: "CWE-89",
            details: "String concatenation or formatting detected in SQL query",
            fileName: "main",
            lineNumber: code.split('\n').findIndex(line => line.match(/SELECT.*FROM/i)) + 1 || 1,
            vulnerableCode: code.split('\n').find(line => line.match(/SELECT.*FROM/i)) || "",
            explanation: "The code appears to use string concatenation or formatting to build SQL queries, which can lead to SQL injection vulnerabilities. Attackers can manipulate input to modify the query structure.",
            bestPractices: "Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.",
            exploitExamples: "An attacker could input: ' OR '1'='1 to bypass authentication or ; DROP TABLE users; -- to delete data.",
            attackPath: "1. Attacker provides malicious input\n2. Input is concatenated into SQL query\n3. Modified query executes with elevated privileges",
            documentReferences: [] // Will be enriched below
        });
    }
    
    // Hardcoded credentials
    if (code.match(/password\s*=\s*["'][^"']+["']|api[_-]?key\s*=\s*["'][^"']+["']|secret\s*=\s*["'][^"']+["']/i)) {
        vulnerabilities.push({
            title: "Hardcoded Credentials",
            severity: "High",
            type: "CWE-798",
            details: "Hardcoded password, API key, or secret detected",
            fileName: "main",
            lineNumber: code.split('\n').findIndex(line => line.match(/password|api[_-]?key|secret/i)) + 1 || 1,
            vulnerableCode: code.split('\n').find(line => line.match(/password|api[_-]?key|secret/i)) || "",
            explanation: "Hardcoded credentials in source code can be discovered by anyone with access to the code repository.",
            bestPractices: "Store credentials in environment variables or secure secret management systems like AWS Secrets Manager.",
            exploitExamples: "Attackers with code access can extract credentials and use them to access systems.",
            attackPath: "1. Attacker gains code access\n2. Credentials extracted from source\n3. Unauthorized system access",
            documentReferences: []
        });
    }
    
    // Command injection
    if (code.match(/os\.system|subprocess\.call|exec\(|eval\(|shell=True/i)) {
        vulnerabilities.push({
            title: "Potential Command Injection",
            severity: "Critical",
            type: "CWE-78",
            details: "Unsafe command execution detected",
            fileName: "main",
            lineNumber: code.split('\n').findIndex(line => line.match(/os\.system|subprocess|exec|eval/i)) + 1 || 1,
            vulnerableCode: code.split('\n').find(line => line.match(/os\.system|subprocess|exec|eval/i)) || "",
            explanation: "Direct execution of system commands with user input can allow attackers to run arbitrary commands.",
            bestPractices: "Avoid executing system commands with user input. Use safe APIs and validate/sanitize all input.",
            exploitExamples: "Attacker could inject: ; rm -rf / or && cat /etc/passwd to execute malicious commands.",
            attackPath: "1. User input passed to command execution\n2. Malicious commands injected\n3. System compromised",
            documentReferences: []
        });
    }
    
    // XSS patterns
    if (code.match(/innerHTML|document\.write|eval\(.*\)|dangerouslySetInnerHTML/i)) {
        vulnerabilities.push({
            title: "Potential Cross-Site Scripting (XSS)",
            severity: "High",
            type: "CWE-79",
            details: "Unsafe HTML rendering detected",
            fileName: "main",
            lineNumber: code.split('\n').findIndex(line => line.match(/innerHTML|document\.write/i)) + 1 || 1,
            vulnerableCode: code.split('\n').find(line => line.match(/innerHTML|document\.write/i)) || "",
            explanation: "Directly inserting user content into HTML can allow attackers to inject malicious scripts.",
            bestPractices: "Use safe DOM manipulation methods and sanitize user input before rendering.",
            exploitExamples: "Attacker injects: <script>alert(document.cookie)</script> to steal session cookies.",
            attackPath: "1. Malicious script injected\n2. Script executes in victim's browser\n3. Session hijacked",
            documentReferences: []
        });
    }
    
    console.log(`Pattern matching found ${vulnerabilities.length} potential vulnerabilities`);

    // IMPROVEMENT: Enrich pattern-matched vulnerabilities with RAG references
    if (ragReferences && ragReferences.length > 0) {
        const enrichedVulns = enrichVulnerabilitiesWithReferences(vulnerabilities, ragReferences);
        console.log(`Enriched pattern-matched vulnerabilities with RAG references`);
        return enrichedVulns;
    }

    return vulnerabilities;
}


// Helper function to convert stream to string
async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}
