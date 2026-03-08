/**
 * Agent Reporter Lambda Function
 * Generates security report from vulnerability findings and saves to database
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const https = require('https');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

exports.handler = async (event) => {
    console.log('Agent Reporter - Event:', JSON.stringify(event, null, 2));
    
    try {
        const { runId, useCase, reviewerOutput } = event;
        
        if (!runId) {
            throw new Error('Missing required field: runId');
        }
        
        console.log(`Generating report for run ${runId}`);
        
        // Get vulnerabilities from reviewer output
        let vulnerabilities = reviewerOutput?.vulnerabilities || [];
        
        // If vulnerabilities is an S3 reference, fetch from S3
        if (typeof vulnerabilities === 'object' && vulnerabilities.s3Bucket && vulnerabilities.s3Key) {
            console.log(`Fetching vulnerabilities from S3: ${vulnerabilities.s3Bucket}/${vulnerabilities.s3Key}`);
            try {
                const getCommand = new GetObjectCommand({
                    Bucket: vulnerabilities.s3Bucket,
                    Key: vulnerabilities.s3Key,
                });
                const response = await s3Client.send(getCommand);
                const bodyString = await streamToString(response.Body);
                vulnerabilities = JSON.parse(bodyString);
                console.log(`Fetched ${vulnerabilities.length} vulnerabilities from S3`);
            } catch (s3Error) {
                console.error('Error fetching vulnerabilities from S3:', s3Error);
                throw new Error(`Failed to fetch vulnerabilities from S3: ${s3Error.message}`);
            }
        }
        
        console.log(`Processing ${vulnerabilities.length} vulnerabilities`);
        
        // Save vulnerabilities to database via internal API
        if (vulnerabilities.length > 0) {
            await saveVulnerabilitiesToDatabase(runId, useCase, vulnerabilities);
        }
        
        // Calculate statistics
        const severityCounts = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0
        };
        
        vulnerabilities.forEach(vuln => {
            const severity = vuln.severity;
            if (severity && severityCounts.hasOwnProperty(severity)) {
                severityCounts[severity]++;
            }
        });
        
        // Generate executive summary using Bedrock
        let summary = '';
        let recommendations = [];
        
        if (vulnerabilities.length > 0) {
            try {
                // Determine if this is a multi-file project
                const uniqueFiles = [...new Set(vulnerabilities.map(v => v.fileName))];
                const isMultiFile = uniqueFiles.length > 1;
                
                const summaryPrompt = buildSummaryPrompt(vulnerabilities, severityCounts, isMultiFile, uniqueFiles);
                
                const modelId = useCase?.reporterModel || 'anthropic.claude-3-haiku-20240307-v1:0';
                console.log(`Calling Bedrock model: ${modelId}`);
                
                const command = new InvokeModelCommand({
                    modelId: modelId,
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify({
                        anthropic_version: "bedrock-2023-05-31",
                        max_tokens: 2048,
                        messages: [
                            {
                                role: "user",
                                content: summaryPrompt
                            }
                        ],
                        temperature: 0.5
                    })
                });
                
                const response = await bedrockClient.send(command);
                const responseBody = JSON.parse(new TextDecoder().decode(response.body));
                const aiResponse = responseBody.content[0].text;
                
                console.log('Bedrock summary generated');
                
                // Parse summary and recommendations
                const parsed = parseSummaryResponse(aiResponse);
                summary = parsed.summary;
                recommendations = parsed.recommendations;
            } catch (bedrockError) {
                console.error('Bedrock error (using fallback):', bedrockError.message);
                // Fallback to dynamic summary derived from actual data
                summary = `Security analysis identified ${vulnerabilities.length} vulnerability(ies): ${severityCounts.Critical} Critical, ${severityCounts.High} High, ${severityCounts.Medium} Medium, ${severityCounts.Low} Low.`;
                recommendations = buildFallbackRecommendations(vulnerabilities, severityCounts);
            }
        } else {
            summary = 'No security vulnerabilities were found in the analyzed code.';
            recommendations = [];
        }
        
        console.log('Report generated successfully');
        
        // Return report
        return {
            summary: summary,
            totalVulnerabilities: vulnerabilities.length,
            severityCounts: severityCounts,
            recommendations: recommendations,
            reportGenerated: true
        };
        
    } catch (error) {
        console.error('Error in agent-reporter:', error);
        throw error;
    }
};

async function saveVulnerabilitiesToDatabase(runId, useCase, vulnerabilities) {
    // Use pg library to save directly to PostgreSQL
    const { Client } = require('pg');
    
    // Parse DATABASE_URL if DB_HOST is not set
    let dbConfig;
    if (process.env.DB_HOST) {
        dbConfig = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        };
    } else if (process.env.DATABASE_URL) {
        // Parse DATABASE_URL
        const url = new URL(process.env.DATABASE_URL);
        dbConfig = {
            host: url.hostname,
            port: parseInt(url.port || '5432'),
            database: url.pathname.slice(1).split('?')[0],
            user: url.username,
            password: url.password,
            ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
        };
    } else {
        console.error('No database configuration found');
        return;
    }
    
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('Connected to database');
        
        let savedCount = 0;
        
        for (const vuln of vulnerabilities) {
            const query = `
                INSERT INTO "Vulnerability" (
                    id, "workflowRunId", "useCaseId", severity, title, type, 
                    details, "fileName", "vulnerableCode", explanation, 
                    "bestPractices", "exploitExamples", "attackPath", "cweId",
                    "documentReferences", "lineNumber", "columnNumber", confidence, 
                    "falsePositive", resolved, "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
                )
            `;
            
            // Get useCaseId from parameter
            const useCaseId = useCase?.id || 'unknown';
            
            // Format documentReferences as JSON for PostgreSQL
            const documentReferences = vuln.documentReferences && vuln.documentReferences.length > 0
                ? JSON.stringify(vuln.documentReferences)
                : null;

            const values = [
                runId,
                useCaseId,
                vuln.severity || '',
                vuln.title || '',
                vuln.type || '',
                vuln.details || '',
                vuln.fileName || '',
                vuln.vulnerableCode || null,
                vuln.explanation || null,
                vuln.bestPractices || null,
                vuln.exploitExamples || null,
                vuln.attackPath || null,
                vuln.cweId || null,
                documentReferences,
                vuln.lineNumber || null,
                vuln.columnNumber || null,
                vuln.confidence ?? null,
                false,
                false
            ];
            
            await client.query(query, values);
            savedCount++;
        }
        
        console.log(`Successfully saved ${savedCount} vulnerabilities to database`);
        
    } catch (error) {
        console.error('Error saving vulnerabilities to database:', error);
        // Don't throw - continue with report generation even if save fails
    } finally {
        await client.end();
    }
}

function buildSummaryPrompt(vulnerabilities, severityCounts, isMultiFile = false, uniqueFiles = []) {
    const vulnSummaries = vulnerabilities.slice(0, 10).map(v => 
        `- ${v.title} (${v.severity}) in ${v.fileName || '—'}: ${v.details || v.explanation}`
    ).join('\n');
    
    const projectScope = isMultiFile 
        ? `Multi-file project analysis (${uniqueFiles.length} files analyzed)`
        : 'Single file analysis';
    
    return `Generate an executive summary for a security code review.

Scope: ${projectScope}

Findings:
- Total vulnerabilities: ${vulnerabilities.length}
- Critical: ${severityCounts.Critical}
- High: ${severityCounts.High}
- Medium: ${severityCounts.Medium}
- Low: ${severityCounts.Low}

Top Vulnerabilities:
${vulnSummaries}

Provide:
1. Executive Summary: 2-3 sentences summarizing the overall security posture
2. Top 3-5 Recommendations: Specific, actionable recommendations prioritized by impact

Format your response as JSON:
{
  "summary": "Executive summary text here...",
  "recommendations": [
    "First recommendation",
    "Second recommendation",
    "Third recommendation"
  ]
}

Return ONLY the JSON object, no additional text.`;
}

function parseSummaryResponse(aiResponse) {
    try {
        // Remove markdown code blocks if present
        let jsonStr = aiResponse.trim();
        
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        
        // Find JSON object
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}') + 1;
        
        if (startIdx !== -1 && endIdx > 0) {
            jsonStr = jsonStr.substring(startIdx, endIdx);
            const data = JSON.parse(jsonStr);
            
            return {
                summary: data.summary || '',
                recommendations: data.recommendations || []
            };
        }
        
        // Fallback: treat entire response as summary
        return {
            summary: aiResponse,
            recommendations: []
        };
    } catch (error) {
        console.error('Error parsing summary:', error);
        return {
            summary: '',
            recommendations: []
        };
    }
}

/**
 * Build fallback recommendations dynamically from actual vulnerability data
 * when the AI summary generation fails.
 */
function buildFallbackRecommendations(vulnerabilities, severityCounts) {
    const recs = [];

    if (severityCounts.Critical > 0) {
        recs.push(`Remediate ${severityCounts.Critical} critical-severity finding${severityCounts.Critical === 1 ? '' : 's'} immediately`);
    }
    if (severityCounts.High > 0) {
        recs.push(`Address ${severityCounts.High} high-severity finding${severityCounts.High === 1 ? '' : 's'} as a priority`);
    }
    if (severityCounts.Medium > 0) {
        recs.push(`Review and plan fixes for ${severityCounts.Medium} medium-severity finding${severityCounts.Medium === 1 ? '' : 's'}`);
    }
    if (severityCounts.Low > 0) {
        recs.push(`Evaluate ${severityCounts.Low} low-severity finding${severityCounts.Low === 1 ? '' : 's'} for potential hardening`);
    }

    // Add context-specific recommendations based on vulnerability types found
    const uniqueTypes = [...new Set(vulnerabilities.map(v => v.type).filter(Boolean))];
    if (uniqueTypes.length > 0) {
        recs.push(`Focus areas: ${uniqueTypes.slice(0, 5).join(', ')}`);
    }

    return recs;
}


// Helper function to convert stream to string
async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}
