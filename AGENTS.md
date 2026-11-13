# Agent instructions for Codex / GPT-6 Astra

## Product objective

Build an original, reliable and commercially viable web + Windows video editor that competes through editing quality, ease of use and optional AI automation. Benchmarks: CapCut (creator UX), DaVinci Resolve (color/audio/compositing) and Premiere (precision workflows). Do not claim parity without passing benchmark criteria.

## Current truth

As of initial bootstrap the repository has only a README, documents and portable media QA scripts. No editor implementation has been selected or imported. Never treat documentation of an external project as evidence of tested functionality in this repository.

## First assignment

1. Read README.md, docs/FOUNDATION_EVALUATION.md, docs/REUSE_AND_LICENSES.md, docs/CODEX_HANDOFF.md.
2. Clone OpenReel and FreeCut into separate temporary directories, **not** over this repo. Pin exact upstream commit hashes and versions.
3. Inspect licenses, package scripts, actual implementations, open bugs, security posture and test coverage.
4. Install and run both apps in supported environments. Perform the same imported-media -> trim -> text overlay -> save/reopen -> export MP4 workflows. Measure and attach evidence.
5. Update the foundation matrix with ACTUAL results, separating VERIFIED, FAILED, UNTESTED, and DOCUMENTED ONLY.
6. Select one primary architecture based on evidence; write an ADR. Do not merge competing timeline, compositor or render pipelines.
7. Port the selected foundation via a clear, reviewable path, preserving attribution and licenses. Build a browser editor before taking on OS-specific packaging.
8. Deliver one reliable vertical slice: import, multitrack timeline, scrub, trim, text, audio, save/reopen, export playable MP4, and regression tests.

## Mandatory credit-saving rules

- Reuse before implementation. Search existing code/dependencies first.
- No blind bulk installs or imports of many repositories.
- Prefer a functioning vertical slice to placeholder interfaces.
- Make small changes; run targeted tests then CI; attach commands and results to PRs.
- Do not repeatedly research the same dependency: record pinned commit, license, decision and date in docs.
- Make paid AI model/API use opt-in; never commit keys or execute chargeable remote inference as a default.
- Preserve user work and avoid force-push/reset and main-branch edits.
- Stop when missing credentials, incompatible hardware or permission makes a verification impossible; document what could not be tested.
- Do not quietly add GPL/AGPL, non-commercial model weights or assets to a proprietary deliverable. Obtain a licensing decision first.
- Render-quality claims need a checked exported file, not only a screenshot or successful build.

## QA commands

```bash
python -m unittest discover -s tests -v
python scripts/generate_fixtures.py --output-dir test-output
python scripts/check_media.py test-output/sample-3s.mp4 --require-audio --min-seconds 2.8 --max-seconds 3.2
```

Use these scripts as baseline fixture/metadata tests. Once an editor is integrated, add frame/audio comparison tests and Windows-native hardware tests. Log platform, exact build SHA and tools used.

## Definition of done for any editing feature

1. Implemented and reachable through the product UI / supported agent command.
2. Produces correct state, supports undo/redo as appropriate.
3. Persists through save/reopen.
4. Matches intended preview and exported output.
5. Has regression tests with representative video/audio fixtures.
6. Has verified license and security implications.
7. Documented as tested, partial, or untested without exaggeration.
