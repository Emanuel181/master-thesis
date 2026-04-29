"""Exercise _build_autofix_payload and signing path without AWS deps."""
import importlib.util, os, sys, json, pathlib

# Stub env vars required at import time
os.environ.setdefault('AWS_REGION', 'us-east-1')
os.environ.setdefault('AGENT_ARTIFACTS_BUCKET', 'x')
os.environ.setdefault('EVENT_BUS_NAME', 'x')
os.environ.setdefault('APP_BASE_URL', 'https://example.test')
os.environ.setdefault('WORKFLOW_AGENT_HMAC_SECRET', 'test-secret')

# Stub boto3 so import succeeds
class _Dummy:
    def __getattr__(self, _): return lambda *a, **k: None
class _Boto3:
    def client(self, *a, **k): return _Dummy()
    def resource(self, *a, **k): return _Dummy()
sys.modules['boto3'] = _Boto3()  # type: ignore

spec = importlib.util.spec_from_file_location(
    "impl", pathlib.Path("infrastructure/lambda/agent-implementer/index.py"))
impl = importlib.util.module_from_spec(spec); spec.loader.exec_module(impl)  # type: ignore

# 1) Builder drops fixes without vulnerabilityId and non-positive lines
fixes = [
    {'vulnerabilityId': 'v1', 'fileName': 'a.py', 'originalCode': 'x',
     'fixedCode': 'y', 'explanation': 'fix', 'startLine': 0, 'endLine': -5,
     'language': 'python', 'changes': [{'a': 1}]},
    {'vulnerabilityId': None, 'fileName': 'b.py', 'originalCode': '', 'fixedCode': '',
     'explanation': ''},  # should be dropped
    {'vulnerabilityId': 'v2', 'fileName': 'c.py', 'originalCode': 'o',
     'fixedCode': 'n', 'explanation': 'e', 'startLine': 3, 'endLine': 7},
]
payload = impl._build_autofix_payload('run_1', fixes)
assert payload['runId'] == 'run_1'
assert len(payload['fixes']) == 2, payload
f0 = payload['fixes'][0]
assert 'startLine' not in f0 and 'endLine' not in f0, f0
assert f0['changes'] == [{'a': 1}] and f0['language'] == 'python'
f1 = payload['fixes'][1]
assert f1['startLine'] == 3 and f1['endLine'] == 7
print('PASS: _build_autofix_payload drops invalid ids and non-positive lines')

# 2) attach_db_vulnerability_ids resolves by exact prefix, falls back by file
vulns = [
    {'fileName': 'a.py', 'title': 'SQLi',  'vulnerableCode': 'SELECT *'},
    {'fileName': 'a.py', 'title': 'XSS',   'vulnerableCode': 'innerHTML='},
    {'fileName': 'b.py', 'title': 'RCE',   'vulnerableCode': 'eval(x)'},
]
id_map = {
    impl._vuln_identity_key('a.py', 'SQLi', 'SELECT *'): 'db_sqli',
    impl._vuln_identity_key('a.py', 'XSS',  'innerHTML='): 'db_xss',
    impl._vuln_identity_key('b.py', 'RCE',  'eval(x)'): 'db_rce',
}
fixes2 = [
    {'fileName': 'a.py', 'originalCode': 'innerHTML=foo', 'vulnerabilityId': 'llm-1'},
    {'fileName': 'a.py', 'originalCode': 'something else','vulnerabilityId': 'llm-2'},  # fallback
    {'fileName': 'zzz.py', 'originalCode': 'nope',        'vulnerabilityId': 'llm-3'},  # no file match
]
out = impl.attach_db_vulnerability_ids(fixes2, vulns, id_map)
assert out[0]['vulnerabilityId'] == 'db_xss',  out[0]
assert out[1]['vulnerabilityId'] in ('db_sqli', 'db_xss'), out[1]
assert out[2]['vulnerabilityId'] == 'llm-3', out[2]  # unresolved, kept as-is
print('PASS: attach_db_vulnerability_ids resolves by prefix + per-file fallback')

# 3) Signed-callback skips cleanly when env vars missing
impl.APP_BASE_URL = ''
res = impl.post_signed_autofix_callback('run_1', [{'vulnerabilityId': 'x',
    'fileName': 'a', 'originalCode': '', 'fixedCode': '', 'explanation': ''}])
assert res == {'ok': False, 'skipped': True, 'reason': 'not configured'}, res
print('PASS: post_signed_autofix_callback skips when APP_BASE_URL missing')

print('\nALL VERIFICATIONS PASSED')

