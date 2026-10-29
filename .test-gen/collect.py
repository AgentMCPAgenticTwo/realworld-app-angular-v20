#!/usr/bin/env python3
"""Carry each parallel phase's work from its own CI job into one tree.

Copied into the repo under test as .test-gen/collect.py. The test-gen workflow runs every
phase as its own job on its own checkout, so their changes have to be brought together
before anything is verified or committed:

  pack <phase> <out_dir>   (end of each phase job, after guard.py)
      Copies every file the phase added or changed into <out_dir>/files/ and lists them
      in <out_dir>/manifest.json. That folder is uploaded as the `phase-<phase>` artifact.

  merge <artifacts_dir>    (collect job)
      Applies the downloaded `phase-*` folders in PHASE_ORDER. A file only one phase
      touched is copied; identical copies are taken once; package.json devDependencies,
      test scripts and requirements files are unioned; lockfiles are skipped (the install
      step that follows regenerates them). Any other file two phases changed keeps the
      earlier phase's version, and the later phase gets a `merge:` blocker in its output.
      Writes .test-gen/merge.json and joins .test-gen/plan/*.md into .test-gen/TEST_PLAN.md.

Stdlib only. Never exits non-zero: a failed merge must not cost the run its tests.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path.cwd()
PHASE_ORDER = ("unit", "integration", "e2e", "qa")

# Generated output: never handed over (verify.py regenerates what it needs).
_OUTPUT_DIRS = ("coverage/", "playwright-report/", "test-results/", "blob-report/",
                ".pytest_cache/", "htmlcov/", "node_modules/", ".nyc_output/",
                ".test-gen/verify/", "TestResults/", "__pycache__/")
_LOCKFILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "uv.lock",
              "go.sum", "packages.lock.json"}
_REQUIREMENTS = {"requirements-dev.txt", "requirements_dev.txt", "requirements-test.txt"}
_PKG_MERGED_KEYS = ("devDependencies", "scripts")


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout


def is_output(path: str) -> bool:
    return any(path.startswith(d) or f"/{d}" in f"/{path}" for d in _OUTPUT_DIRS)


# ------------------------------------------------------------------------------ pack.

def changed_files() -> tuple[list[str], list[str]]:
    """(added or modified, deleted) relative to HEAD, generated output excluded."""
    git("add", "-A")
    raw = git("diff", "--cached", "--name-status", "--no-renames", "-z", "HEAD")
    parts = [p for p in raw.split("\0") if p]
    changed, deleted = [], []
    for status, path in zip(parts[0::2], parts[1::2]):
        if is_output(path):
            continue
        (deleted if status.startswith("D") else changed).append(path)
    return changed, deleted


def pack(phase: str, out_dir: Path) -> dict:
    changed, deleted = changed_files()
    files_dir = out_dir / "files"
    files_dir.mkdir(parents=True, exist_ok=True)
    for path in changed:
        src = ROOT / path
        if not src.is_file():
            continue
        dest = files_dir / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    manifest = {"phase": phase, "files": changed, "deleted": deleted}
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"packed {len(changed)} file(s) from the {phase} phase"
          + (f" ({len(deleted)} deletion(s) not carried over)" if deleted else ""))
    return manifest


# ----------------------------------------------------------------------------- merge.

def merge_package_json(current: str, incoming: str) -> tuple[str, list[str]]:
    """Union the test-tooling keys; returns (merged text, keys that disagreed)."""
    try:
        base, other = json.loads(current), json.loads(incoming)
    except ValueError:
        return current, ["package.json (unparseable)"]
    disagreed: list[str] = []
    for key in _PKG_MERGED_KEYS:
        theirs = other.get(key) or {}
        if not isinstance(theirs, dict):
            continue
        ours = base.setdefault(key, {})
        for name, value in theirs.items():
            if name not in ours:
                ours[name] = value
            elif ours[name] != value:
                disagreed.append(f"{key}.{name}")
    for key, value in other.items():  # e.g. a "jest" block only this phase added
        if key not in base:
            base[key] = value
        elif key not in _PKG_MERGED_KEYS and base[key] != value:
            disagreed.append(key)
    return json.dumps(base, indent=2, ensure_ascii=False) + "\n", disagreed


def merge_lines(current: str, incoming: str) -> str:
    lines = current.splitlines()
    seen = {line.strip() for line in lines}
    lines += [line for line in incoming.splitlines() if line.strip() and line.strip() not in seen]
    return "\n".join(lines) + "\n"


def _phase_dirs(artifacts_dir: Path) -> list[tuple[str, Path]]:
    found = []
    for phase in PHASE_ORDER:
        folder = artifacts_dir / f"phase-{phase}"
        if (folder / "manifest.json").exists():
            found.append((phase, folder))
    return found


def _add_blockers(blockers: dict[str, list[str]]) -> None:
    for phase, items in blockers.items():
        for out in (ROOT / ".test-gen" / "outputs").glob(f"*-{phase}.json"):
            try:
                data = json.loads(out.read_text(), strict=False)
            except ValueError:
                continue
            data["blockers"] = list(data.get("blockers") or []) + items
            out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def _join_plans() -> None:
    plans = [ROOT / ".test-gen" / "plan" / f"{p}.md" for p in PHASE_ORDER]
    parts = [f"## {p.stem}\n\n{p.read_text().strip()}\n" for p in plans if p.exists()]
    if parts:
        (ROOT / ".test-gen" / "TEST_PLAN.md").write_text(
            "# Test plan\n\nOne section per phase; each phase planned its own work.\n\n"
            + "\n".join(parts))


def merge(artifacts_dir: Path) -> dict:
    owner: dict[str, str] = {}
    conflicts: list[dict] = []
    blockers: dict[str, list[str]] = {}
    relock = False
    phases = _phase_dirs(artifacts_dir)
    for phase, folder in phases:
        manifest = json.loads((folder / "manifest.json").read_text())
        for path in manifest.get("files") or []:
            src = folder / "files" / path
            if not src.is_file():
                continue
            dest = ROOT / path
            name = PurePosixPath(path).name
            incoming = src.read_bytes()
            if path not in owner:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(incoming)
                owner[path] = phase
                continue
            current = dest.read_bytes()
            if current == incoming:
                continue
            if name in _LOCKFILES:
                relock = True
                continue
            if name == "package.json":
                text, disagreed = merge_package_json(current.decode(), incoming.decode())
                dest.write_text(text)
                relock = True
                if disagreed:
                    conflicts.append({"path": path, "kept": owner[path], "dropped": phase,
                                      "keys": disagreed})
                    blockers.setdefault(phase, []).append(
                        f"merge: {path} keys {', '.join(disagreed)} also set by the "
                        f"{owner[path]} phase; kept its values")
                continue
            if name in _REQUIREMENTS:
                dest.write_text(merge_lines(current.decode(), incoming.decode()))
                continue
            conflicts.append({"path": path, "kept": owner[path], "dropped": phase})
            blockers.setdefault(phase, []).append(
                f"merge: {path} was also changed by the {owner[path]} phase; kept that "
                "version, this phase's change to it was dropped")
    _add_blockers(blockers)
    _join_plans()
    report = {"phases": [p for p, _ in phases], "files": len(owner),
              "conflicts": conflicts, "relock": relock}
    out = ROOT / ".test-gen" / "merge.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n")
    print(f"merged {len(phases)} phase(s): {', '.join(report['phases']) or 'none'}; "
          f"{len(owner)} file(s), {len(conflicts)} conflict(s)")
    for c in conflicts:
        print(f"::warning::{c['path']}: kept the {c['kept']} phase's version over {c['dropped']}'s")
    return report


def main(argv: list[str]) -> int:
    try:
        if len(argv) == 3 and argv[0] == "pack":
            pack(argv[1], Path(argv[2]))
        elif len(argv) == 2 and argv[0] == "merge":
            merge(Path(argv[1]))
        else:
            print("usage: collect.py pack <phase> <out_dir> | merge <artifacts_dir>")
    except Exception as exc:  # noqa: BLE001 -- see module docstring
        print(f"::warning::collect.py {' '.join(argv[:1])} failed: {exc}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
