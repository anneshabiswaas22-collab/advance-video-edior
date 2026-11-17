# Advanced Video Editor

**Start here:** [Detailed project idea](PROJECT_IDEA.txt) · [Repository structure](docs/REPOSITORY_STRUCTURE.md) · [Preserved material](AnalyseFuture/README.md)

The active application remains in `editor/`. All three source ZIPs and their complete extractions are preserved in `AnalyseFuture/`; they are references, not additional production editors. Legacy automation that wrote directly to `main`, unrelated material, and upstream-only planning are preserved there too. See the [structure review and validation](docs/evidence/repository-restructure-2026-11-17.md).

**New contributors / Codex after chat context loss:** Start with [Project Memory & Developer Handoff](docs/PROJECT_MEMORY_INDEX.md) (mission, source paths, all 22 references, OpenReel/FreeCut/OpenCut comparison, diagrams, CI, decision history, and paste-ready continuation prompt). [Word DOCX handoff](docs/ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.docx) and [RTF](docs/ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.rtf). This is curated available context, not a verbatim full chat export.

An early-stage project to build an original, high-quality, AI-assisted video editor for web and Windows, inspired by the usability of CapCut and the professional workflows of DaVinci Resolve and Premiere.

> **Project state: First real Chromium edited-export milestone verified (2026-11-15).** OpenReel is the provisional source under `editor/`. A GitHub Actions browser test imports video/audio, splits and trims via the actual editor store, adds a title, saves to IndexedDB, reloads, recovers media and exports a decoded MP4 with sampled frame/title/audio checks. This is **not** a full professional-editor certification: native Windows, GPU/4K performance, all UI gestures and frame-accurate A/V sync are still unverified. Run `cd editor && pnpm install --frozen-lockfile && pnpm dev` for development.

## Engineering approach

**Reuse before rebuild.** Evaluate [OpenReel](https://github.com/Augani/openreel-video) and [FreeCut](https://github.com/walterlow/freecut) with identical test media. Adopt exactly one primary editor codebase, keeping one authoritative timeline, project format and preview/export contract. Other repositories are possible libraries or implementation references, **not** codebases to merge wholesale.

Start with [AGENTS.md](AGENTS.md), [the foundation decision procedure](docs/FOUNDATION_EVALUATION.md), [reuse and licensing policy](docs/REUSE_AND_LICENSES.md), and [the Codex handoff](docs/CODEX_HANDOFF.md).

## Verified Chromium editing and export workflow

The actual main web editor is exercised by [`main-editor-edit-export.spec.ts`](editor/apps/studio/e2e-web/main-editor-edit-export.spec.ts) using Playwright and real FFmpeg fixtures. The test verifies project recovery and the exported MP4 with [`check_media.py`](scripts/check_media.py) and [`check_edit_content.py`](scripts/check_edit_content.py). See [browser export evidence](docs/evidence/browser-edited-export-2026-11-15.md), [ADR-0001](docs/adr/0001-single-editor-foundation.md) and [the current review queue](docs/CODEX_REVIEW_QUEUE.md).

Passing [browser CI](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193) includes the playable export as an Actions artifact; it does not validate native Windows or a real GPU. The E2E test uses real UI file import/title placement and the mounted editor's actual command store for split/trim (not simulated mock clips).

## Current executable contribution: repeatable media QA

We can test the validity and basic audio/video properties of files exported by whichever editor wins the evaluation. The QA tools require Python 3.10+; fixture generation and probing additionally require FFmpeg and ffprobe on PATH.

```bash
python -m unittest discover -s tests -v
python scripts/generate_fixtures.py --output-dir test-output
python scripts/check_media.py test-output/sample-3s.mp4 --require-audio --min-width 640 --min-height 360 --min-seconds 2.8 --max-seconds 3.2
```

Test clips are generated locally and not committed. `check_media.py` validates container, codecs, duration and full decode. `check_edit_content.py` separately measures decoded pixel colors/reference differences and audio RMS at known timestamps. Together these checks cover the tested fixture, not every possible editing operation or exact audio phase synchronization.

## Milestones

1. Inspect and benchmark OpenReel and FreeCut (equal-hardware comparison still pending).
2. Select and import a foundation while retaining license notices and upstream history/attribution where appropriate.
3. Verify one edit-save-reopen-export workflow: **browser Chromium/Linux baseline passed**; desktop Windows remains unverified.
4. Add proven creator, AI, audio and professional features incrementally.
5. Validate security, performance and redistribution obligations before release.

Contributions should happen in reviewable pull requests, with evidence of what was actually run. No proprietary editor code/assets or unlicensed media may be copied.
