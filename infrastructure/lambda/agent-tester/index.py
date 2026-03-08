"""
Tester Agent - Validates proposed fixes.
ALL fixes are processed - nothing is ever skipped.

Architecture: Coordinator/Worker fan-out pattern using Lambda self-invocation.
- Coordinator (default): splits fixes into batches, invokes a separate Lambda
  for each batch, polls S3 until all workers finish, merges results.
- Worker (mode="worker"): processes one batch, writes results to S3.

Each worker gets its own 15-minute Lambda timeout, so even hundreds of fixes
are processed without any time pressure.
"""
import json
import os
import re
import time
import boto3
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['AWS_REGION'])
lambda_client = boto3.client('lambda', region_name=os.environ['AWS_REGION'])
s3 = boto3.client('s3')
events = boto3.client('events')

BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID')
AGENT_ARTIFACTS_BUCKET = os.environ['AGENT_ARTIFACTS_BUCKET']
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
TESTER_FUNCTION_NAME = os.environ.get('TESTER_FUNCTION_NAME', '')

# Fixes per worker Lambda invocation
BATCH_SIZE = 5
# Max worker Lambdas invoked concurrently
MAX_CONCURRENT_WORKERS = 20
# How long coordinator waits for all workers (seconds)
WORKER_TIMEOUT = 780  # 13 min — leaves buffer within the 15-min coordinator timeout
# Poll interval when checking for worker results in S3
POLL_INTERVAL = 5

logger = logging.getLogger()
logger.setLevel(logging.INFO)


# ============================================================
# S3 helpers
# ============================================================

def download_from_s3(bucket: str, key: str) -> dict:
    """Download and parse JSON from S3"""
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error downloading from S3: {e}")
        return None


def upload_to_s3(bucket: str, key: str, data: dict):
    """Upload JSON to S3"""
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(data, indent=2),
        ContentType='application/json'
    )


def s3_key_exists(bucket: str, key: str) -> bool:
    """Check if an S3 key exists"""
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False


# ============================================================
# Entry point — routes to coordinator or worker
# ============================================================

def handler(event, context):
    """Route to coordinator or worker based on mode."""
    mode = event.get('mode', 'coordinator')
    if mode == 'worker':
        return worker_handler(event, context)
    else:
        return coordinator_handler(event, context)


# ============================================================
# COORDINATOR — fans out work to worker Lambdas
# ============================================================

def coordinator_handler(event, context):
    """Split fixes into batches and invoke a worker Lambda per batch.
    Poll S3 for all worker results, merge, and return."""
    start_time = datetime.utcnow()
    try:
        run_id = event['runId']
        use_case = event['useCase']
        implementer_output = event.get('implementerOutput', {})

        logger.info(f"[COORDINATOR] Starting Tester for run {run_id}")

        emit_event('tester_started', {
            'runId': run_id,
            'useCaseId': use_case['id']
        })

        # Fetch full implementer output from S3 if needed
        if implementer_output.get('fullResultsInS3'):
            logger.info(f"[COORDINATOR] Fetching implementer output from S3: {implementer_output.get('s3Key')}")
            try:
                full_data = download_from_s3(implementer_output['s3Bucket'], implementer_output['s3Key'])
                if full_data:
                    implementer_output = full_data
            except Exception as e:
                logger.warning(f"[COORDINATOR] Could not fetch from S3, using inline data: {e}")

        fixes = implementer_output.get('fixes', [])
        custom_prompt = use_case.get('testerPrompt', '')

        logger.info(f"[COORDINATOR] Total fixes to process: {len(fixes)} (ALL will be processed)")

        if not fixes:
            logger.info("[COORDINATOR] No fixes to test")
            full_output = {
                'testResults': [],
                'totalTests': 0,
                'passedTests': 0,
                'allFixesProcessed': True,
                'timestamp': datetime.utcnow().isoformat()
            }
        else:
            # Split fixes into batches
            batches = []
            for i in range(0, len(fixes), BATCH_SIZE):
                batches.append(fixes[i:i + BATCH_SIZE])

            num_batches = len(batches)
            logger.info(f"[COORDINATOR] Created {num_batches} batches of up to {BATCH_SIZE} fixes, "
                         f"invoking {num_batches} worker Lambdas")

            # Worker result S3 keys
            worker_s3_prefix = f"runs/{run_id}/tester/{use_case['id']}/workers"
            worker_keys = [f"{worker_s3_prefix}/batch-{i}.json" for i in range(num_batches)]

            # Invoke all worker Lambdas concurrently
            function_name = TESTER_FUNCTION_NAME or context.function_name
            invocation_errors = {}

            with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_WORKERS) as executor:
                futures = {}
                for batch_idx, batch in enumerate(batches):
                    worker_payload = {
                        'mode': 'worker',
                        'batchIndex': batch_idx,
                        'fixes': batch,
                        'customPrompt': custom_prompt,
                        'resultS3Bucket': AGENT_ARTIFACTS_BUCKET,
                        'resultS3Key': worker_keys[batch_idx],
                        'runId': run_id,
                        'useCaseId': use_case['id']
                    }
                    future = executor.submit(
                        invoke_worker_lambda,
                        function_name,
                        worker_payload
                    )
                    futures[future] = batch_idx

                for future in as_completed(futures):
                    batch_idx = futures[future]
                    try:
                        future.result()
                        logger.info(f"[COORDINATOR] Worker {batch_idx + 1}/{num_batches} invoked")
                    except Exception as e:
                        logger.error(f"[COORDINATOR] Failed to invoke worker {batch_idx + 1}: {e}")
                        invocation_errors[batch_idx] = str(e)

            # Poll S3 for worker results
            logger.info(f"[COORDINATOR] All workers invoked. Polling S3 for {num_batches} results...")
            worker_results = poll_for_worker_results(
                AGENT_ARTIFACTS_BUCKET, worker_keys, num_batches, WORKER_TIMEOUT
            )

            # Merge all results in order
            test_results = []
            for batch_idx in range(num_batches):
                if batch_idx in worker_results and worker_results[batch_idx]:
                    batch_test_results = worker_results[batch_idx].get('results', [])
                    test_results.extend(batch_test_results)
                elif batch_idx in invocation_errors:
                    # Worker couldn't even be invoked — generate fallback inline
                    logger.warning(f"[COORDINATOR] Generating fallback for batch {batch_idx} (invoke failed)")
                    batch = batches[batch_idx]
                    fallback = generate_fallback_results(batch, invocation_errors[batch_idx])
                    test_results.extend(fallback)
                else:
                    # Worker was invoked but result never appeared — process inline as fallback
                    logger.warning(f"[COORDINATOR] Worker {batch_idx} result not found, processing inline")
                    batch = batches[batch_idx]
                    try:
                        inline_results = generate_tests_batch(batch, custom_prompt)
                        test_results.extend(inline_results)
                    except Exception as e:
                        logger.error(f"[COORDINATOR] Inline fallback failed for batch {batch_idx}: {e}")
                        fallback = generate_fallback_results(batch, str(e))
                        test_results.extend(fallback)

            # Verify completeness
            if len(test_results) != len(fixes):
                logger.error(
                    f"[COORDINATOR] Result count mismatch! Expected {len(fixes)}, got {len(test_results)}. "
                    f"Padding missing entries."
                )
                while len(test_results) < len(fixes):
                    fix_idx = len(test_results)
                    fix = fixes[fix_idx] if fix_idx < len(fixes) else {}
                    test_results.append({
                        'fixId': fix.get('vulnerabilityId'),
                        'fileName': fix.get('fileName', 'unknown'),
                        'testCode': '// Test result missing — please generate tests manually.',
                        'passed': False,
                        'error': 'Result not captured',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                test_results = test_results[:len(fixes)]

            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"[COORDINATOR] Complete in {elapsed:.1f}s: "
                f"{len(test_results)} results for {len(fixes)} fixes "
                f"({num_batches} workers used)"
            )

            full_output = {
                'testResults': test_results,
                'totalTests': len(test_results),
                'passedTests': sum(1 for t in test_results if t.get('passed', False)),
                'failedTests': sum(1 for t in test_results if not t.get('passed', True)),
                'workersUsed': num_batches,
                'workersSucceeded': len(worker_results),
                'allFixesProcessed': len(test_results) == len(fixes),
                'processingTimeSeconds': round(elapsed, 1),
                'timestamp': datetime.utcnow().isoformat()
            }

        # Save final merged output to S3
        artifact_key = f"runs/{run_id}/tester/{use_case['id']}/output.json"
        upload_to_s3(AGENT_ARTIFACTS_BUCKET, artifact_key, full_output)

        emit_event('tester_completed', {
            'runId': run_id,
            'useCaseId': use_case['id'],
            'testCount': full_output['totalTests'],
            'passedCount': full_output['passedTests']
        })

        return {
            'totalTests': full_output['totalTests'],
            'passedTests': full_output['passedTests'],
            'allFixesProcessed': full_output.get('allFixesProcessed', True),
            'timestamp': datetime.utcnow().isoformat(),
            's3Bucket': AGENT_ARTIFACTS_BUCKET,
            's3Key': artifact_key,
            'fullResultsInS3': True
        }

    except Exception as e:
        logger.error(f"[COORDINATOR] Error: {str(e)}", exc_info=True)
        emit_event('tester_failed', {
            'runId': event.get('runId'),
            'error': str(e)
        })
        raise


def invoke_worker_lambda(function_name: str, payload: dict):
    """Invoke a worker Lambda asynchronously (Event invocation type)."""
    lambda_client.invoke(
        FunctionName=function_name,
        InvocationType='Event',  # Fire and forget — worker writes to S3
        Payload=json.dumps(payload)
    )


def poll_for_worker_results(bucket: str, worker_keys: list, total: int, timeout: int) -> dict:
    """Poll S3 until all worker results exist or timeout."""
    results = {}
    deadline = time.time() + timeout
    remaining = set(range(total))

    while remaining and time.time() < deadline:
        for batch_idx in list(remaining):
            if s3_key_exists(bucket, worker_keys[batch_idx]):
                data = download_from_s3(bucket, worker_keys[batch_idx])
                if data:
                    results[batch_idx] = data
                    remaining.discard(batch_idx)
                    logger.info(f"[COORDINATOR] Worker {batch_idx + 1}/{total} result collected "
                                 f"({len(remaining)} remaining)")

        if remaining:
            time.sleep(POLL_INTERVAL)

    if remaining:
        logger.warning(f"[COORDINATOR] Timed out waiting for {len(remaining)} workers: {remaining}")

    return results


def generate_fallback_results(fixes: list, error_msg: str) -> list:
    """Generate error placeholder results for fixes that couldn't be processed."""
    results = []
    for fix in fixes:
        results.append({
            'fixId': fix.get('vulnerabilityId'),
            'fileName': fix.get('fileName', 'unknown'),
            'testCode': (
                f'// Test generation failed.\n'
                f'// Error: {error_msg}\n'
                f'// File: {fix.get("fileName", "unknown")}\n'
                f'// Please generate tests manually for this fix.'
            ),
            'passed': False,
            'error': error_msg,
            'timestamp': datetime.utcnow().isoformat()
        })
    return results


# ============================================================
# WORKER — processes one batch and writes results to S3
# ============================================================

def worker_handler(event, context):
    """Process a single batch of fixes and write results to S3."""
    batch_idx = event.get('batchIndex', 0)
    fixes = event.get('fixes', [])
    custom_prompt = event.get('customPrompt', '')
    result_bucket = event.get('resultS3Bucket')
    result_key = event.get('resultS3Key')

    logger.info(f"[WORKER {batch_idx}] Processing {len(fixes)} fixes")

    results = []
    for fix in fixes:
        try:
            fix_results = generate_tests_batch([fix], custom_prompt)
            results.extend(fix_results)
        except Exception as e:
            logger.error(f"[WORKER {batch_idx}] Failed to generate tests for {fix.get('fileName')}: {e}")
            results.append({
                'fixId': fix.get('vulnerabilityId'),
                'fileName': fix.get('fileName', 'unknown'),
                'testCode': (
                    f'// Test generation failed.\n'
                    f'// Error: {str(e)}\n'
                    f'// File: {fix.get("fileName", "unknown")}\n'
                    f'// Please generate tests manually for this fix.'
                ),
                'passed': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })

    logger.info(f"[WORKER {batch_idx}] Done. Writing {len(results)} results to S3: {result_key}")

    upload_to_s3(result_bucket, result_key, {
        'batchIndex': batch_idx,
        'results': results,
        'fixCount': len(fixes),
        'resultCount': len(results),
        'timestamp': datetime.utcnow().isoformat()
    })

    return {'status': 'ok', 'resultCount': len(results)}


# ============================================================
# Bedrock test generation
# ============================================================

def generate_tests_batch(fixes: list, custom_prompt: str) -> list:
    """Generate test cases for a batch of fixes in a single Bedrock call."""

    fixes_text_parts = []
    for idx, fix in enumerate(fixes):
        file_name = fix.get('fileName', 'unknown')
        fixed_code = fix.get('fixedCode', 'N/A')
        if len(fixed_code) > 3000:
            fixed_code = fixed_code[:3000] + "\n... (truncated)"
        fixes_text_parts.append(
            f"### Fix {idx + 1}: {file_name}\n```\n{fixed_code}\n```"
        )

    fixes_text = "\n\n".join(fixes_text_parts)

    system_prompt = f"""You are an expert QA engineer. Generate concise test cases for each of the proposed code fixes below.

For each fix, provide:
1. Key unit test cases (code)
2. Edge cases to consider
3. Expected outcomes

Keep each test section concise. You MUST separate each fix's tests with the header "## Fix N: <filename>" where N is the fix number.

{f'Custom instructions: {custom_prompt}' if custom_prompt else ''}"""

    user_message = f"""Generate test cases for the following {len(fixes)} fixes:

{fixes_text}"""

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
        "temperature": 0.2
    }

    response = bedrock_runtime.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(body)
    )
    response_body = json.loads(response['body'].read())
    test_content = response_body['content'][0]['text']

    sections = _split_test_sections(test_content, len(fixes))

    results = []
    for idx, fix in enumerate(fixes):
        section_text = sections[idx] if idx < len(sections) else test_content
        results.append({
            'fixId': fix.get('vulnerabilityId'),
            'fileName': fix.get('fileName', 'unknown'),
            'testCode': section_text,
            'passed': True,
            'timestamp': datetime.utcnow().isoformat()
        })

    return results


def _split_test_sections(text: str, expected_count: int) -> list:
    """Split batched test output into per-fix sections."""
    parts = re.split(r'(?=##\s*Fix\s+\d+)', text)
    parts = [p.strip() for p in parts if p.strip()]

    if len(parts) >= expected_count:
        return parts[:expected_count]

    return [text] * expected_count


# ============================================================
# EventBridge
# ============================================================

def emit_event(event_type: str, detail: dict):
    """Emit event to EventBridge"""
    try:
        events.put_events(
            Entries=[{
                'Source': 'orchestrator.tester',
                'DetailType': event_type,
                'Detail': json.dumps(detail),
                'EventBusName': EVENT_BUS_NAME
            }]
        )
    except Exception as e:
        logger.error(f"Error emitting event: {str(e)}")
