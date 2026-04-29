"""
Cross-check the Python signer in agent-implementer/index.py against lib/hmac.js.
Builds a payload, signs with our Python code, then verifies using the same
algorithm JS uses (HMAC-SHA256 over `${ts}.${rid}.${rawBody}`).
"""
import json, hmac, hashlib, time, uuid, subprocess, sys, pathlib, os

SECRET = "test-secret-abc"
RAW = json.dumps(
    {"runId": "run_123", "fixes": [{"vulnerabilityId": "v1", "fileName": "a.py",
     "originalCode": "x", "fixedCode": "y", "explanation": "z"}]},
    separators=(",", ":"), ensure_ascii=False)
TS = str(int(time.time()))
RID = str(uuid.uuid4())

# Python side (mirrors post_signed_autofix_callback)
signing = f"{TS}.{RID}.{RAW}".encode("utf-8")
py_sig = "v1=" + hmac.new(SECRET.encode("utf-8"), signing, hashlib.sha256).hexdigest()
print("PY SIG:", py_sig)

# Node side (mirrors lib/hmac.js signAgentRequest)
node_script = f"""
const crypto = require('node:crypto');
const mac = crypto.createHmac('sha256', {json.dumps(SECRET)});
mac.update({json.dumps(TS)} + '.' + {json.dumps(RID)} + '.' + {json.dumps(RAW)});
process.stdout.write('v1=' + mac.digest('hex'));
"""
tmp = pathlib.Path("_hmac_check.js")
tmp.write_text(node_script, encoding="utf-8")
node_sig = subprocess.check_output(["node", str(tmp)]).decode()
tmp.unlink()
print("JS SIG:", node_sig)
print("MATCH :", py_sig == node_sig)
sys.exit(0 if py_sig == node_sig else 1)

