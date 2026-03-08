"""
Implementer Agent - Generates fixes for identified vulnerabilities
"""
import json
import os
import boto3
import logging
import re
from datetime import datetime
from typing import List, Dict, Any
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Try to import psycopg2, fall back gracefully if not available
try:
    import psycopg2
    HAS_PSYCOPG2 = True
except ImportError as e:
    HAS_PSYCOPG2 = False
    psycopg2 = None
    print(f"Warning: psycopg2 not available: {e}")

bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['AWS_REGION'])
s3 = boto3.client('s3')
events = boto3.client('events')

BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID')
AGENT_ARTIFACTS_BUCKET = os.environ['AGENT_ARTIFACTS_BUCKET']
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
DATABASE_URL = os.environ.get('DATABASE_URL')

# Cache for working model - avoid retrying failing model every time
WORKING_MODEL_ID = None
# Max time to spend processing (leave 60s buffer for saving results)
MAX_PROCESSING_TIME_SECONDS = 840  # 14 minutes

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def download_from_s3(bucket: str, key: str) -> dict:
    """Download and parse JSON from S3"""
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error downloading from S3: {e}")
        return None


def get_db_connection():
    """Get PostgreSQL database connection"""
    if not HAS_PSYCOPG2:
        logger.warning("psycopg2 not available, skipping database operations")
        return None

    # Clean up DATABASE_URL for psycopg2 compatibility
    db_url = DATABASE_URL.strip() if DATABASE_URL else DATABASE_URL
    if db_url:
        parsed = urlparse(db_url)
        if parsed.query:
            params = parse_qs(parsed.query, keep_blank_values=True)
            # Remove Prisma-specific params (schema, connection_limit, pool_timeout, etc.)
            prisma_params = {'schema', 'connection_limit', 'pool_timeout', 'pgbouncer'}
            filtered = {k: v for k, v in params.items() if k not in prisma_params}
            # Fix invalid sslmode values (Prisma/Node.js use 'no-verify', libpq expects 'require')
            if 'sslmode' in filtered:
                invalid_to_valid = {'no-verify': 'require', 'noverify': 'require'}
                filtered['sslmode'] = [
                    invalid_to_valid.get(v, v) for v in filtered['sslmode']
                ]
            clean_query = urlencode(filtered, doseq=True)
            db_url = urlunparse(parsed._replace(query=clean_query))

    return psycopg2.connect(db_url)

def handler(event, context):
    """Generate fixes for vulnerabilities"""
    global WORKING_MODEL_ID
    start_time = datetime.utcnow()

    try:
        run_id = event['runId']
        use_case = event['useCase']
        reviewer_output = event.get('reviewerOutput', {})

        logger.info(f"Starting Implementer Agent for run {run_id}")
        
        emit_event('implementer_started', {
            'runId': run_id,
            'useCaseId': use_case['id']
        })
        
        # If reviewer output has S3 reference, fetch full data
        if reviewer_output.get('fullResultsInS3'):
            logger.info(f"Fetching full reviewer output from S3: {reviewer_output.get('s3Key')}")
            try:
                full_data = download_from_s3(reviewer_output['s3Bucket'], reviewer_output['s3Key'])
                if full_data:
                    vulnerabilities = full_data.get('vulnerabilities', [])
                else:
                    vulnerabilities = reviewer_output.get('vulnerabilities', [])
            except Exception as e:
                logger.warning(f"Could not fetch from S3, using inline vulnerabilities: {e}")
                vulnerabilities = reviewer_output.get('vulnerabilities', [])
        else:
            # Get vulnerabilities directly
            vulnerabilities = reviewer_output.get('vulnerabilities', [])

        logger.info(f"Processing {len(vulnerabilities)} vulnerabilities")

        # Get code payload and normalize it to a list of files
        code_files = get_code_files(use_case)
        logger.info(f"Got {len(code_files)} code files")

        # Log first few file paths for debugging
        if code_files:
            file_paths = [f.get('path', f.get('name', 'unknown')) for f in code_files[:5]]
            logger.info(f"Sample code file paths: {file_paths}")

        custom_prompt = use_case.get('implementerPrompt', '')
        
        # Group vulnerabilities by file
        vulns_by_file = {}
        for vuln in vulnerabilities:
            file_name = vuln.get('fileName', vuln.get('file', 'unknown'))
            if file_name not in vulns_by_file:
                vulns_by_file[file_name] = []
            vulns_by_file[file_name].append(vuln)
        
        logger.info(f"Grouped vulnerabilities into {len(vulns_by_file)} files")
        if vulns_by_file:
            sample_vuln_files = list(vulns_by_file.keys())[:5]
            logger.info(f"Sample vulnerability file names: {sample_vuln_files}")

        # Generate fixes for each file (with time limit)
        all_fixes = []
        files_processed = 0
        files_skipped = 0
        time_limit_reached = False

        for file_name, file_vulns in vulns_by_file.items():
            # Check time limit before processing each file
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            if elapsed > MAX_PROCESSING_TIME_SECONDS:
                logger.warning(f"Time limit reached after {elapsed:.1f}s, stopping fix generation")
                time_limit_reached = True
                files_skipped = len(vulns_by_file) - files_processed
                break

            # Find original file content from normalized code_files
            original_file = None
            for f in code_files:
                if f.get('path') == file_name or f.get('name') == file_name:
                    original_file = f
                    break

            if not original_file:
                logger.warning(f"Original file not found for {file_name}")
                files_skipped += 1
                continue
            
            # Generate fixes for all vulnerabilities in this file (batched)
            try:
                file_fixes = generate_fixes_for_file_batched(
                    file_name,
                    original_file.get('content', ''),
                    file_vulns,
                    custom_prompt,
                    use_case.get('implementerModel', BEDROCK_MODEL_ID)
                )
                all_fixes.extend(file_fixes)
                files_processed += 1
            except Exception as e:
                logger.error(f"Error generating fixes for {file_name}: {e}")
                files_skipped += 1
                continue

        logger.info(f"Generated {len(all_fixes)} fixes for {files_processed} files (skipped {files_skipped})")

        # Store vulnerabilities and fixes in database
        store_fixes_in_db(all_fixes, run_id, use_case['id'], vulnerabilities)
        
        # Full output saved to S3
        full_output = {
            'fixes': all_fixes,
            'totalFixes': len(all_fixes),
            'filesFixed': len(vulns_by_file),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Save to S3
        artifact_key = f"runs/{run_id}/implementer/{use_case['id']}/output.json"
        s3.put_object(
            Bucket=AGENT_ARTIFACTS_BUCKET,
            Key=artifact_key,
            Body=json.dumps(full_output, indent=2),
            ContentType='application/json'
        )
        
        emit_event('implementer_completed', {
            'runId': run_id,
            'useCaseId': use_case['id'],
            'fixCount': len(all_fixes)
        })
        
        # Return S3 reference to avoid Step Functions 256KB limit
        return {
            'totalFixes': len(all_fixes),
            'filesFixed': files_processed,
            'filesSkipped': files_skipped,
            'timeLimitReached': time_limit_reached,
            'timestamp': datetime.utcnow().isoformat(),
            's3Bucket': AGENT_ARTIFACTS_BUCKET,
            's3Key': artifact_key,
            'fullResultsInS3': True
        }

    except Exception as e:
        logger.error(f"Error in Implementer Agent: {str(e)}", exc_info=True)
        emit_event('implementer_failed', {
            'runId': event.get('runId'),
            'error': str(e)
        })
        raise


def generate_fixes_for_file_batched(
    file_name: str,
    original_code: str,
    vulnerabilities: List[Dict],
    custom_prompt: str,
    model_id: str
) -> List[Dict]:
    """
    Generate fixes for ALL vulnerabilities in a file using a single LLM call.
    This is much more efficient than processing one vulnerability at a time.
    """
    global WORKING_MODEL_ID

    if not vulnerabilities:
        return []

    # Build a comprehensive prompt for all vulnerabilities
    vuln_summary = []
    for i, vuln in enumerate(vulnerabilities, 1):
        vuln_summary.append(f"""
Vulnerability #{i}:
- Type: {vuln.get('type', 'Unknown')}
- Severity: {vuln.get('severity', 'Unknown')}
- Line: {vuln.get('lineNumber', 'Unknown')}
- Description: {vuln.get('details', '')[:500]}
- Code: {vuln.get('vulnerableCode', '')[:300]}
""")

    vulns_text = "\n".join(vuln_summary)

    # Truncate code if too long
    code_preview = original_code[:10000] if len(original_code) > 10000 else original_code

    prompt = f"""You are a security expert. Analyze and fix the following {len(vulnerabilities)} vulnerabilities in {file_name}.

FILE CONTENT:
```
{code_preview}
```

VULNERABILITIES TO FIX:
{vulns_text}

{custom_prompt if custom_prompt else ''}

For each vulnerability, provide a JSON response with this structure:
{{
  "fixes": [
    {{
      "vulnerabilityNumber": 1,
      "fixedCode": "the corrected code snippet",
      "explanation": "brief explanation of the fix",
      "confidence": 0.9
    }}
  ]
}}

Respond ONLY with the JSON, no other text."""

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 8192,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    # Use cached working model or try fallbacks
    models_to_try = []
    if WORKING_MODEL_ID:
        models_to_try = [WORKING_MODEL_ID]
    else:
        models_to_try = [
            model_id,
            "anthropic.claude-3-sonnet-20240229-v1:0",
            "anthropic.claude-3-haiku-20240307-v1:0"
        ]

    response = None
    for try_model_id in models_to_try:
        try:
            response = bedrock_runtime.invoke_model(
                modelId=try_model_id,
                body=json.dumps(body)
            )
            WORKING_MODEL_ID = try_model_id  # Cache working model
            break
        except Exception as e:
            if "inference profile" in str(e).lower() or "ValidationException" in str(type(e).__name__):
                logger.warning(f"Model {try_model_id} requires inference profile, trying fallback...")
                continue
            raise

    if not response:
        raise Exception("All models failed")

    response_body = json.loads(response['body'].read())
    fix_content = response_body['content'][0]['text']

    # Parse the batched response
    fixes = []
    try:
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', fix_content)
        if json_match:
            fix_data = json.loads(json_match.group())
            fix_list = fix_data.get('fixes', [])

            for fix_item in fix_list:
                vuln_num = fix_item.get('vulnerabilityNumber', 1) - 1
                if 0 <= vuln_num < len(vulnerabilities):
                    vuln = vulnerabilities[vuln_num]
                    fixes.append({
                        'vulnerabilityId': vuln.get('id'),
                        'fileName': file_name,
                        'originalCode': vuln.get('vulnerableCode', ''),
                        'fixedCode': fix_item.get('fixedCode', ''),
                        'explanation': fix_item.get('explanation', ''),
                        'confidence': fix_item.get('confidence', 0.8),
                        'startLine': vuln.get('lineNumber', 0),
                        'language': detect_language(file_name)
                    })
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse batched fix response: {e}")
        # Fall back to creating placeholder fixes
        for vuln in vulnerabilities:
            fixes.append({
                'vulnerabilityId': vuln.get('id'),
                'fileName': file_name,
                'originalCode': vuln.get('vulnerableCode', ''),
                'fixedCode': '',
                'explanation': 'Fix generation failed - manual review required',
                'confidence': 0.0,
                'startLine': vuln.get('lineNumber', 0),
                'language': detect_language(file_name)
            })

    return fixes


def generate_fixes_for_file(
    file_name: str,
    original_code: str,
    vulnerabilities: List[Dict],
    custom_prompt: str,
    model_id: str
) -> List[Dict]:
    """Generate fixes for all vulnerabilities in a file"""
    fixes = []
    
    for vuln in vulnerabilities:
        try:
            fix = generate_fix_for_vulnerability(
                file_name,
                original_code,
                vuln,
                custom_prompt,
                model_id
            )
            fixes.append(fix)
        except Exception as e:
            logger.error(f"Error generating fix for vulnerability {vuln.get('id')}: {str(e)}")
            continue
    
    return fixes

def generate_fix_for_vulnerability(
    file_name: str,
    original_code: str,
    vulnerability: Dict,
    custom_prompt: str,
    model_id: str
) -> Dict:
    """Generate a fix for a single vulnerability"""
    
    # Build prompt for Bedrock
    prompt = build_fix_prompt(file_name, original_code, vulnerability, custom_prompt)
    
    # Call Bedrock to generate fix
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    # Try the specified model, fall back to Sonnet if it fails
    # Claude 3.5 Haiku requires inference profile, Sonnet works with direct invocation
    fallback_models = [
        model_id,
        "anthropic.claude-3-sonnet-20240229-v1:0",
        "anthropic.claude-3-haiku-20240307-v1:0"
    ]

    last_error = None
    for try_model_id in fallback_models:
        try:
            response = bedrock_runtime.invoke_model(
                modelId=try_model_id,
                body=json.dumps(body)
            )
            break  # Success
        except Exception as e:
            last_error = e
            if "inference profile" in str(e).lower() or "ValidationException" in str(type(e).__name__):
                logger.warning(f"Model {try_model_id} requires inference profile, trying fallback...")
                continue
            raise  # Re-raise if it's a different error
    else:
        # All models failed
        raise last_error

    response_body = json.loads(response['body'].read())
    fix_content = response_body['content'][0]['text']
    
    # Parse the fix response
    fix_data = parse_fix_response(fix_content)
    
    # Extract vulnerable code section
    vulnerable_code = vulnerability.get('vulnerableCode', '')
    line_number = vulnerability.get('lineNumber', 0)
    
    # Detect language from file extension
    language = detect_language(file_name)
    
    return {
        'vulnerabilityId': vulnerability.get('id'),
        'fileName': file_name,
        'originalCode': vulnerable_code,
        'fixedCode': fix_data.get('fixedCode', ''),
        'changes': fix_data.get('changes', []),
        'explanation': fix_data.get('explanation', ''),
        'confidence': fix_data.get('confidence', 0.9),
        'startLine': line_number,
        'endLine': line_number + len(vulnerable_code.split('\n')) if vulnerable_code else line_number + 1,
        'language': language
    }

def build_fix_prompt(file_name: str, original_code: str, vulnerability: Dict, custom_prompt: str) -> str:
    """Build prompt for Bedrock to generate fix"""
    
    # Truncate code to prevent token limit issues
    vulnerable_code = vulnerability.get('vulnerableCode', '')[:3000]  # Max 3K chars for vulnerable code
    context_code = original_code[:8000]  # Max 8K chars for context

    prompt = f"""You are a security expert. Fix the following vulnerability in {file_name}.

VULNERABILITY:
Type: {vulnerability.get('type', 'Unknown')}
Severity: {vulnerability.get('severity', 'Unknown')}
Description: {vulnerability.get('details', '')}
Location: Line {vulnerability.get('lineNumber', 'Unknown')}

VULNERABLE CODE:
```
{vulnerable_code}
```

FULL FILE CONTEXT:
```
{context_code}{'...[truncated]' if len(original_code) > 8000 else ''}
```

{f'CUSTOM INSTRUCTIONS: {custom_prompt}' if custom_prompt else ''}

TASK:
1. Generate secure code that fixes this vulnerability
2. Explain what you changed and why
3. Ensure the fix doesn't break existing functionality
4. Follow best practices for {vulnerability.get('type', 'security')}

RESPONSE FORMAT (JSON):
{{
  "fixedCode": "the complete fixed code block",
  "changes": [
    {{
      "line": 42,
      "before": "old code",
      "after": "new code",
      "reason": "why this change fixes the vulnerability"
    }}
  ],
  "explanation": "overall explanation of the fix",
  "confidence": 0.95
}}

Return ONLY the JSON object, no additional text."""
    
    return prompt

def parse_fix_response(response_text: str) -> Dict:
    """Parse the fix response from Bedrock"""
    try:
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        # Fallback: return raw response
        return {
            'fixedCode': response_text,
            'changes': [],
            'explanation': 'Fix generated',
            'confidence': 0.8
        }
    except Exception as e:
        logger.error(f"Error parsing fix response: {str(e)}")
        return {
            'fixedCode': response_text,
            'changes': [],
            'explanation': 'Fix generated',
            'confidence': 0.7
        }

def detect_language(file_name: str) -> str:
    """Detect programming language from file extension"""
    ext_map = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rb': 'ruby',
        '.php': 'php',
        '.cs': 'csharp',
        '.cpp': 'cpp',
        '.c': 'c',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin'
    }
    
    for ext, lang in ext_map.items():
        if file_name.endswith(ext):
            return lang
    
    return 'plaintext'

def store_fixes_in_db(fixes: List[Dict], run_id: str, use_case_id: str, vulnerabilities: List[Dict]):
    """Store vulnerabilities and their fixes in PostgreSQL database"""
    if not fixes:
        return
    
    conn = get_db_connection()
    if conn is None:
        logger.warning("Database connection not available, skipping database storage")
        return

    cursor = conn.cursor()
    
    try:
        # Step 1: Ensure all vulnerabilities exist in the DB and build an ID map
        # Key: (fileName, vulnerableCode_prefix) -> DB id
        vuln_id_map = {}  # Maps vulnerability identity to its DB-generated ID
        
        def to_str(val):
            """Convert any value to a string safe for psycopg2 text columns"""
            if val is None:
                return None
            if isinstance(val, str):
                return val
            return json.dumps(val)
        
        def to_json_str(val):
            """Convert any value to a JSON string for psycopg2 JSON columns"""
            if val is None:
                return None
            if isinstance(val, str):
                return val  # Already a string, assume valid JSON
            return json.dumps(val)
        
        for vuln in vulnerabilities:
            vuln_db_id = f"vuln_{run_id}_{datetime.utcnow().timestamp()}_{hash(vuln.get('title', '')) % 100000}"
            file_name = vuln.get('fileName', 'unknown')
            vuln_code = to_str(vuln.get('vulnerableCode', '')) or ''
            map_key = f"{file_name}::{vuln.get('title', '')}::{vuln_code[:100]}"
            
            cursor.execute("""
                INSERT INTO "Vulnerability" (
                    id, "workflowRunId", "useCaseId", severity, title, type,
                    details, "fileName", "vulnerableCode", explanation,
                    "bestPractices", "exploitExamples", "attackPath", "cweId",
                    "documentReferences", "lineNumber", "columnNumber", confidence,
                    "falsePositive", resolved, "createdAt", "updatedAt"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
                ON CONFLICT (id) DO NOTHING
                RETURNING id
            """, (
                vuln_db_id,
                run_id,
                use_case_id,
                to_str(vuln.get('severity', 'Medium')),
                to_str(vuln.get('title', 'Security Issue')),
                to_str(vuln.get('type', 'Security')),
                to_str(vuln.get('details', vuln.get('explanation', ''))),
                file_name,
                to_str(vuln.get('vulnerableCode')),
                to_str(vuln.get('explanation')),
                to_str(vuln.get('bestPractices')),
                to_str(vuln.get('exploitExamples')),
                to_str(vuln.get('attackPath')),
                to_str(vuln.get('cweId')),
                to_json_str(vuln.get('documentReferences')),
                vuln.get('lineNumber'),
                vuln.get('columnNumber'),
                vuln.get('confidence', 1.0) if isinstance(vuln.get('confidence', 1.0), (int, float)) else 1.0,
                False,
                False
            ))
            
            result = cursor.fetchone()
            actual_id = result[0] if result else vuln_db_id
            vuln_id_map[map_key] = actual_id
        
        conn.commit()
        logger.info(f"Stored {len(vuln_id_map)} vulnerabilities in database")
        
        # Step 2: Insert CodeFix records, resolving vulnerabilityId from the map
        fixes_stored = 0
        for fix in fixes:
            # Look up the vulnerability DB ID
            fix_file = fix.get('fileName', 'unknown')
            fix_vuln_code = fix.get('originalCode', '')[:100]
            
            # Try to find matching vulnerability by fileName + title + code prefix
            vuln_db_id = None
            for vuln in vulnerabilities:
                v_file = vuln.get('fileName', 'unknown')
                v_code = vuln.get('vulnerableCode', '')[:100]
                map_key = f"{v_file}::{vuln.get('title', '')}::{v_code}"
                
                if v_file == fix_file and v_code == fix_vuln_code:
                    vuln_db_id = vuln_id_map.get(map_key)
                    break
            
            # Fallback: match by fileName only (first vulnerability for that file)
            if not vuln_db_id:
                for vuln in vulnerabilities:
                    v_file = vuln.get('fileName', 'unknown')
                    map_key = f"{v_file}::{vuln.get('title', '')}::{vuln.get('vulnerableCode', '')[:100]}"
                    if v_file == fix_file and map_key in vuln_id_map:
                        vuln_db_id = vuln_id_map[map_key]
                        break
            
            if not vuln_db_id:
                logger.warning(f"Could not find matching vulnerability for fix in {fix_file}, skipping")
                continue
            
            fix_id = f"fix_{datetime.utcnow().timestamp()}_{vuln_db_id}"
            
            cursor.execute("""
                INSERT INTO "CodeFix" (
                    id, "vulnerabilityId", "fileName", "originalCode", 
                    "startLine", "endLine", language, "fixedCode", 
                    changes, explanation, confidence, status, 
                    "createdAt", "updatedAt"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING
            """, (
                fix_id,
                vuln_db_id,
                fix['fileName'],
                fix['originalCode'],
                fix.get('startLine'),
                fix.get('endLine'),
                fix.get('language'),
                fix['fixedCode'],
                json.dumps(fix.get('changes', [])),
                fix['explanation'],
                fix.get('confidence', 0.9),
                'PENDING',
                datetime.utcnow(),
                datetime.utcnow()
            ))
            fixes_stored += 1
        
        conn.commit()
        logger.info(f"Stored {fixes_stored} fixes in database")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error storing fixes in database: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()



def get_code_files(use_case: Dict) -> List[Dict]:
    """
    Get code files to analyze from the use case.
    Handles:
    - Single file code (string or object)
    - Project with multiple files (inline or S3 reference)
    """
    code_payload = use_case.get('code', {})
    code_type = use_case.get('codeType', 'Unknown')

    # Handle string (raw code)
    if isinstance(code_payload, str):
        return [{
            'name': f'main.{get_extension_for_language(code_type)}',
            'content': code_payload,
            'language': code_type,
            'path': f'main.{get_extension_for_language(code_type)}'
        }]

    # Handle single file object
    if code_payload.get('type') == 'single':
        file_name = code_payload.get('fileName', 'main')
        content = code_payload.get('content', '')
        return [{
            'name': file_name,
            'content': content,
            'language': code_type,
            'path': file_name
        }]

    # Handle project with S3 reference
    if code_payload.get('type') == 'project':
        logger.info(f"Processing project type code payload")
        # Check if files are inline or in S3
        if code_payload.get('files'):
            # Files are inline
            logger.info(f"Project has {len(code_payload['files'])} inline files")
            return [{
                'name': f.get('path', 'unknown'),
                'content': f.get('content', ''),
                'language': f.get('language', code_type),
                'path': f.get('path', 'unknown')
            } for f in code_payload['files']]

        # Files are in S3
        if code_payload.get('s3Bucket') and code_payload.get('s3Key'):
            logger.info(f"Fetching project files from S3: {code_payload['s3Bucket']}/{code_payload['s3Key']}")
            project_data = download_from_s3(code_payload['s3Bucket'], code_payload['s3Key'])
            if project_data and isinstance(project_data, dict) and project_data.get('files'):
                logger.info(f"Loaded {len(project_data['files'])} files from S3")
                return [{
                    'name': f.get('path', 'unknown'),
                    'content': f.get('content', ''),
                    'language': f.get('language', code_type),
                    'path': f.get('path', 'unknown')
                } for f in project_data['files']]
            else:
                logger.warning(f"No files found in S3 project data: {type(project_data)}")

    # Fallback - try to use as list of files
    if isinstance(code_payload, list):
        return [{
            'name': f.get('path', f.get('name', 'unknown')),
            'content': f.get('content', ''),
            'language': f.get('language', code_type),
            'path': f.get('path', f.get('name', 'unknown'))
        } for f in code_payload]

    logger.warning(f"Unknown code payload format: {type(code_payload)}")
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
        'csharp': 'cs',
        'go': 'go',
        'rust': 'rs',
        'ruby': 'rb',
        'php': 'php',
        'swift': 'swift',
        'kotlin': 'kt',
    }
    return extensions.get(language.lower(), 'txt')


def emit_event(event_type: str, detail: dict):
    """Emit event to EventBridge"""
    try:
        events.put_events(
            Entries=[{
                'Source': 'orchestrator.implementer',
                'DetailType': event_type,
                'Detail': json.dumps(detail),
                'EventBusName': EVENT_BUS_NAME
            }]
        )
    except Exception as e:
        logger.error(f"Error emitting event: {str(e)}")
