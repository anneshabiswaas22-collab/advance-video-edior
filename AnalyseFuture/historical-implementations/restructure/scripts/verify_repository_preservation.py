#!/usr/bin/env python3
"""Verify preserved originals and extracted snapshots without executing them."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = ROOT / "AnalyseFuture" / "manifests"


def digest(path: Path) -> str:
    with path.open("rb") as source:
        result = hashlib.sha256()
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def matches(relative: str, expected: str) -> bool:
    path = ROOT / relative
    if not path.resolve().is_relative_to(ROOT):
        return False
    return path.is_file() and digest(path) == expected


def main() -> int:
    baseline = json.loads((MANIFESTS / "original-tracked-files.json").read_text())
    extracted = json.loads((MANIFESTS / "archive-extractions.json").read_text())
    relocations = json.loads((MANIFESTS / "relocations.json").read_text())
    moved = {item["from"]: item["to"] for item in relocations["moves"]}
    for archive in extracted["archives"]:
        moved[Path(archive["archive"]).name] = archive["archive"]

    failures = []
    for item in baseline["files"]:
        name = item["path"]
        candidates = [name, moved.get(name, name), f"AnalyseFuture/recovery-originals/{name}"]
        if not any(matches(candidate, item["sha256"]) for candidate in candidates):
            failures.append(f"Original missing or altered without preserved copy: {name}")

    extracted_count = 0
    for archive in extracted["archives"]:
        if not matches(archive["archive"], archive["sha256"]):
            failures.append(f"Original ZIP differs: {archive['archive']}")
        for item in archive["files"]:
            extracted_count += 1
            if not matches(item["path"], item["sha256"]):
                failures.append(f"Extracted file differs: {item['path']}")

    for item in relocations["moves"]:
        if (ROOT / item["from"]).exists():
            failures.append(f"Retired item still at original path: {item['from']}")

    if failures:
        print("Preservation verification FAILED:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print(f"PASS: {len(baseline['files'])} original tracked files preserved by SHA-256")
    print(f"PASS: {len(extracted['archives'])} original ZIPs and {extracted_count} extracted files verified")
    print(f"PASS: {len(relocations['moves'])} file relocations verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
