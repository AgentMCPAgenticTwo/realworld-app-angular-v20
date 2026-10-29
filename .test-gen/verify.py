#!/usr/bin/env python3
"""Run the repo's tests independently of the agent and record what actually happened.

Copied into the repo under test as .test-gen/verify.py and run by the test-gen workflow
AFTER the source guard has put any application file the agent touched back the way it was.
The numbers it writes (.test-gen/verify/results.json) are the run's record of truth --
the agent's own pass/fail claims are kept only as a cross-check. Stdlib only, and it
never exits non-zero: failing tests are a RESULT to report, not a broken pipeline.
"""
from __future__ import annotations

import glob
import json
import os
import re
import shlex
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path.cwd()
GEN = ROOT / ".test-gen"
OUT = GEN / "verify"
RAW = OUT / "raw"
CMD_TIMEOUT_S = int(os.environ.get("TEST_GEN_VERIFY_TIMEOUT_S", "1500"))

SUITES = ("unit", "integration", "e2e")


# ------------------------------------------------------------------ classification.

def classify(path: str) -> str:
    """Which suite a test belongs to, from where it lives and what it is called.

    Mirrors the naming rules CLAUDE.md gives the agent, so a test lands in the suite the
    agent meant it for without either side having to trust the other's bookkeeping.
    """
    p = path.replace("\\", "/").lower()
    name = p.rsplit("/", 1)[-1]
    if "e2e" in p or "/end-to-end/" in p or "/playwright/" in p:
        return "e2e"
    if ("integration" in p or ".int." in name or "/it/" in p or name.endswith("it.java")
            or name.endswith("it.kt")):
        return "integration"
    return "unit"


def empty_suite() -> dict:
    return {"status": "not_run", "passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0,
            "detail": ""}


# ------------------------------------------------------------------------ parsers.

def parse_jest_like(report: dict) -> dict[str, dict]:
    """jest --json and vitest --reporter=json share this shape (vitest mirrors jest)."""
    suites = {s: empty_suite() for s in SUITES}
    for file_result in report.get("testResults") or []:
        suite = suites[classify(str(file_result.get("name") or file_result.get("testFilePath") or ""))]
        assertions = file_result.get("assertionResults") or file_result.get("testResults") or []
        if not assertions and file_result.get("status") == "failed":
            # The file failed to load (syntax/import error): count it as one failure so a
            # broken test file can never read as "0 failed".
            suite["failed"] += 1
            suite["detail"] = (suite["detail"] + " " + str(file_result.get("message") or "")[:300]).strip()
        for a in assertions:
            status = a.get("status")
            if status == "passed":
                suite["passed"] += 1
            elif status == "failed":
                suite["failed"] += 1
            else:
                suite["skipped"] += 1
        start, end = file_result.get("startTime"), file_result.get("endTime")
        if isinstance(start, (int, float)) and isinstance(end, (int, float)) and end >= start:
            suite["duration_ms"] += int(end - start)
    return suites


def parse_junit_xml(paths: list[str]) -> dict[str, dict]:
    """pytest --junitxml, surefire/failsafe and gradle test-results all write JUnit XML."""
    suites = {s: empty_suite() for s in SUITES}
    for path in paths:
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError):
            continue
        for case in root.iter("testcase"):
            source = case.get("file") or case.get("classname") or ""
            # classname is dotted (tests.integration.test_x.TestY) -- make it path-like.
            suite = suites[classify(source.replace(".", "/") if "/" not in source else source)]
            if case.find("failure") is not None or case.find("error") is not None:
                suite["failed"] += 1
            elif case.find("skipped") is not None:
                suite["skipped"] += 1
            else:
                suite["passed"] += 1
            try:
                suite["duration_ms"] += int(float(case.get("time") or 0) * 1000)
            except ValueError:
                pass
    return suites


def parse_trx(paths: list[str]) -> dict[str, dict]:
    suites = {s: empty_suite() for s in SUITES}
    for path in paths:
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError):
            continue
        ns = {"t": root.tag.split("}")[0].strip("{")} if root.tag.startswith("{") else {}
        q = (lambda tag: f"t:{tag}") if ns else (lambda tag: tag)
        tests = {}
        for unit_test in root.iter(f"{{{ns['t']}}}UnitTest" if ns else "UnitTest"):
            method = unit_test.find(q("TestMethod"), ns)
            tests[unit_test.get("id")] = (method.get("className") if method is not None else "") or ""
        for result in root.iter(f"{{{ns['t']}}}UnitTestResult" if ns else "UnitTestResult"):
            suite = suites[classify(tests.get(result.get("testId"), "").replace(".", "/"))]
            outcome = (result.get("outcome") or "").lower()
            if outcome == "passed":
                suite["passed"] += 1
            elif outcome in ("failed", "error", "timeout", "aborted"):
                suite["failed"] += 1
            else:
                suite["skipped"] += 1
    return suites


def parse_go_json(text: str) -> dict[str, dict]:
    suites = {s: empty_suite() for s in SUITES}
    for line in text.splitlines():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if not event.get("Test") or event.get("Action") not in ("pass", "fail", "skip"):
            continue
        suite = suites[classify(f"{event.get('Package', '')}/{event['Test']}")]
        key = {"pass": "passed", "fail": "failed", "skip": "skipped"}[event["Action"]]
        suite[key] += 1
        suite["duration_ms"] += int(float(event.get("Elapsed") or 0) * 1000)
    return suites


def parse_playwright_json(report: dict) -> dict:
    stats = report.get("stats") or {}
    suite = empty_suite()
    suite["passed"] = int(stats.get("expected") or 0) + int(stats.get("flaky") or 0)
    suite["failed"] = int(stats.get("unexpected") or 0)
    suite["skipped"] = int(stats.get("skipped") or 0)
    suite["duration_ms"] = int(stats.get("duration") or 0)
    if stats.get("flaky"):
        suite["detail"] = f"{stats['flaky']} flaky (passed on retry)"
    errors = report.get("errors") or []
    if errors and not (suite["passed"] or suite["failed"]):
        suite["failed"] = 1
        suite["detail"] = str((errors[0] or {}).get("message") or "")[:300]
    return suite


# ------------------------------------------------------------------------ coverage.

def coverage_istanbul(path: Path) -> dict:
    total = (json.loads(path.read_text()) or {}).get("total") or {}
    return {k: (total.get(k) or {}).get("pct") for k in ("lines", "branches", "functions", "statements")}


def coverage_py(path: Path) -> dict:
    totals = (json.loads(path.read_text()) or {}).get("totals") or {}
    branches = None
    if totals.get("num_branches"):
        branches = round(100.0 * totals.get("covered_branches", 0) / totals["num_branches"], 2)
    lines = totals.get("percent_covered")
    return {"lines": round(lines, 2) if isinstance(lines, (int, float)) else None,
            "branches": branches, "functions": None, "statements": None}


def coverage_jacoco(path: Path) -> dict:
    root = ET.parse(path).getroot()
    out = {"lines": None, "branches": None, "functions": None, "statements": None}
    mapping = {"LINE": "lines", "BRANCH": "branches", "METHOD": "functions",
               "INSTRUCTION": "statements"}
    for counter in root.findall("counter"):  # report-level totals only
        key = mapping.get(counter.get("type") or "")
        if not key:
            continue
        missed, covered = int(counter.get("missed") or 0), int(counter.get("covered") or 0)
        if missed + covered:
            out[key] = round(100.0 * covered / (missed + covered), 2)
    return out


def coverage_cobertura(path: Path) -> dict:
    root = ET.parse(path).getroot()

    def pct(attr: str):
        try:
            return round(float(root.get(attr)) * 100, 2)
        except (TypeError, ValueError):
            return None
    return {"lines": pct("line-rate"), "branches": pct("branch-rate"), "functions": None,
            "statements": None}


def coverage_go(profile_path: Path, cwd: Path) -> dict:
    proc = subprocess.run(["go", "tool", "cover", f"-func={profile_path}"], cwd=cwd,
                          capture_output=True, text=True)
    match = re.search(r"total:\s+\(statements\)\s+([\d.]+)%", proc.stdout)
    return {"lines": None, "branches": None, "functions": None,
            "statements": float(match.group(1)) if match else None}


# ------------------------------------------------------------------------ running.

def run(cmd: str, cwd: Path, env: dict | None = None, label: str = "") -> dict:
    started = time.monotonic()
    log_path = RAW / f"{label or 'cmd'}.log"
    try:
        proc = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True,
                              timeout=CMD_TIMEOUT_S, env={**os.environ, **(env or {})})
        code, output = proc.returncode, (proc.stdout or "") + (proc.stderr or "")
    except subprocess.TimeoutExpired as exc:
        code = 124
        output = f"timed out after {CMD_TIMEOUT_S}s\n" + str(exc.stdout or "")[-4000:]
    log_path.write_text(output, encoding="utf-8", errors="replace")
    entry = {"label": label, "cmd": cmd, "cwd": str(cwd.relative_to(ROOT)) if cwd != ROOT else ".",
             "exit_code": code, "duration_ms": int((time.monotonic() - started) * 1000),
             "log": str(log_path.relative_to(ROOT))}
    print(f"[verify] {label}: exit {code} in {entry['duration_ms']}ms :: {cmd}", flush=True)
    return {**entry, "_output": output}


def finish(suites: dict[str, dict], exit_code: int, measured: bool, tail: str) -> None:
    """Settle each suite's status. A non-zero exit with no tests counted is an ERROR."""
    for suite in suites.values():
        if suite["passed"] or suite["failed"] or suite["skipped"]:
            suite["status"] = "failed" if suite["failed"] else "passed"
    if exit_code != 0 and not any(s["passed"] or s["failed"] for s in suites.values()):
        target = suites["unit"]
        target["status"] = "error"
        tail_lines = tail.strip().splitlines()
        target["detail"] = (" ".join(tail_lines[-3:])[:400] if tail_lines else
                            f"test command exited {exit_code} without a readable report")
    elif not measured and exit_code == 0:
        suites["unit"].update(status="passed", detail="runner reported no per-test counts")


def merge(into: dict[str, dict], extra: dict[str, dict]) -> None:
    for name, suite in extra.items():
        target = into[name]
        for key in ("passed", "failed", "skipped", "duration_ms"):
            target[key] += suite[key]
        if suite["detail"]:
            target["detail"] = (target["detail"] + " " + suite["detail"]).strip()


def verify_node(profile: dict, workdir: Path, test_types: list[str], results: dict) -> None:
    runner = profile.get("unit_runner")
    unit_cmd = (profile.get("commands") or {}).get("unit") or ""
    ui = profile.get("kind") in ("frontend", "fullstack")
    cov_dir = RAW / "coverage"
    suites = {s: empty_suite() for s in SUITES}

    # On a backend repo the HTTP-level e2e tests run under the unit runner too (supertest),
    # and are told apart from unit/integration by their file names -- see classify().
    run_unit = bool(unit_cmd) and (bool({"unit", "integration"} & set(test_types))
                                   or (not ui and "e2e" in test_types))
    if run_unit:
        report = RAW / f"{runner}.json"
        if runner == "vitest":
            exclude = " --exclude 'e2e/**'" if ui else ""
            with_cov = (f"{unit_cmd}{exclude} --reporter=json --outputFile={report} "
                        f"--coverage.enabled --coverage.reportOnFailure "
                        f"--coverage.reporter=json-summary "
                        f"--coverage.reportsDirectory={cov_dir}")
            plain = f"{unit_cmd}{exclude} --reporter=json --outputFile={report}"
        elif runner == "jest":
            ignore = (" --testPathIgnorePatterns=/node_modules/ --testPathIgnorePatterns=/e2e/"
                      if ui else "")
            with_cov = (f"{unit_cmd}{ignore} --json --outputFile={report} --coverage "
                        f"--coverageReporters=json-summary --coverageDirectory={cov_dir}")
            plain = f"{unit_cmd}{ignore} --json --outputFile={report}"
        else:
            with_cov = plain = unit_cmd
        entry = run(with_cov, workdir, label="unit")
        if not report.exists() and with_cov != plain:
            # Most often the coverage provider package is missing -- measure the tests
            # anyway rather than report a coverage problem as a test failure.
            results["notes"].append("coverage run produced no report; re-ran without coverage")
            entry = run(plain, workdir, label="unit-nocov")
        results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
        if report.exists():
            try:
                merge(suites, parse_jest_like(json.loads(report.read_text())))
            except ValueError as exc:
                results["notes"].append(f"unreadable {report.name}: {exc}")
        finish(suites, entry["exit_code"], report.exists(), entry["_output"][-2000:])
        summary = cov_dir / "coverage-summary.json"
        if summary.exists():
            results["coverage"] = coverage_istanbul(summary)

    nest_e2e = workdir / "test" / "jest-e2e.json"
    if "e2e" in test_types and not ui and nest_e2e.exists():
        report = RAW / "jest-e2e.json"
        entry = run(f"npx jest --ci --config test/jest-e2e.json --json --outputFile={report}",
                    workdir, label="e2e")
        results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
        if report.exists():
            parsed = parse_jest_like(json.loads(report.read_text()))
            # Everything this config runs is e2e by construction, whatever its file names.
            combined = empty_suite()
            for s in parsed.values():
                for key in ("passed", "failed", "skipped", "duration_ms"):
                    combined[key] += s[key]
            merge(suites, {"unit": empty_suite(), "integration": empty_suite(), "e2e": combined})

    if "e2e" in test_types and ui and _has_playwright(workdir):
        report = RAW / "playwright.json"
        entry = run("npx playwright test --reporter=json,html", workdir, label="e2e", env={
            "PLAYWRIGHT_JSON_OUTPUT_NAME": str(report),
            "PLAYWRIGHT_HTML_OPEN": "never",
            "PLAYWRIGHT_HTML_OUTPUT_DIR": str(RAW / "playwright-report"),
        })
        results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
        e2e = parse_playwright_json(json.loads(report.read_text())) if report.exists() else empty_suite()
        if not report.exists() and entry["exit_code"] != 0:
            e2e["detail"] = " ".join(entry["_output"].strip().splitlines()[-3:])[:400]
            e2e["status"] = "error"
        merge(suites, {"unit": empty_suite(), "integration": empty_suite(), "e2e": e2e})
        if e2e["status"] == "error":
            suites["e2e"]["status"] = "error"
    for suite in suites.values():
        if suite["status"] == "not_run" and (suite["passed"] or suite["failed"] or suite["skipped"]):
            suite["status"] = "failed" if suite["failed"] else "passed"
    results["suites"] = suites


def _has_playwright(workdir: Path) -> bool:
    return bool(glob.glob(str(workdir / "playwright.config.*"))) or (workdir / "e2e").is_dir()


def verify_python(profile: dict, workdir: Path, test_types: list[str], results: dict) -> None:
    unit_cmd = (profile.get("commands") or {}).get("unit") or "python -m pytest"
    junit = RAW / "pytest.xml"
    cov = RAW / "coverage.json"
    with_cov = f"{unit_cmd} -q --junitxml={junit} --cov=. --cov-report=json:{cov}"
    entry = run(with_cov, workdir, label="unit")
    if not junit.exists():
        results["notes"].append("pytest produced no junit report with coverage; re-ran without --cov")
        entry = run(f"{unit_cmd} -q --junitxml={junit}", workdir, label="unit-nocov")
    results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
    suites = parse_junit_xml([str(junit)]) if junit.exists() else {s: empty_suite() for s in SUITES}
    # pytest exits 5 when it collected nothing -- that is "no tests", not a crash.
    finish(suites, 0 if entry["exit_code"] == 5 else entry["exit_code"], junit.exists(),
           entry["_output"][-2000:])
    if cov.exists():
        results["coverage"] = coverage_py(cov)
    results["suites"] = suites


def verify_java(profile: dict, workdir: Path, test_types: list[str], results: dict) -> None:
    entry = run((profile.get("commands") or {}).get("unit") or "mvn -B test", workdir, label="unit")
    results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
    reports = (glob.glob(str(workdir / "**/target/surefire-reports/*.xml"), recursive=True)
               + glob.glob(str(workdir / "**/target/failsafe-reports/*.xml"), recursive=True)
               + glob.glob(str(workdir / "**/build/test-results/**/*.xml"), recursive=True))
    suites = parse_junit_xml(reports)
    finish(suites, entry["exit_code"], bool(reports), entry["_output"][-2000:])
    jacoco = (glob.glob(str(workdir / "**/target/site/jacoco/jacoco.xml"), recursive=True)
              + glob.glob(str(workdir / "**/build/reports/jacoco/**/*.xml"), recursive=True))
    if jacoco:
        try:
            results["coverage"] = coverage_jacoco(Path(jacoco[0]))
        except (ET.ParseError, OSError) as exc:
            results["notes"].append(f"unreadable jacoco report: {exc}")
    results["suites"] = suites


def verify_dotnet(profile: dict, workdir: Path, test_types: list[str], results: dict) -> None:
    res_dir = RAW / "dotnet"
    cmd = (profile.get("commands") or {}).get("unit") or "dotnet test"
    entry = run(f"{cmd} --results-directory {shlex.quote(str(res_dir))}", workdir, label="unit")
    results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
    trx = glob.glob(str(res_dir / "**/*.trx"), recursive=True)
    suites = parse_trx(trx)
    finish(suites, entry["exit_code"], bool(trx), entry["_output"][-2000:])
    cobertura = glob.glob(str(res_dir / "**/coverage.cobertura.xml"), recursive=True)
    if cobertura:
        try:
            results["coverage"] = coverage_cobertura(Path(cobertura[0]))
        except (ET.ParseError, OSError) as exc:
            results["notes"].append(f"unreadable cobertura report: {exc}")
    results["suites"] = suites


def verify_go(profile: dict, workdir: Path, test_types: list[str], results: dict) -> None:
    cover = RAW / "cover.out"
    entry = run(f"go test -json -coverprofile={cover} ./...", workdir, label="unit")
    results["commands"].append({k: v for k, v in entry.items() if k != "_output"})
    suites = parse_go_json(entry["_output"])
    finish(suites, entry["exit_code"], True, entry["_output"][-2000:])
    if cover.exists():
        results["coverage"] = coverage_go(cover, workdir)
    results["suites"] = suites


VERIFIERS = {"node": verify_node, "python": verify_python, "java": verify_java,
             "dotnet": verify_dotnet, "go": verify_go}


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    try:
        run_cfg = json.loads((GEN / "run.json").read_text())
    except (OSError, ValueError) as exc:
        print(f"::warning::verify: no readable .test-gen/run.json ({exc}) - nothing verified")
        return 0
    profile = run_cfg.get("profile") or {}
    test_types = run_cfg.get("test_types") or []
    workdir = (ROOT / (profile.get("workdir") or ".")).resolve()
    results: dict = {"suites": {s: empty_suite() for s in SUITES}, "coverage": None,
                     "commands": [], "notes": [], "verified": True}
    verifier = VERIFIERS.get(profile.get("stack") or "")
    if verifier is None:
        results["verified"] = False
        results["notes"].append(f"no verifier for stack {profile.get('stack')!r}")
    else:
        try:
            verifier(profile, workdir, test_types, results)
        except Exception as exc:  # noqa: BLE001 -- a verifier bug must not lose the run
            results["verified"] = False
            results["notes"].append(f"verifier crashed: {type(exc).__name__}: {exc}")

    target = run_cfg.get("coverage_target")
    if results["coverage"] is not None:
        results["coverage"]["target"] = target
        lines = results["coverage"].get("lines") or results["coverage"].get("statements")
        results["coverage"]["met"] = (lines >= target) if (lines is not None and target) else None

    (OUT / "results.json").write_text(json.dumps(results, indent=2) + "\n")
    _step_summary(results)
    return 0


def _step_summary(results: dict) -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    rows = ["## test-gen verification", "", "| Suite | Status | Passed | Failed | Skipped |",
            "|---|---|---|---|---|"]
    for name, s in results["suites"].items():
        rows.append(f"| {name} | {s['status']} | {s['passed']} | {s['failed']} | {s['skipped']} |")
    cov = results.get("coverage") or {}
    if cov:
        rows += ["", f"Coverage: lines {cov.get('lines')}% · branches {cov.get('branches')}% "
                     f"(target {cov.get('target')}%)"]
    for note in results["notes"]:
        rows.append(f"- {note}")
    with open(path, "a", encoding="utf-8") as fh:
        fh.write("\n".join(rows) + "\n")


if __name__ == "__main__":
    sys.exit(main())
