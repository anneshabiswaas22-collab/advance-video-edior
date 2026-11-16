# Repository structure and preservation map

Reviewed 17 November 2026. The owner requested a single coherent project, preservation of all material, and direct commits/pushes to `main` without branches or PRs. Make checkpoints within five minutes while modifying files. Do not force-push or reset away existing work.

## Where to work

```text
advance-video-edior/
  README.md                       Project entry point and development commands
  AGENTS.md                       Owner and contributor instructions
  PROJECT_IDEA.txt                 Detailed product idea and conditional roadmap
  editor/                         The one active OpenReel application workspace
    apps/web/                     Main browser editor and shared desktop UI
    apps/desktop/                 Electron/native integration; Windows needs validation
    apps/studio/                  Studio and the main editor's Playwright tests
    apps/image/                   Existing companion image workspace
    apps/cloud/                   Optional existing backend; not needed for local editing
    packages/                     Shared editing, UI, AI and creation components
    docs/                         Upstream technical documentation
    icons/                        Existing assets; retain pending usage/license audit
  scripts/                        Media QA and preservation verification
  tests/                          Python media QA tests
  docs/                           Project context, decisions, research and evidence
    adr/                          Recorded architecture decisions
    evidence/                     Dated validation and known limitations
  .github/workflows/              Five existing read-only CI/evaluation workflows
  AnalyseFuture/                  Preserved references and relocated material
    archives/                     All three original ZIP files, unchanged
    reference-sources/            Complete, independent ZIP extractions
    unrelated/                    Out-of-scope document, with original path retained
    upstream-planning/            Imported prototypes and mobile marketing
    legacy-automation/            Retired repository-writing workflows and scripts
    recovery-originals/           Original bytes of documents revised in this review
    manifests/                    Original hashes, extraction hashes and relocation map
```

The active application paths, package manifests, lockfiles, workspace membership and source code remain in place. Moving them merely to make a prettier tree would risk imports, packaging and CI. This organization removes source bundles and unrelated planning from active locations without undoing the substantial existing project.

## Active workspace boundaries

| Component | Role and constraint |
| --- | --- |
| `packages/core` | Timeline/media/playback/audio/effects/export foundation; retain one authoritative model. |
| `packages/ui` | Shared interface components. |
| `packages/agent`, `agent-runner` | Existing optional editing-agent and execution components; source presence does not establish complete security validation. |
| `creation-schema`, `creation-core`, `creation-bindings`, `creation-agent` | Existing creation/native contracts and integrations; retain together pending targeted validation. |
| `fxpkg`, `image-core` | Existing effect packaging and companion image functionality. |
| `apps/web`, `apps/desktop` | Primary product surfaces. Browser operation is tested; Windows release behavior remains unverified. |
| `apps/studio` | Existing development surface and shared Playwright dependency; removing it would break current main-editor E2E commands. |
| `apps/image`, `apps/cloud` | Existing optional companions. Do not deploy or enable remote services as part of local editing by default. |

TypeScript/React remains the primary application stack. Python media QA, AssemblyScript/WASM, shader code and native components have separate jobs. This review does not translate languages or introduce another timeline engine.

## Archive extraction and exact preservation

| Original file, formerly at repository root | Preserved ZIP | Complete extraction | Files |
| --- | --- | --- | ---: |
| `openreel-video-main.zip` | `AnalyseFuture/archives/openreel-video-main.zip` | `AnalyseFuture/reference-sources/openreel-video-main/` | 8,591 |
| `freecut-main.zip` | `AnalyseFuture/archives/freecut-main.zip` | `AnalyseFuture/reference-sources/freecut-main/` | 2,877 |
| `OpenCut-main.zip` | `AnalyseFuture/archives/OpenCut-main.zip` | `AnalyseFuture/reference-sources/OpenCut-main/` | 130 |

All ZIP CRC checks passed. Paths were checked for traversal, symlinks and duplicates before extraction. Every extracted file was checked against its archive entry by SHA-256; original ZIP hashes and per-file hashes are retained. Archive executable bits were restored without running archive code. Nested ignore rules were accounted for when staging the exact extraction contents. Snapshot files are marked as vendored and exempt from text normalization in `.gitattributes`.

The OpenReel ZIP is predominantly the same foundation already under `editor/`: 8,564 matching files, two differing files, and 25 ZIP-only files. The two differences are `ExportDialog.tsx` and its test. Existing project fixes were preserved; the ZIP did not overwrite the application. FreeCut and OpenCut remain independent comparison material.

## Why material was relocated

| Original location | Preserved location | Reason |
| --- | --- | --- |
| Root ZIPs | `AnalyseFuture/archives/` | Remove bundles from the active project root while retaining originals. |
| `editor/test.md` | `AnalyseFuture/unrelated/editor/test.md` | Contains an unrelated BigShots golf/iOS/Watch development and payment proposal. No active application reference was found. |
| `editor/creating-views/` | `AnalyseFuture/upstream-planning/editor/creating-views/` | Seven upstream design prototype files. Their technical-spec reference was updated. These are not the production UI. |
| `editor/APP_STORE_SUBMISSION.txt`, `editor/STORE_RELEASE_NOTES.md` | Same paths under `AnalyseFuture/upstream-planning/` | Upstream mobile marketing/release planning does not establish delivered browser/Windows or mobile support. |
| `.github/workflows/import-editor.yml`, `scripts/import_editor_from_upstream.sh` | Same paths under `AnalyseFuture/legacy-automation/` | One-time import workflow is obsolete; it can write source and push to main. |
| `.github/workflows/audit-public-references.yml`, `scripts/audit_public_references.sh` | Same paths under `AnalyseFuture/legacy-automation/` | Research automation can regenerate evidence and push to main. Retained for explicit future review, inactive in Actions. |

Archived automation retains its original bytes and old relative-path assumptions. Do not execute it in its archive location or restore it as active automation without review. Its original trigger references are historical, not current instructions.

The existing icon collection, technical docs, optional apps and native code were retained. Size, unfamiliarity or a different programming language is insufficient reason to classify a file as unwanted. No third-party snapshot was merged into the production application.

## Findings and limits of the review

The owner reported unauthorized disruption. Local history inspection found that `4323697` (titled “Initial commit”) added the three ZIPs above earlier project history. The current history, ZIP comparison and unrelated document do not identify an attacker or establish which changes were unauthorized. No commit history was rewritten.

This is a repository structure review, not a complete GitHub account or organization incident investigation. Account sessions, tokens, collaborators, app grants, audit logs and server-side branch settings were not verified. If unauthorized access remains, moving files alone cannot prevent further changes; the repository owner should review those access controls separately.

## Verification and future maintenance

Run from the repository root:

```bash
python3 scripts/verify_repository_preservation.py
python3 -m unittest discover -s tests -v
```

The preservation checker verifies all 8,611 original tracked files at their retained locations or exact preserved copies, all 11,598 extracted files, all ZIPs and all 14 documented file relocations. It does not execute archived code or certify that a file is safe. The manifests and original Git history provide provenance, not independent proof of trust.

Development commands remain under `editor/`: install the pinned pnpm 11.7.0 with the frozen lockfile, then `pnpm dev`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Cloud-specific startup and dependency instructions are saved in the environment configuration. Dependencies, `dist/`, WASM build outputs, caches and live processes are generated/runtime state, not additional project checkouts.

For new work, read [the project idea](../PROJECT_IDEA.txt), [memory index](PROJECT_MEMORY_INDEX.md) and [review queue](CODEX_REVIEW_QUEUE.md). Check existing implementation before adding features. Record a reason and original path when moving uncertain material to `AnalyseFuture/`, and preserve the original bytes of important documents before substantial edits. Do not restore legacy write automation or import another complete editor merely because it is present in the archive.
