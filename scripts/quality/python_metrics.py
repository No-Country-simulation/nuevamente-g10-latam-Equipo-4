"""Radon/AST adapter. Fingerprints survive relocation; never measure by regex."""
import ast
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from radon.complexity import cc_visit
from radon.visitors import Function

ROOT = Path(__file__).resolve().parents[2]


def functions(blocks):
    for block in blocks:
        if isinstance(block, Function):
            yield block
            yield from functions(block.closures)
        else:
            yield from functions(block.methods)


def measure(path, source):
    tree = ast.parse(source)
    nodes = {(node.name, node.lineno): node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
    result = []
    for block in functions(cc_visit(source)):
        node = nodes[(block.name, block.lineno)]
        fingerprint = hashlib.sha256(ast.dump(node, include_attributes=False).encode()).hexdigest()
        result.append({"file": path, "name": block.name, "line": block.lineno,
                       "fingerprint": fingerprint, "cyclomatic": block.complexity})
    return result


def main():
    base = sys.argv[1]
    paths = sorted((ROOT / "services/cognition/atlas").rglob("*.py"))
    current = [item for path in paths for item in measure(str(path.relative_to(ROOT)), path.read_text())]
    baseline = []
    files = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", base, "services/cognition/atlas"], cwd=ROOT, text=True).splitlines()
    for path in files:
        if path.endswith(".py"):
            source = subprocess.check_output(["git", "show", f"{base}:{path}"], cwd=ROOT, text=True)
            baseline.extend(measure(path, source))
    print(json.dumps({"algorithm": "radon-6.0.1-cyclomatic+python-ast-sha256", "baseline": baseline, "current": current}))


if __name__ == "__main__":
    main()
