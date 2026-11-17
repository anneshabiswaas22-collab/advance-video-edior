# Agent instructions for Codex / GPT-6 Astra

> **Latest scope, 2026-11-17:** This recovery pass is structure-only. Do not run tests, builds, type checks or lint suites unless the owner later authorizes them. Read `PROJECT_STRUCTURE.md`. Classify all tracked paths, group by actual responsibility, preserve originals and uncertain material, repair references, and deliver ordinary direct-main pushes. Automated content/import inspection is not proof that every feature has been semantically validated.

> **Owner instructions, 2026-11-17:** Work as one complete project. Commit and push directly to `main`; no feature branches or PRs. Make a checkpoint within every five minutes while modifying files. Never discard unwanted or uncertain material: preserve it under `AnalyseFuture/` with its origin and reason. Keep the tested `editor/` foundation; do not combine competing timeline engines. Read `docs/REPOSITORY_STRUCTURE.md` and `PROJECT_IDEA.txt` for the current organization and product plan.

> **Repository memory (2026-11-16):** Start with [docs/PROJECT_MEMORY_INDEX.md](docs/PROJECT_MEMORY_INDEX.md) to restore full current project context, architecture diagrams, research links, available historical decision summaries, and the [Codex continuation prompt](docs/PROJECT_CODEX_CONTINUATION.md). Read [docs/PROJECT_RESEARCH_AND_REFERENCES.md](docs/PROJECT_RESEARCH_AND_REFERENCES.md): OpenReel remains the ONLY canonical editor; independent comparisons now include BOTH FreeCut and the OpenCut rewrite. The notes below are an earlier snapshot. Always inspect latest main, merged PRs, CI, and docs/CODEX_REVIEW_QUEUE.md first.

## Mission
Build an original, reliable, commercial-grade web + Windows video editor inspired by CapCut usability, DaVinci Resolve color/audio/compositing and Premiere precision workflows. Do not copy proprietary assets/code. Feature parity is a long-term benchmark, not a claim about current readiness.

## Current repository state (updated 2026-11-13)
- **Real OpenReel source is imported under `editor/`** at upstream commit `367d7e90b61b5181f9861b852bb8b9d7a7d2954a`.
- OpenReel is the **provisional foundation**; do NOT re-import or replace it without benchmark evidence and a migration plan.
- FreeCut `5ceeeb388eef5423640b7db157706274bf1b8165` was cloned separately during bootstrap, **not merged**.
- The root `scripts/` and `tests/` are reusable FFmpeg media-QA utilities, not the actual editor engine.
- The retired import workflow is preserved, inactive, at `AnalyseFuture/legacy-automation/.github/workflows/import-editor.yml`. Current CI lives in `.github/workflows/`. A passing compile is not proof of media playback/export correctness.
- The user has **authorized direct commits to `main`**. Make small, non-destructive commits, run tests, avoid force pushes, do not overwrite other work.

## Current review queue

Before starting new work, read `docs/CODEX_REVIEW_QUEUE.md` for existing pull requests and prioritized issues. Review and test pending changes before duplicating them. Do not auto-merge unreviewed code.

## Immediate executable task
1. Read `docs/CODEX_HANDOFF.md`, `docs/EDITOR_IMPORT_PLAN.md`, `docs/FOUNDATION_EVALUATION.md`, and `docs/REUSE_AND_LICENSES.md`.
2. Inspect `editor/` and install the pinned pnpm version; reproduce `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm dev`. Fix failures in measured order.
3. Build automated browser end-to-end checks for **import -> trim -> text -> audio -> save -> reopen -> MP4 export**, and verify generated output with ffprobe plus representative frame/audio inspection.
4. Independently test FreeCut at the pinned SHA against the same fixtures; record comparative measurements and a decision record. Do not merge an incompatible timeline engine.
5. Develop features incrementally inside the current editor core; use compatible libraries via adapters only where an existing implementation is missing or broken.
6. Windows packaging, real-GPU latency and 4K performance require compatible Windows/GPU hardware. Clearly distinguish cloud-only results.

## Reuse-first, low-credit rules
- Search existing code and package dependencies BEFORE implementing a capability.
- No bulk-copy of external editors or dependencies, no duplicate render engines, no paid AI API calls without explicit approval.
- Maintain one project model and one editing command schema; actions should be undoable, logged, and permission constrained.
- Record upstream SHA, component licenses, model weight licenses, third-party notices, and test evidence. Use a mock/fake provider in CI.
- Run targeted tests and incremental builds rather than repeated large-suite reruns.
- Preserve attribution; investigate FFmpeg LGPL/GPL build configuration, proprietary codecs and noncommercial AI weights.
- Do not claim functionality, Windows validation or preview/export parity without actual tests.

## Commands
```bash
python -m unittest discover -s tests -v
python scripts/media/generate_fixtures.py --output-dir test-output
python scripts/media/check_media.py test-output/sample-3s.mp4 --require-audio --min-seconds 2.8 --max-seconds 3.2
cd editor
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

## Definition of done
A feature is reachable from the application UI or guarded agent command, persists through save/reopen, performs correctly with undo/redo as appropriate, matches exported output, has regression tests and reviewed license/security implications. Report failed/unverified behavior accurately.
