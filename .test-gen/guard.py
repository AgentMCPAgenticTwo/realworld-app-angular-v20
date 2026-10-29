#!/usr/bin/env python3
"""Put back every application file the testing agent changed, before anything is measured.

Copied into the repo under test as .test-gen/guard.py and run by the test-gen workflow
right after the agent and BEFORE verify.py. The agent is told never to edit application
code; this is what makes that true regardless of what it was told. A test that only
passes because the code under test was "fixed" would report a bug as working, so any
change outside test files is reverted (tracked files) or deleted (new files), and listed
in .test-gen/guard.json so the run's report says it happened.

Allowed: test files and test directories, test-runner config, lockfiles, dev-dependency
manifests -- and, inside package.json / pyproject.toml, ONLY the test-tooling keys.
Stdlib only. Never exits non-zero.
"""
from __future__ import annotations

import fnmatch
import json
import os
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path.cwd()

# Paths the agent may create or change freely.
_TEST_DIRS = {"test", "tests", "__tests__", "__mocks__", "e2e", "spec", "specs", "testing",
              "mocks", "__fixtures__", "test-utils", "testutils"}
_TEST_FILE_GLOBS = (
    "*.test.*", "*.spec.*", "*_test.py", "test_*.py", "conftest.py", "*_test.go",
    "*Test.java", "*Tests.java", "*IT.java", "*Test.kt", "*Tests.kt", "*Tests.cs", "*Test.cs",
    "*.e2e-spec.*", "*.int.*",
)
_TEST_CONFIG_GLOBS = (
    "playwright.config.*", "vitest.config.*", "vitest.setup.*", "vitest.workspace.*",
    "jest.config.*", "jest.setup.*", "jest-e2e.json", "setupTests.*", "setup-tests.*",
    "test-setup.*", "pytest.ini", ".coveragerc", "karma.conf.*", "cypress.config.*",
    "tsconfig.test.json", "tsconfig.spec.json", "tsconfig.e2e.json", ".mocharc.*",
    "requirements-dev.txt", "requirements_dev.txt", "requirements-test.txt",
)
_LOCKFILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "uv.lock",
              "go.sum", "packages.lock.json"}
# Manifests where only test-tooling sections may change -- handled key-by-key below.
_PARTIAL_MANIFESTS = {"package.json", "pyproject.toml"}
# Agent-owned config: never edited by the agent, whatever the pattern rules say.
_PROTECTED_PREFIXES = (".github/", ".claude/", ".test-gen/tasks/", ".test-gen/guard.py",
                       ".test-gen/verify.py", ".test-gen/collect.py", ".test-gen/progress.jq",
                       ".test-gen/run.json", ".test-gen/profile.json",
                       ".test-gen/OUTPUT_SCHEMA.json")
_PROTECTED_FILES = {"CLAUDE.md", ".mcp.json"}
# Generated output, ignored entirely (never committed, never "reverted").
_OUTPUT_DIRS = ("coverage/", "playwright-report/", "test-results/", "blob-report/",
                ".pytest_cache/", "htmlcov/", "node_modules/", ".nyc_output/",
                ".test-gen/verify/", ".test-gen/qa/", "TestResults/")

_PKG_SCRIPT_RE = re.compile(r"^(test|e2e|coverage|playwright|vitest|jest)([:_-].*)?$")
_PYPROJECT_ALLOWED = ("tool.pytest", "tool.coverage", "project.optional-dependencies",
                      "dependency-groups", "tool.poetry.group", "tool.uv")


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout


def is_output(path: str) -> bool:
    return any(path.startswith(d) or f"/{d}" in f"/{path}" for d in _OUTPUT_DIRS)


def is_protected(path: str) -> bool:
    return path in _PROTECTED_FILES or path.startswith(_PROTECTED_PREFIXES)


def is_allowed(path: str) -> bool:
    """May the agent create/modify this path wholesale?"""
    if is_protected(path):
        return False
    p = PurePosixPath(path)
    name = p.name
    if path.startswith(".test-gen/"):
        return True  # outputs, transcripts, plan/, QA_REPORT.md
    if name in _LOCKFILES or name == ".gitignore" or name in ("go.mod",):
        return True
    if any(fnmatch.fnmatch(name, g) for g in _TEST_FILE_GLOBS + _TEST_CONFIG_GLOBS):
        return True
    parts = [part.lower() for part in p.parts[:-1]]
    if any(part in _TEST_DIRS for part in parts):
        return True
    # .NET test projects (Foo.Tests/), JVM test source sets (src/test/, src/integrationTest/).
    if any(part.endswith((".tests", ".test", "tests")) for part in parts):
        return True
    if "/src/test/" in f"/{path}" or re.search(r"(^|/)src/[a-z]*test/", path, re.I):
        return True
    return False


# ------------------------------------------------------------------- manifests.

def _head_version(path: str) -> str | None:
    proc = subprocess.run(["git", "show", f"HEAD:{path}"], cwd=ROOT, capture_output=True,
                          text=True)
    return proc.stdout if proc.returncode == 0 else None


def repair_package_json(path: str) -> list[str]:
    """Keep the agent's devDependencies + test scripts; restore everything else.

    Returns the top-level keys that had to be restored (empty = the change was clean)."""
    head_text = _head_version(path)
    if head_text is None:
        return []  # a brand-new package.json is a new project file -- handled by caller
    try:
        head = json.loads(head_text)
        current = json.loads((ROOT / path).read_text())
    except ValueError:
        restore(path)
        return ["<unparseable>"]
    merged = dict(head)
    restored: list[str] = []
    for key in set(head) | set(current):
        if key == "devDependencies":
            if key in current:
                merged[key] = current[key]
        elif key == "scripts":
            h, c = head.get("scripts") or {}, current.get("scripts") or {}
            scripts = dict(h)
            for name, cmd in c.items():
                if _PKG_SCRIPT_RE.match(name):
                    scripts[name] = cmd
                elif h.get(name) != cmd:
                    restored.append(f"scripts.{name}")
            for name in set(h) - set(c):
                if not _PKG_SCRIPT_RE.match(name):
                    restored.append(f"scripts.{name}")
            merged["scripts"] = scripts
        elif key in ("jest", "vitest", "c8", "nyc"):
            if key in current:
                merged[key] = current[key]
        elif head.get(key) != current.get(key):
            restored.append(key)
    if merged != current:
        indent = 2
        match = re.search(r'^\{\s*\n(\s+)"', head_text)
        if match:
            indent = len(match.group(1).replace("\t", "  "))
        (ROOT / path).write_text(json.dumps(merged, indent=indent, ensure_ascii=False) + "\n")
    return sorted(set(restored))


def _toml_sections(text: str) -> dict[str, str]:
    sections: dict[str, list[str]] = {"": []}
    current = ""
    for line in text.splitlines():
        match = re.match(r"^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$", line)
        if match:
            current = match.group(1)
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)
    return {k: "\n".join(v).strip() for k, v in sections.items()}


def check_pyproject(path: str) -> list[str]:
    """Section names outside the test-tooling allowlist that the agent changed."""
    head_text = _head_version(path)
    if head_text is None:
        return []
    head, current = _toml_sections(head_text), _toml_sections((ROOT / path).read_text())
    changed = [k for k in set(head) | set(current) if head.get(k) != current.get(k)]
    return sorted(k or "<top-level>" for k in changed if not k.startswith(_PYPROJECT_ALLOWED))


# ------------------------------------------------------------------------ actions.

def restore(path: str) -> None:
    subprocess.run(["git", "checkout", "HEAD", "--", path], cwd=ROOT, capture_output=True)


def changed_paths() -> list[tuple[str, str]]:
    """(status, path) for every working-tree change vs HEAD, untracked files expanded."""
    out = []
    for line in git("status", "--porcelain", "-uall", "--no-renames").splitlines():
        if len(line) < 4:
            continue
        status, path = line[:2], line[3:].strip().strip('"')
        out.append((status, path))
    return out


def main() -> int:
    report: dict = {"reverted": [], "removed": [], "partial": [], "allowed": []}
    for status, path in changed_paths():
        if is_output(path):
            continue
        untracked = status == "??"
        name = PurePosixPath(path).name
        if not untracked and name in _PARTIAL_MANIFESTS and not is_protected(path):
            if name == "package.json":
                restored = repair_package_json(path)
                if restored:
                    report["partial"].append({"file": path, "restored": restored})
                else:
                    report["allowed"].append(path)
            else:
                bad = check_pyproject(path)
                if bad:
                    restore(path)
                    report["reverted"].append(path)
                    report["partial"].append({"file": path, "restored": bad})
                else:
                    report["allowed"].append(path)
            continue
        if is_allowed(path):
            report["allowed"].append(path)
            continue
        if untracked:
            try:
                (ROOT / path).unlink()
                report["removed"].append(path)
            except OSError:
                pass
        else:
            restore(path)
            report["reverted"].append(path)

    out = ROOT / ".test-gen" / "guard.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n")
    touched = report["reverted"] + report["removed"]
    for path in touched:
        print(f"::warning::test-gen guard: put back application file changed by the agent: {path}")
    for item in report["partial"]:
        print(f"::warning::test-gen guard: restored non-test keys in {item['file']}: "
              f"{', '.join(item['restored'])}")
    print(f"[guard] {len(report['allowed'])} test file change(s) kept, "
          f"{len(touched)} application change(s) put back")
    if os.environ.get("GITHUB_STEP_SUMMARY") and (touched or report["partial"]):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fh:
            fh.write("## test-gen source guard\n\n")
            for path in touched:
                fh.write(f"- reverted `{path}`\n")
            for item in report["partial"]:
                fh.write(f"- restored `{item['file']}`: {', '.join(item['restored'])}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
