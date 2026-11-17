#!/usr/bin/env python3
"""Inventory tracked and nonignored work-in-progress paths without executing code.

This is structural evidence: reading a source file and finding imports does not
certify its correctness, security, reachability, or feature completeness.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess


ROOT = Path(__file__).resolve().parents[2]
OUTPUTS = {
    "AnalyseFuture/COMPLETE_FILE_INVENTORY.txt",
    "AnalyseFuture/DUPLICATE_ANALYSIS.txt",
    "AnalyseFuture/repository-inventory/files.json",
    "AnalyseFuture/repository-inventory/dependencies.json",
    "AnalyseFuture/repository-inventory/duplicates.json",
    "AnalyseFuture/repository-inventory/summary.json",
}
REQUIRED_REPORTS = {
    "AnalyseFuture/REPOSITORY_AUDIT.txt", "AnalyseFuture/FEATURE_INVENTORY.txt",
    "AnalyseFuture/SECURITY_AUDIT.txt", "AnalyseFuture/ORIGINAL_TO_NEW_PATH_MAPPING.txt",
    "AnalyseFuture/CONSOLIDATION_REPORT.txt", "AnalyseFuture/ARCHIVED_FILES_MANIFEST.txt",
    "AnalyseFuture/PROJECT_VISION_AND_FUTURE_ROADMAP.txt", "AnalyseFuture/TECHNICAL_DEBT.txt",
    "AnalyseFuture/TEST_AND_VALIDATION_REPORT.txt", "AnalyseFuture/MIGRATION_SUMMARY.txt",
    "AnalyseFuture/NEXT_DEVELOPER_INSTRUCTIONS.txt", "AnalyseFuture/WORK_PROGRESS.txt",
}
SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts",
                   ".py", ".rs", ".c", ".cc", ".cpp", ".h", ".hpp", ".wgsl",
                   ".glsl", ".vert", ".frag", ".sh", ".swift", ".mm", ".m"}
ASSET_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico",
                  ".woff", ".woff2", ".ttf", ".mp4", ".mov", ".mp3", ".wav"}
CONFIG_SUFFIXES = {".json", ".yaml", ".yml", ".toml", ".xml", ".plist", ".ini"}
IMPORT_RE = re.compile(r"(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\(|\bimport\s*)[\"']([^\"'\n]+)[\"']")
PYTHON_RE = re.compile(r"^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))", re.M)
DOMAIN_NAMES = {
    "video": "video decoding/rendering/effects", "audio": "audio mixing and processing",
    "timeline": "timeline editing", "export": "media export", "media": "media import and identity",
    "storage": "project persistence", "playback": "preview and clock", "motion": "motion graphics",
    "creation": "creation engine", "effects": "effects processing", "graphics": "graphics and titles",
    "color": "color processing", "capabilities": "capability descriptions",
    "stores": "application state", "services": "application services", "bridges": "UI/engine integration",
    "components": "interface components", "hooks": "interface hooks", "utils": "shared utilities",
    "mcp": "external tool protocol", "ipc": "desktop IPC", "main": "desktop main process",
    "e2e-web": "main browser editor functional tests", "e2e": "browser functional tests",
}


def git_paths(root: Path) -> tuple[list[str], set[str], dict[str, str]]:
    tracked = set(filter(None, subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=root).decode().split("\0")))
    paths = set(filter(None, subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root
    ).decode().split("\0")))
    modes = {}
    for item in subprocess.check_output(["git", "ls-files", "--stage", "-z"], cwd=root).decode().split("\0"):
        if item:
            metadata, path = item.split("\t", 1)
            modes[path] = metadata.split()[0]
    return sorted(paths | OUTPUTS | REQUIRED_REPORTS), tracked, modes


def relative_identity(name: str) -> tuple[str, str]:
    prefix = "AnalyseFuture/reference-sources/"
    if name.startswith(prefix):
        project, _, relative = name[len(prefix):].partition("/")
        return "reference:" + project, relative
    if name.startswith("AnalyseFuture/"):
        bucket = name.split("/", 2)[1]
        if bucket == "legacy-automation":
            return "retired-automation", name.split("/", 2)[2]
        if bucket in {"recovery-originals", "historical-implementations"}:
            return "preserved-original", name.split("/", 2)[-1]
        if bucket in {"unrelated", "upstream-planning"}:
            return "preserved-reference", name.split("/", 2)[-1]
        if bucket == "archives":
            return "source-archive", name.split("/", 2)[-1]
        return "audit-and-planning", name
    return "active", name


def classify(name: str) -> dict[str, str]:
    status, relative = relative_identity(name)
    parts = PurePosixPath(relative).parts
    suffix = PurePosixPath(relative).suffix.lower()
    owner = "repository"
    domain = "project coordination"
    if parts and parts[0] == "editor":
        parts = parts[1:]
    if len(parts) >= 2 and parts[0] in {"apps", "packages"}:
        owner = parts[1]
        tail = parts[2:]
        if tail and tail[0] == "src":
            tail = tail[1:]
        if tail:
            domain = (DOMAIN_NAMES.get(tail[1], tail[1]) if tail[0] == "features" and len(tail) > 1 else {"app": "application shell and orchestration", "shared": "cross-feature shared facilities"}.get(tail[0], DOMAIN_NAMES.get(tail[0], tail[0])))
            if tail[0] == "components" and len(tail) > 1:
                domain += ":" + tail[1]
    elif parts:
        owner = parts[0]
        domain = {"docs": "documentation", "scripts": "maintenance and media QA",
                  "tests": "root media QA", ".github": "CI configuration",
                  "icons": "interface icon assets", "public": "served static assets"}.get(parts[0], domain)
    base = PurePosixPath(relative).name
    if name in OUTPUTS:
        category, purpose = "generated-audit", "Reproducible inventory output; body hash omitted to avoid self-reference"
    elif suffix == ".zip":
        category, purpose = "source-bundle", "Original source snapshot ZIP; not an executable project dependency"
    elif suffix in ASSET_SUFFIXES:
        category, purpose = "asset", "Static asset; retained pending usage/license review"
    elif re.search(r"(?:\.|/)(?:test|spec)(?:\.|/)|/e2e(?:-web)?/", relative):
        category, purpose = "test", "Regression/functional test for " + domain
    elif suffix in SOURCE_SUFFIXES:
        category, purpose = "source", "Implementation/tooling for " + domain
    elif suffix in CONFIG_SUFFIXES or base.startswith((".git", ".npm", ".env")) or "lock" in base:
        category, purpose = "configuration", "Configuration/dependency declaration; inspect before executing related tooling"
    elif suffix in {".md", ".txt", ".rtf", ".docx", ".pdf"} or base in {"LICENSE", "NOTICE"}:
        category, purpose = "documentation", "Documentation/planning/attribution for " + domain
    elif suffix in {".wasm", ".dylib", ".so", ".dll", ".exe", ".a"}:
        category, purpose = "binary", "Native/WASM artifact; provenance and platform validation required"
    else:
        category, purpose = "other", "Retained file; purpose inferred only from its location"
    return {"status": status, "category": category, "owner": owner, "feature": domain,
            "purpose": purpose, "purpose_confidence": "path-and-static-reference-inference"}


def module_base(specifier: str) -> str:
    parts = specifier.split("/")
    return "/".join(parts[:2]) if specifier.startswith("@") else parts[0]


def resolve_relative(source: str, specifier: str, all_paths: set[str]) -> str | None:
    specifier = specifier.split("?", 1)[0].split("#", 1)[0]
    if not specifier.startswith("."):
        return None
    joined = str(PurePosixPath(source).parent / specifier)
    normalized = []
    for part in PurePosixPath(joined).parts:
        if part == "..":
            if normalized:
                normalized.pop()
        elif part != ".":
            normalized.append(part)
    base = "/".join(normalized)
    candidates = [base]
    if base.endswith((".js", ".jsx", ".mjs")):
        candidates += [base.rsplit(".", 1)[0] + ending for ending in (".ts", ".tsx", ".mts")]
    candidates += [base + ending for ending in (".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".d.ts")]
    candidates += [base + "/index" + ending for ending in (".ts", ".tsx", ".js", ".jsx")]
    return next((candidate for candidate in candidates if candidate in all_paths), None)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n")


def audit(root: Path) -> dict[str, object]:
    paths, tracked, modes = git_paths(root)
    all_paths = set(paths)
    rows = []
    hashes = defaultdict(list)
    texts: dict[str, str] = {}
    unavailable = []
    for name in paths:
        row = {"path": name, "tracked": name in tracked, "mode": modes.get(name, "untracked"), **classify(name)}
        path = root / name
        if name in OUTPUTS:
            row.update(bytes=None, sha256="GENERATED_SELF_EXCLUDED", inspection="generated-self-excluded")
        elif not path.is_file():
            row.update(bytes=None, sha256=None, inspection="not-yet-written-or-unreadable")
            unavailable.append(name)
        else:
            try:
                data = path.read_bytes()
                sha = hashlib.sha256(data).hexdigest()
                row.update(bytes=len(data), sha256=sha, inspection="content-hashed")
                hashes[sha].append(name)
                try:
                    if b"\0" not in data[:8192]:
                        value = data.decode("utf-8")
                        texts[name] = value
                        row["inspection"] = "text-read-static-scan"
                except UnicodeDecodeError:
                    pass
            except OSError as error:
                row.update(bytes=None, sha256=None, inspection="read-error:" + type(error).__name__)
                unavailable.append(name)
        rows.append(row)

    duplicates = []
    duplicate_for = {}
    for sha, members in sorted(hashes.items()):
        if len(members) < 2:
            continue
        active = [name for name in members if relative_identity(name)[0] == "active"]
        kind = "active-and-preserved-mirror" if active and len(active) < len(members) else "active-duplicate" if active else "preserved-only"
        group = "SHA256-" + sha[:16]
        duplicates.append({"group": group, "sha256": sha, "kind": kind, "members": members,
                           "active_members": active, "byte_identical": True})
        for name in members:
            duplicate_for[name] = group
    for row in rows:
        row["duplicate_group"] = duplicate_for.get(row["path"], "")

    packages = []
    manifests = {}
    parse_errors = []
    for name, text in texts.items():
        if PurePosixPath(name).name != "package.json":
            continue
        try:
            manifest = json.loads(text)
        except (ValueError, TypeError):
            parse_errors.append(name)
            continue
        if relative_identity(name)[0] == "active":
            manifests[str(PurePosixPath(name).parent)] = manifest
            packages.append({"path": name, "name": manifest.get("name"),
                             "dependencies": manifest.get("dependencies", {}),
                             "devDependencies": manifest.get("devDependencies", {}),
                             "optionalDependencies": manifest.get("optionalDependencies", {}),
                             "scripts": list(manifest.get("scripts", {})),
                             "engines": manifest.get("engines", {})})
    package_names = {p["name"] for p in packages if p["name"]}
    package_edges = []
    for package in packages:
        for kind in ("dependencies", "devDependencies", "optionalDependencies"):
            for dependency, version in package[kind].items():
                package_edges.append({"from": package["name"], "to": dependency, "version": version,
                                      "kind": kind, "internal": dependency in package_names})

    edges = []
    unresolved = []
    for name, text in texts.items():
        if relative_identity(name)[0] != "active" or PurePosixPath(name).suffix not in SOURCE_SUFFIXES:
            continue
        imports = sorted(set(IMPORT_RE.findall(text)))
        row_dependencies = []
        for specifier in imports:
            if specifier.startswith("."):
                target = resolve_relative(name, specifier, all_paths)
                if target:
                    edges.append({"from": name, "to": target, "kind": "relative"})
                    row_dependencies.append(target)
                else:
                    unresolved.append({"from": name, "specifier": specifier,
                                       "status": "static-candidate; may be virtual/generated/bundler-resolved"})
            elif specifier.startswith("@/"):
                marker = "/src/"
                if marker in name:
                    alias = name.split(marker, 1)[0] + "/src/"
                    target = resolve_relative(alias + "__alias__.ts", "./" + specifier[2:], all_paths)
                    if target:
                        edges.append({"from": name, "to": target, "kind": "source-alias"})
                        row_dependencies.append(target)
            elif not specifier.startswith(("http:", "https:", "data:", "node:", "virtual:")):
                dependency = module_base(specifier)
                edges.append({"from": name, "to": dependency,
                              "kind": "internal-package" if dependency in package_names else "external-or-runtime"})
                row_dependencies.append(dependency)
        if PurePosixPath(name).suffix == ".py":
            row_dependencies.extend(sorted({a or b for a, b in PYTHON_RE.findall(text)}))
        for row in rows:
            if row["path"] == name:
                row["dependencies"] = sorted(set(row_dependencies))
                row["inspection"] = "text-read-import-scan"
                break

    active_groups = [group for group in duplicates if len(group["active_members"]) > 1]
    summary = {
        "scope": "all git-tracked paths plus nonignored working-tree additions and required audit paths",
        "tracked_paths": len(tracked), "inventory_paths": len(paths),
        "existing_files_hashed": sum(isinstance(row.get("sha256"), str) and row["sha256"] != "GENERATED_SELF_EXCLUDED" for row in rows),
        "utf8_text_files_read": len(texts), "paths_unavailable_or_pending": unavailable,
        "categories": dict(sorted(Counter(row["category"] for row in rows).items())),
        "statuses": dict(sorted(Counter(row["status"] for row in rows).items())),
        "duplicate_groups": len(duplicates), "groups_with_multiple_active_members": len(active_groups),
        "active_package_manifests": len(packages), "active_import_edges": len(edges),
        "static_unresolved_relative_candidates": len(unresolved), "manifest_parse_errors": parse_errors,
        "self_reference_policy": "Generated inventory report bodies use an explicit excluded hash/size marker; all paths are still enumerated.",
        "limits": ["Path-based purpose and ownership are inferences, not a semantic certification.",
                   "Static imports omit computed runtime loading and can include comments or test fixtures.",
                   "Relative-resolution candidates are not build failures; use TypeScript/build/runtime validation.",
                   "Text files were read automatically; this does not claim line-by-line human review of every file.",
                   "Gitignored caches/dependencies/runtime outputs are excluded unless already tracked.",
                   "Source presence and a matching duplicate hash do not prove reachability, safety or compatible semantics."],
    }
    write_json(root / "AnalyseFuture/repository-inventory/files.json", rows)
    write_json(root / "AnalyseFuture/repository-inventory/dependencies.json", {
        "active_packages": packages, "package_edges": package_edges, "import_edges": edges,
        "unresolved_relative_candidates": unresolved, "method": "regex structural import scan plus manifest parse; not a complete semantic call graph"})
    write_json(root / "AnalyseFuture/repository-inventory/duplicates.json", duplicates)
    write_json(root / "AnalyseFuture/repository-inventory/summary.json", summary)
    header = ["COMPLETE FILE INVENTORY", "", "Method: all Git tracked paths plus nonignored additions and required audit paths.",
              "Each row accounts for one path; purpose/owner are inferred from real package/directory boundaries.",
              "UTF-8 source was read for static import analysis. This is not certification of behavior or a claim of manual review.",
              "Generated inventory bodies are self-excluded from hash/size to prevent recursive hash churn.",
              "Ignored dependency/cache/build files are not source inventory unless tracked. Unavailable files are explicit.",
              "Counts: " + json.dumps({key: summary[key] for key in ("tracked_paths", "inventory_paths", "existing_files_hashed", "utf8_text_files_read")}, sort_keys=True),
              "", "path\ttracked\tstatus\tcategory\towner\tfeature\tbytes\tsha256\tgit_mode\tinspection\tduplicate_group\tpurpose\tdependencies"]
    for row in rows:
        values = [row["path"], str(row["tracked"]), row["status"], row["category"], row["owner"], row["feature"],
                  str(row.get("bytes")), str(row.get("sha256")), row["mode"], row["inspection"], row["duplicate_group"],
                  row["purpose"], ";".join(row.get("dependencies", []))]
        header.append("\t".join(str(value).replace("\n", " ").replace("\t", " ") for value in values))
    (root / "AnalyseFuture/COMPLETE_FILE_INVENTORY.txt").write_text("\n".join(header) + "\n")

    detail = ["DUPLICATE ANALYSIS", "", "Exact content comparison of every readable non-self-generated path.",
              f"Found {len(duplicates)} SHA-256 groups; {len(active_groups)} contain more than one active path.",
              "Full memberships and hashes: AnalyseFuture/repository-inventory/duplicates.json.", "",
              "1. UPSTREAM MIRRORS", "Most duplicates are intentionally preserved source snapshots and assets.",
              "OpenReel mirror content is not a second production dependency. Keep snapshots intact as evidence.",
              "Do not merge FreeCut/OpenCut timeline engines solely because names or features resemble OpenReel.", "",
              "2. ACTIVE EXACT-CONTENT GROUPS", "Identical bytes can be deliberate package boundaries or copied configuration.",
              "Do not replace shared-looking files without reviewing imports, runtime ownership and test semantics."]
    for group in sorted(active_groups, key=lambda g: (-len(g["active_members"]), g["group"])):
        detail += ["", group["group"] + ": " + str(len(group["active_members"])) + " active copies"]
        detail += ["  " + name for name in group["active_members"]]
        members = group["active_members"]
        if all(PurePosixPath(name).suffix.lower() in ASSET_SUFFIXES for name in members):
            detail.append("Decision: retain assets at public/package boundaries; shared packaging needs reference and license validation.")
        elif all(PurePosixPath(name).suffix.lower() in CONFIG_SUFFIXES or "lock" in PurePosixPath(name).name for name in members):
            detail.append("Decision: retain framework/package configuration; identical contents do not make paths interchangeable.")
        else:
            detail.append("Decision: candidate for responsibility review; no deletion or automatic code merge from hash identity alone.")
    detail += ["", "3. SEMANTIC OVERLAP AND CONSOLIDATION BOUNDARY",
               "Web UI/store/bridge/core layers are complementary responsibilities, not duplicate complete editors.",
               "Different preview/export acceleration backends are deliberate if they share one project/timing contract.",
               "Semantic consolidation decisions and tests are recorded separately in CONSOLIDATION_REPORT.txt.",
               "This detector finds byte-identical groups and import relationships; it does not claim to solve near-duplicate algorithms.", "",
               "4. READ/SCAN LIMITS", *summary["limits"],
               "Unavailable/pending paths: " + (", ".join(unavailable) if unavailable else "none")]
    (root / "AnalyseFuture/DUPLICATE_ANALYSIS.txt").write_text("\n".join(detail) + "\n")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    summary = audit(args.root.resolve())
    print(json.dumps({key: summary[key] for key in ("tracked_paths", "inventory_paths", "utf8_text_files_read", "duplicate_groups", "groups_with_multiple_active_members", "active_import_edges", "paths_unavailable_or_pending")}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
