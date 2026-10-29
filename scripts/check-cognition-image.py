"""Run inside the built image: actual startup and HTTP auth without networking."""
import http.client
import json
import os
import subprocess
import sys
import time


def request(path, headers=None):
    connection = http.client.HTTPConnection("127.0.0.1", 8000, timeout=2)
    try:
        connection.request("GET", path, headers=headers or {})
        response = connection.getresponse()
        return response.status, json.loads(response.read())
    finally:
        connection.close()


server = subprocess.Popen([sys.executable, "-m", "uvicorn", "atlas.main:app", "--host", "127.0.0.1", "--port", "8000"])
try:
    for attempt in range(100):
        if server.poll() is not None:
            raise RuntimeError("The built cognition image exited before becoming ready")
        try:
            assert request("/health") == (200, {"status": "ok", "service": "cognition"})
            break
        except OSError:
            time.sleep(0.1)
    else:
        raise RuntimeError("The built cognition image did not become ready")
    assert request("/v1/documents")[0] == 401
    headers = {"Authorization": "Bearer " + os.environ["ATLAS_INTERNAL_TOKEN"], "X-Atlas-Tenant": "ci-image-check"}
    assert request("/v1/documents", headers) == (200, [])
    print("PASS cognition image: startup, writable storage, health200, anonymous401, authenticated documents200")
finally:
    server.terminate()
    server.wait(timeout=10)
