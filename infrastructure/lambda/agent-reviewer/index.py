"""
Reviewer Agent - RAG-Enhanced Code Security Analysis
Analyzes code for vulnerabilities using uploaded documents as reference
"""
import json
import os
import boto3
import logging
import time
from datetime import datetime
from typing import Dict, List, Any
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeoutError

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['AWS_REGION'])
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=os.environ['AWS_REGION'])
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')

# Environment variables
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0')
RUNS_TABLE = os.environ['RUNS_TABLE']
ARTIFACTS_TABLE = os.environ['ARTIFACTS_TABLE']
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
AGENT_ARTIFACTS_BUCKET = os.environ['AGENT_ARTIFACTS_BUCKET']

# Configuration
MAX_FILES_TO_ANALYZE = int(os.environ.get('MAX_FILES_TO_ANALYZE', '0'))  # 0 = no limit, analyze all files
MAX_CONCURRENT_ANALYSES = int(os.environ.get('MAX_CONCURRENT_ANALYSES', '10'))  # Parallel API calls
MAX_FILE_SIZE_CHARS = int(os.environ.get('MAX_FILE_SIZE_CHARS', '100000'))  # Skip very large files
LAMBDA_TIMEOUT_BUFFER_SECONDS = 120  # Stop processing 120 seconds before timeout (more buffer for saving results)

# File extensions to analyze (security-relevant code files)
ANALYZABLE_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rb', '.php',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.rs', '.swift', '.kt', '.scala',
    '.sql', '.sh', '.bash', '.ps1', '.yaml', '.yml', '.json', '.xml',
    '.html', '.htm', '.vue', '.svelte'
}

# File patterns to skip
SKIP_PATTERNS = {
    'node_modules/', 'vendor/', 'dist/', 'build/', '.git/', '__pycache__/',
    '.min.js', '.min.css', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
}

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def should_analyze_file(file_path: str, content: str) -> bool:
    """Determine if a file should be analyzed based on extension and size"""
    # Check skip patterns
    for pattern in SKIP_PATTERNS:
        if pattern in file_path:
            return False

    # Check file extension
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ANALYZABLE_EXTENSIONS:
        return False

    # Check file size
    if len(content) > MAX_FILE_SIZE_CHARS:
        logger.warning(f"Skipping large file: {file_path} ({len(content)} chars)")
        return False

    # Skip empty or very small files
    if len(content.strip()) < 50:
        return False

    return True


def get_remaining_time(context) -> int:
    """Get remaining Lambda execution time in seconds"""
    if context and hasattr(context, 'get_remaining_time_in_millis'):
        return context.get_remaining_time_in_millis() // 1000
    return 900  # Default 15 minutes


def handler(event, context):
    """
    Main handler for Reviewer Agent
    Performs RAG-enhanced security code review with parallel processing
    """
    start_time = time.time()

    try:
        run_id = event['runId']
        use_case = event['useCase']
        
        logger.info(f"Starting Reviewer Agent for run {run_id}, use case {use_case['id']}")
        
        # Emit agent started event
        emit_event('reviewer_started', {
            'runId': run_id,
            'useCaseId': use_case['id'],
            'useCaseName': use_case.get('title', 'Unknown')
        })
        
        # Get code files to analyze
        all_code_files = get_code_files(use_case)
        logger.info(f"Found {len(all_code_files)} total files")

        # Filter files to analyze
        code_files = [
            f for f in all_code_files
            if should_analyze_file(f.get('path', f.get('name', '')), f.get('content', ''))
        ]
        logger.info(f"Filtered to {len(code_files)} analyzable files")

        # Sort files by priority (more security-critical first)
        priority_order = ['.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.php', '.rb', '.cs']
        def file_priority(f):
            ext = os.path.splitext(f.get('path', f.get('name', '')))[1].lower()
            try:
                return priority_order.index(ext)
            except ValueError:
                return len(priority_order)
        code_files = sorted(code_files, key=file_priority)

        # Limit number of files only if MAX_FILES_TO_ANALYZE > 0
        if MAX_FILES_TO_ANALYZE > 0 and len(code_files) > MAX_FILES_TO_ANALYZE:
            code_files = code_files[:MAX_FILES_TO_ANALYZE]
            logger.info(f"Limited to {len(code_files)} files for analysis")

        # Get custom prompt if configured
        custom_prompt = use_case.get('reviewerPrompt', '')
        
        # Get selected documents for RAG (fetch context once, reuse for all files)
        selected_documents = use_case.get('selectedDocuments', [])
        # Extract document IDs if documents are objects
        document_ids = []
        if selected_documents:
            if isinstance(selected_documents[0], dict):
                document_ids = [doc.get('id', doc.get('s3Key', '')) for doc in selected_documents]
            else:
                document_ids = selected_documents

        rag_context = retrieve_relevant_context(
            query="Security vulnerabilities, best practices, and code review guidelines",
            selected_documents=document_ids
        )

        # Perform parallel analysis
        vulnerabilities = []
        files_analyzed = 0
        files_skipped = 0
        last_save_time = time.time()
        SAVE_INTERVAL_SECONDS = 60  # Save partial results every 60 seconds

        # Use ThreadPoolExecutor for concurrent analysis
        with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_ANALYSES) as executor:
            # Submit all analysis tasks
            future_to_file = {
                executor.submit(
                    analyze_code_file_safe,
                    code_file,
                    custom_prompt,
                    rag_context,
                    run_id
                ): code_file
                for code_file in code_files
            }

            # Collect results as they complete
            for future in as_completed(future_to_file):
                # Check if we're running out of time
                remaining_time = get_remaining_time(context)
                if remaining_time < LAMBDA_TIMEOUT_BUFFER_SECONDS:
                    logger.warning(f"Running low on time ({remaining_time}s remaining), stopping analysis and saving results")
                    # Cancel remaining futures
                    for f in future_to_file:
                        f.cancel()
                    break

                code_file = future_to_file[future]
                try:
                    file_vulns = future.result(timeout=60)  # 60 second timeout per file for faster processing
                    vulnerabilities.extend(file_vulns)
                    files_analyzed += 1

                    if files_analyzed % 10 == 0:
                        elapsed = time.time() - start_time
                        logger.info(f"Progress: {files_analyzed}/{len(code_files)} files analyzed in {elapsed:.1f}s, {len(vulnerabilities)} vulnerabilities found")
                    
                    # Save partial results periodically
                    if time.time() - last_save_time > SAVE_INTERVAL_SECONDS:
                        save_partial_results(run_id, use_case['id'], vulnerabilities, files_analyzed, files_skipped, len(all_code_files), time.time() - start_time)
                        last_save_time = time.time()

                except FuturesTimeoutError:
                    logger.warning(f"Timeout analyzing file: {code_file.get('name', 'unknown')}")
                    files_skipped += 1
                except Exception as e:
                    logger.error(f"Error analyzing file {code_file.get('name', 'unknown')}: {str(e)}")
                    files_skipped += 1

        elapsed_time = time.time() - start_time
        logger.info(f"Analysis complete: {files_analyzed} files analyzed, {files_skipped} skipped, {len(vulnerabilities)} vulnerabilities found in {elapsed_time:.1f}s")

        # Store full results in S3
        full_output = {
            'vulnerabilities': vulnerabilities,
            'totalCount': len(vulnerabilities),
            'severityCounts': count_by_severity(vulnerabilities),
            'filesAnalyzed': files_analyzed,
            'filesSkipped': files_skipped,
            'totalFiles': len(all_code_files),
            'totalFilteredFiles': len(code_files),
            'analysisTimeSeconds': round(elapsed_time, 2),
            'analysisComplete': files_analyzed + files_skipped >= len(code_files),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Save full output to S3
        artifact_key = f"runs/{run_id}/reviewer/{use_case['id']}/output.json"
        s3.put_object(
            Bucket=AGENT_ARTIFACTS_BUCKET,
            Key=artifact_key,
            Body=json.dumps(full_output, indent=2),
            ContentType='application/json'
        )
        
        # Update DynamoDB (optional - may fail due to permissions)
        update_run_status(run_id, use_case['id'], 'reviewer_completed', full_output)

        # Emit completion event
        emit_event('reviewer_completed', {
            'runId': run_id,
            'useCaseId': use_case['id'],
            'vulnerabilityCount': len(vulnerabilities),
            'filesAnalyzed': files_analyzed
        })
        
        logger.info(f"Reviewer Agent completed for run {run_id}")

        # Return ONLY S3 reference to avoid Step Functions 256KB limit
        # Downstream agents (implementer, reporter) will fetch full data from S3
        return {
            'totalCount': len(vulnerabilities),
            'severityCounts': count_by_severity(vulnerabilities),
            'filesAnalyzed': files_analyzed,
            'filesSkipped': files_skipped,
            'totalFiles': len(all_code_files),
            'analysisTimeSeconds': round(elapsed_time, 2),
            'timestamp': datetime.utcnow().isoformat(),
            # S3 reference for full data - ALL vulnerabilities stored here
            's3Bucket': AGENT_ARTIFACTS_BUCKET,
            's3Key': artifact_key,
            'fullResultsInS3': True
        }

    except Exception as e:
        logger.error(f"Error in Reviewer Agent: {str(e)}", exc_info=True)
        emit_event('reviewer_failed', {
            'runId': event.get('runId'),
            'error': str(e)
        })
        raise


def save_partial_results(run_id: str, use_case_id: str, vulnerabilities: List[Dict], 
                         files_analyzed: int, files_skipped: int, total_files: int, elapsed_time: float):
    """
    Save partial results to S3 during long-running analysis
    """
    try:
        partial_output = {
            'vulnerabilities': vulnerabilities,
            'totalCount': len(vulnerabilities),
            'severityCounts': count_by_severity(vulnerabilities),
            'filesAnalyzed': files_analyzed,
            'filesSkipped': files_skipped,
            'totalFiles': total_files,
            'analysisTimeSeconds': round(elapsed_time, 2),
            'analysisComplete': False,
            'isPartialResult': True,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        artifact_key = f"runs/{run_id}/reviewer/{use_case_id}/output.json"
        s3.put_object(
            Bucket=AGENT_ARTIFACTS_BUCKET,
            Key=artifact_key,
            Body=json.dumps(partial_output, indent=2),
            ContentType='application/json'
        )
        logger.info(f"Saved partial results: {files_analyzed} files, {len(vulnerabilities)} vulnerabilities")
    except Exception as e:
        logger.error(f"Error saving partial results: {str(e)}")


def analyze_code_file_safe(code_file: Dict, custom_prompt: str, rag_context: str, run_id: str) -> List[Dict]:
    """
    Safe wrapper for analyze_code_file that catches exceptions
    """
    try:
        return analyze_code_file(code_file, custom_prompt, rag_context, run_id)
    except Exception as e:
        logger.error(f"Error in analyze_code_file_safe: {str(e)}")
        return []


def analyze_code_file(code_file: Dict, custom_prompt: str, rag_context: str, run_id: str) -> List[Dict]:
    """
    Analyze a single code file for vulnerabilities using RAG
    """
    file_name = code_file['name']
    file_content = code_file['content']
    file_language = code_file.get('language', 'unknown')
    
    logger.info(f"Analyzing file: {file_name}")
    
    # Build analysis prompt (RAG context is pre-fetched)
    system_prompt = build_reviewer_system_prompt(custom_prompt, rag_context)
    
    # Analyze code with Bedrock
    analysis_result = invoke_bedrock_analysis(
        system_prompt=system_prompt,
        code_content=file_content,
        file_name=file_name,
        file_language=file_language
    )
    
    # Parse and structure vulnerabilities
    vulnerabilities = parse_vulnerabilities(analysis_result, file_name)
    
    return vulnerabilities


def retrieve_relevant_context(query: str, selected_documents: List[str]) -> str:
    """
    Retrieve relevant context from Bedrock Knowledge Base using RAG
    """
    if not KNOWLEDGE_BASE_ID:
        logger.warning("Knowledge Base ID not configured, skipping RAG")
        return ""
    
    try:
        # Build retrieval filter for selected documents
        retrieval_filter = None
        if selected_documents:
            retrieval_filter = {
                'equals': {
                    'key': 'documentId',
                    'value': selected_documents
                }
            }
        
        response = bedrock_agent_runtime.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={
                'text': query
            },
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': 10,
                    'overrideSearchType': 'HYBRID'
                }
            }
        )
        
        # Extract and combine retrieved chunks
        contexts = []
        for result in response.get('retrievalResults', []):
            content = result.get('content', {}).get('text', '')
            source = result.get('location', {}).get('s3Location', {}).get('uri', 'Unknown')
            score = result.get('score', 0)
            
            contexts.append({
                'content': content,
                'source': source,
                'score': score
            })
        
        # Format context for prompt
        if contexts:
            formatted_context = "\n\n".join([
                f"[Source: {ctx['source']} | Relevance: {ctx['score']:.2f}]\n{ctx['content']}"
                for ctx in contexts
            ])
            return formatted_context
        
        return ""
        
    except Exception as e:
        logger.error(f"Error retrieving RAG context: {str(e)}")
        return ""


def build_reviewer_system_prompt(custom_prompt: str, rag_context: str) -> str:
    """
    Build the system prompt for the reviewer agent
    """
    base_prompt = """You are an expert security code reviewer. Your task is to analyze code for security vulnerabilities.

For each vulnerability found, provide:
1. Severity (Critical, High, Medium, Low)
2. Title (concise vulnerability name)
3. Type (e.g., Security, Performance, Best Practice)
4. Details (brief description)
5. Vulnerable Code (exact code snippet)
6. Explanation (why this is vulnerable in plain English)
7. Framework-Specific Best Practices (how to fix it properly)
8. Exploit Examples (how an attacker could exploit this)
9. Attack Path (step-by-step attack scenario)
10. CWE ID (if applicable)
11. Document References (if reference documentation is provided, cite relevant sources)

Return results as a JSON array of vulnerability objects.

Example format for each vulnerability:
{
  "title": "SQL Injection",
  "severity": "Critical",
  "type": "CWE-89",
  "details": "...",
  "vulnerableCode": "...",
  "explanation": "...",
  "bestPractices": "...",
  "exploitExamples": "...",
  "attackPath": "...",
  "cweId": "CWE-89",
  "documentReferences": [{"documentTitle": "...", "relevantExcerpt": "..."}]
}"""

    if rag_context:
        base_prompt += f"\n\n## Reference Documentation\nUse the following documentation as reference for your analysis. When your findings relate to this documentation, include document references in your vulnerability output:\n\n{rag_context}"

    if custom_prompt:
        base_prompt += f"\n\n## Custom Instructions\n{custom_prompt}"
    
    return base_prompt


# Token limits for different models (approximate character counts, ~4 chars per token)
MODEL_TOKEN_LIMITS = {
    'claude-3-sonnet': 180000,  # 200K tokens, leave buffer
    'claude-3-haiku': 180000,
    'claude-3-opus': 180000,
    'claude-3-5-sonnet': 180000,
    'claude-2': 90000,
    'default': 90000
}

# Maximum characters per chunk for code analysis
MAX_CODE_CHUNK_CHARS = 50000  # ~12.5K tokens for code content
MAX_TOTAL_INPUT_CHARS = 150000  # Leave room for system prompt and response


def get_model_char_limit() -> int:
    """Get character limit for the current model"""
    model_id = BEDROCK_MODEL_ID.lower()
    for model_key, limit in MODEL_TOKEN_LIMITS.items():
        if model_key in model_id:
            return limit
    return MODEL_TOKEN_LIMITS['default']


def truncate_system_prompt(system_prompt: str, max_chars: int = 50000) -> str:
    """Truncate system prompt if too long, keeping essential parts"""
    if len(system_prompt) <= max_chars:
        return system_prompt

    # Find the base prompt section (before RAG context)
    rag_marker = "## Reference Documentation"
    custom_marker = "## Custom Instructions"

    if rag_marker in system_prompt:
        base_end = system_prompt.find(rag_marker)
        base_prompt = system_prompt[:base_end]

        # Calculate remaining space for RAG context
        remaining = max_chars - len(base_prompt) - 500  # Buffer for markers

        if remaining > 0:
            # Extract and truncate RAG section
            rag_start = base_end
            custom_start = system_prompt.find(custom_marker) if custom_marker in system_prompt else len(system_prompt)
            rag_section = system_prompt[rag_start:custom_start]

            if len(rag_section) > remaining // 2:
                rag_section = rag_section[:remaining // 2] + "\n\n[RAG context truncated due to length...]"

            # Include custom instructions if present
            custom_section = ""
            if custom_marker in system_prompt:
                custom_section = system_prompt[custom_start:]
                if len(custom_section) > remaining // 2:
                    custom_section = custom_section[:remaining // 2] + "\n\n[Custom instructions truncated...]"

            return base_prompt + rag_section + custom_section

    # Simple truncation as fallback
    return system_prompt[:max_chars] + "\n\n[System prompt truncated due to length...]"


def chunk_code_content(code_content: str, max_chunk_size: int = MAX_CODE_CHUNK_CHARS) -> List[Dict]:
    """
    Split large code files into chunks for analysis.
    Tries to split at logical boundaries (functions, classes, blank lines).
    """
    if len(code_content) <= max_chunk_size:
        return [{'content': code_content, 'chunk_index': 0, 'total_chunks': 1}]

    chunks = []
    lines = code_content.split('\n')
    current_chunk = []
    current_size = 0

    # Logical break patterns (function/class definitions, blank lines)
    break_patterns = ['def ', 'class ', 'function ', 'const ', 'let ', 'var ', 'public ', 'private ', 'async ']

    for line in lines:
        line_with_newline = line + '\n'
        line_size = len(line_with_newline)

        # Check if adding this line would exceed the limit
        if current_size + line_size > max_chunk_size and current_chunk:
            # Try to find a good break point (prefer logical boundaries)
            chunks.append('\n'.join(current_chunk))
            current_chunk = []
            current_size = 0

        current_chunk.append(line)
        current_size += line_size

    # Don't forget the last chunk
    if current_chunk:
        chunks.append('\n'.join(current_chunk))

    # Return chunks with metadata
    return [
        {'content': chunk, 'chunk_index': i, 'total_chunks': len(chunks)}
        for i, chunk in enumerate(chunks)
    ]


def invoke_bedrock_analysis(system_prompt: str, code_content: str, file_name: str, file_language: str) -> Dict:
    """
    Invoke Bedrock model for code analysis with chunking support for large files
    """
    # Truncate system prompt if needed
    system_prompt = truncate_system_prompt(system_prompt)

    # Calculate available space for code
    model_limit = get_model_char_limit()
    system_prompt_size = len(system_prompt)
    overhead = 2000  # For user message template, file name, etc.
    available_for_code = model_limit - system_prompt_size - overhead

    logger.info(f"Model limit: {model_limit}, System prompt: {system_prompt_size}, Available for code: {available_for_code}")

    # Check if code needs chunking
    if len(code_content) > available_for_code:
        logger.info(f"Code content ({len(code_content)} chars) exceeds limit ({available_for_code}), chunking...")
        chunks = chunk_code_content(code_content, min(available_for_code, MAX_CODE_CHUNK_CHARS))

        # Analyze each chunk and combine results
        all_results = []
        for chunk_info in chunks:
            chunk_result = invoke_bedrock_single_chunk(
                system_prompt=system_prompt,
                code_content=chunk_info['content'],
                file_name=file_name,
                file_language=file_language,
                chunk_index=chunk_info['chunk_index'],
                total_chunks=chunk_info['total_chunks']
            )
            all_results.append(chunk_result.get('content', ''))

        # Combine all chunk results
        combined_content = '\n\n'.join(all_results)
        return {'content': combined_content, 'chunked': True, 'chunk_count': len(chunks)}
    else:
        return invoke_bedrock_single_chunk(system_prompt, code_content, file_name, file_language)


def invoke_bedrock_single_chunk(system_prompt: str, code_content: str, file_name: str,
                                file_language: str, chunk_index: int = 0, total_chunks: int = 1) -> Dict:
    """
    Invoke Bedrock model for a single chunk of code
    """
    chunk_info = ""
    if total_chunks > 1:
        chunk_info = f" (Part {chunk_index + 1} of {total_chunks})"

    user_message = f"""Analyze the following {file_language} code file for security vulnerabilities:

File: {file_name}{chunk_info}

```{file_language}
{code_content}
```

Provide a comprehensive security analysis following the specified format."""
    
    # Prepare request body based on model
    if 'claude' in BEDROCK_MODEL_ID.lower():
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "temperature": 0.1
        }
    else:
        # Generic format for other models
        body = {
            "prompt": f"{system_prompt}\n\n{user_message}",
            "max_tokens": 4096,
            "temperature": 0.1
        }
    
    response = bedrock_runtime.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    
    # Extract content based on model response format
    if 'claude' in BEDROCK_MODEL_ID.lower():
        content = response_body['content'][0]['text']
    else:
        content = response_body.get('completion', response_body.get('text', ''))
    
    return {'content': content}


def parse_vulnerabilities(analysis_result: Dict, file_name: str) -> List[Dict]:
    """
    Parse the analysis result into structured vulnerability objects.
    Handles both single results and combined results from chunked analysis.
    """
    content = analysis_result.get('content', '')
    was_chunked = analysis_result.get('chunked', False)

    all_vulnerabilities = []

    # If chunked, we may have multiple JSON arrays in the content
    if was_chunked:
        # Extract all JSON arrays from the combined content
        json_arrays = extract_all_json_arrays(content)
        for json_array in json_arrays:
            try:
                vulns = json.loads(json_array)
                if isinstance(vulns, list):
                    all_vulnerabilities.extend(vulns)
            except Exception as e:
                logger.warning(f"Failed to parse JSON array chunk: {str(e)}")
    else:
        # Single result - extract single JSON array
        try:
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                vulns = json.loads(json_str)
                if isinstance(vulns, list):
                    all_vulnerabilities.extend(vulns)
        except Exception as e:
            logger.error(f"Error parsing vulnerabilities: {str(e)}")

    # Ensure each vulnerability has required fields and deduplicate
    seen_vulns = set()
    unique_vulnerabilities = []

    for vuln in all_vulnerabilities:
        # Create a hash for deduplication
        vuln_hash = f"{vuln.get('title', '')}:{vuln.get('vulnerableCode', '')[:100]}"
        if vuln_hash in seen_vulns:
            continue
        seen_vulns.add(vuln_hash)

        vuln['fileName'] = file_name
        vuln.setdefault('severity', 'Medium')
        vuln.setdefault('title', 'Security Issue')
        vuln.setdefault('type', 'Security')
        vuln.setdefault('details', '')
        vuln.setdefault('vulnerableCode', '')
        vuln.setdefault('explanation', '')
        vuln.setdefault('bestPractices', '')
        vuln.setdefault('exploitExamples', '')
        vuln.setdefault('attackPath', '')
        vuln.setdefault('cweId', '')
        vuln.setdefault('documentReferences', [])

        unique_vulnerabilities.append(vuln)

    return unique_vulnerabilities


def extract_all_json_arrays(content: str) -> List[str]:
    """
    Extract all JSON arrays from content that may contain multiple arrays.
    Handles cases where chunked analysis results in multiple separate JSON arrays.
    """
    json_arrays = []
    i = 0

    while i < len(content):
        # Find start of array
        start = content.find('[', i)
        if start == -1:
            break

        # Find matching closing bracket
        bracket_count = 0
        end = start

        for j in range(start, len(content)):
            if content[j] == '[':
                bracket_count += 1
            elif content[j] == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    end = j + 1
                    break

        if bracket_count == 0 and end > start:
            json_str = content[start:end]
            # Verify it's valid JSON
            try:
                json.loads(json_str)
                json_arrays.append(json_str)
            except:
                pass
            i = end
        else:
            i = start + 1

    return json_arrays


def enrich_vulnerabilities_with_references(vulnerabilities: List[Dict], rag_references: List[Dict]) -> List[Dict]:
    """
    IMPROVEMENT: Enrich vulnerabilities with RAG references via post-processing.
    This ensures references are attached even if the LLM doesn't cite them properly.
    """
    if not rag_references:
        return vulnerabilities

    security_keywords = {
        'cwe-89': ['sql injection', 'sql', 'injection', 'query'],
        'cwe-79': ['xss', 'cross-site scripting', 'script injection', 'html injection'],
        'cwe-78': ['command injection', 'os command', 'system command', 'shell'],
        'cwe-798': ['hardcoded', 'credentials', 'password', 'secret', 'api key'],
        'cwe-22': ['path traversal', 'directory traversal', 'file inclusion'],
        'cwe-502': ['deserialization', 'pickle', 'yaml', 'serialize'],
    }

    for vuln in vulnerabilities:
        existing_refs = vuln.get('documentReferences', [])
        existing_doc_ids = {r.get('documentId') or r.get('documentTitle') for r in existing_refs}

        # Mark existing refs as high confidence
        for ref in existing_refs:
            ref['confidence'] = 'high'
            ref['source'] = 'llm-cited'

        # Extract keywords from vulnerability
        vuln_text = f"{vuln.get('title', '')} {vuln.get('type', '')} {vuln.get('explanation', '')}".lower()
        vuln_keywords = set()

        # Extract CWE type
        cwe_match = vuln.get('type', '').lower()
        if cwe_match.startswith('cwe-'):
            vuln_keywords.add(cwe_match)
            if cwe_match in security_keywords:
                vuln_keywords.update(security_keywords[cwe_match])

        # Find matching references
        matched_refs = []
        for ref in rag_references:
            if ref.get('documentId') in existing_doc_ids or ref.get('documentTitle') in existing_doc_ids:
                continue

            ref_text = f"{ref.get('documentTitle', '')} {ref.get('excerpt', '')}".lower()

            # Calculate match score
            match_count = sum(1 for kw in vuln_keywords if kw in ref_text)
            if match_count > 0:
                score = min(1.0, match_count * 0.3 + (ref.get('relevanceScore', 0.5) * 0.3))
                if score >= 0.3:
                    matched_refs.append({
                        'documentId': ref.get('documentId'),
                        'documentTitle': ref.get('documentTitle'),
                        'relevantExcerpt': ref.get('excerpt', '')[:200],
                        'relevanceScore': score,
                        'confidence': 'medium' if score >= 0.6 else 'suggested',
                        'source': 'post-processed'
                    })

        # Combine and limit to top 5
        all_refs = existing_refs + sorted(matched_refs, key=lambda x: x.get('relevanceScore', 0), reverse=True)
        vuln['documentReferences'] = all_refs[:5]

    return vulnerabilities


def get_code_files(use_case: Dict) -> List[Dict]:
    """
    Get code files to analyze from the use case.
    Handles:
    - Single file code (string or object)
    - Project with multiple files (inline or S3 reference)
    """
    code_payload = use_case.get('code', {})
    code_type = use_case.get('codeType', 'Unknown')

    logger.info(f"get_code_files: code_type={code_type}, payload_type={type(code_payload).__name__}")

    # If code is empty, check legacy field
    if not code_payload:
        code_payload = use_case.get('codeFiles', [])
        if code_payload:
            logger.info(f"Using legacy codeFiles field, found {len(code_payload)} files")
            return code_payload

    # Handle string (raw code)
    if isinstance(code_payload, str):
        logger.info(f"Processing raw code string, length={len(code_payload)}")
        return [{
            'name': f'main.{get_extension_for_language(code_type)}',
            'content': code_payload,
            'language': code_type,
            'path': f'main.{get_extension_for_language(code_type)}'
        }]

    # Handle single file object
    if isinstance(code_payload, dict) and code_payload.get('type') == 'single':
        file_name = code_payload.get('fileName', 'main')
        content = code_payload.get('content', '')
        logger.info(f"Processing single file: {file_name}, length={len(content)}")
        return [{
            'name': file_name,
            'content': content,
            'language': code_type,
            'path': file_name
        }]

    # Handle project with S3 reference
    if isinstance(code_payload, dict) and code_payload.get('type') == 'project':
        logger.info(f"Processing project type payload")
        # Check if files are inline or in S3
        if code_payload.get('files'):
            # Files are inline
            files = code_payload['files']
            logger.info(f"Project has {len(files)} inline files")
            return [{
                'name': f.get('path', 'unknown'),
                'content': f.get('content', ''),
                'language': f.get('language', code_type),
                'path': f.get('path', 'unknown')
            } for f in files]

        # Files are in S3
        if code_payload.get('s3Bucket') and code_payload.get('s3Key'):
            logger.info(f"Fetching project from S3: {code_payload['s3Bucket']}/{code_payload['s3Key']}")
            try:
                response = s3.get_object(
                    Bucket=code_payload['s3Bucket'],
                    Key=code_payload['s3Key']
                )
                project_data = json.loads(response['Body'].read())

                if project_data.get('files'):
                    files = project_data['files']
                    logger.info(f"Loaded {len(files)} files from S3")
                    return [{
                        'name': f.get('path', 'unknown'),
                        'content': f.get('content', ''),
                        'language': f.get('language', code_type),
                        'path': f.get('path', 'unknown')
                    } for f in files]
            except Exception as e:
                logger.error(f"Error fetching project from S3: {str(e)}")
                return []

    # Fallback - try to use as list of files
    if isinstance(code_payload, list):
        logger.info(f"Processing list of {len(code_payload)} files")
        return [{
            'name': f.get('path', f.get('name', 'unknown')),
            'content': f.get('content', ''),
            'language': f.get('language', code_type),
            'path': f.get('path', f.get('name', 'unknown'))
        } for f in code_payload]

    logger.warning(f"Unknown code payload format: {type(code_payload)}, keys={code_payload.keys() if isinstance(code_payload, dict) else 'N/A'}")
    return []


def get_extension_for_language(language: str) -> str:
    """Get file extension for a programming language"""
    extensions = {
        'python': 'py',
        'javascript': 'js',
        'typescript': 'ts',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'c++': 'cpp',
        'csharp': 'cs',
        'c#': 'cs',
        'go': 'go',
        'rust': 'rs',
        'ruby': 'rb',
        'php': 'php',
        'swift': 'swift',
        'kotlin': 'kt',
        'scala': 'scala',
        'html': 'html',
        'css': 'css',
        'sql': 'sql',
        'shell': 'sh',
        'bash': 'sh',
        'powershell': 'ps1',
    }
    return extensions.get(language.lower(), 'txt')


def count_by_severity(vulnerabilities: List[Dict]) -> Dict[str, int]:
    """
    Count vulnerabilities by severity
    """
    counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
    for vuln in vulnerabilities:
        severity = vuln.get('severity', 'Medium')
        if severity in counts:
            counts[severity] += 1
    return counts


def update_run_status(run_id: str, use_case_id: str, status: str, output: Dict):
    """
    Update run status in DynamoDB (optional - won't fail if permissions are missing)
    """
    try:
        # Convert floats to Decimal for DynamoDB
        def convert_floats(obj):
            if isinstance(obj, float):
                return Decimal(str(obj))
            elif isinstance(obj, dict):
                return {k: convert_floats(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_floats(i) for i in obj]
            return obj

        dynamo_safe_output = convert_floats(output)

        table = dynamodb.Table(RUNS_TABLE)
        table.update_item(
            Key={'runId': run_id},
            UpdateExpression='SET #status = :status, reviewerOutput = :output, updatedAt = :timestamp',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': status,
                ':output': dynamo_safe_output,
                ':timestamp': datetime.utcnow().isoformat()
            }
        )
        logger.info(f"Updated run status in DynamoDB: {run_id}")
    except Exception as e:
        # Log but don't fail - results are already saved to S3
        logger.warning(f"Could not update DynamoDB (results saved to S3): {str(e)}")


def emit_event(event_type: str, detail: Dict):
    """
    Emit event to EventBridge
    """
    try:
        events.put_events(
            Entries=[{
                'Source': 'orchestrator.reviewer',
                'DetailType': event_type,
                'Detail': json.dumps(detail),
                'EventBusName': EVENT_BUS_NAME
            }]
        )
    except Exception as e:
        logger.error(f"Error emitting event: {str(e)}")
