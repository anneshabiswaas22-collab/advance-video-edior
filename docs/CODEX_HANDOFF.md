# Codex Cloud: development handoff after initial source import

**First read `docs/CODEX_REVIEW_QUEUE.md` for the latest PRs and prioritized issues.**

Repository: https://github.com/anneshabiswaas22-collab/advance-video-edior
Default branch: `main` (user explicitly permits direct pushes).

## Verified work already in main
- Media QA scripts, Python tests and GitHub Actions smoke checks.
- Automated cloning of both primary candidates at pinned SHAs.
- OpenReel imported under `editor/`, with its MIT license and attribution preserved:
  `367d7e90b61b5181f9861b852bb8b9d7a7d2954a`.
- FreeCut revision cloned for research only:
  `5ceeeb388eef5423640b7db157706274bf1b8165`.
- Root CI baseline has passed (6 unit tests and synthetic FFmpeg file validation).
- Upstream source import is **not proof** of working end-to-end export, 4K performance, Windows compatibility or commercial AI-model clearance.

## Your first coding milestone — make the actual editor work
1. Check GitHub Actions for `Import and verify initial video editor`. Examine and fix any install, typecheck, test or build failures.
2. In `editor/`, install with pinned pnpm and run `pnpm dev`; confirm the existing editor UI really loads.
3. Generate test video using the root script, then exercise browser editing. Add a deterministic, automated E2E test that imports footage, splits/trims, adds a title and audio, saves/reopens project, exports MP4 and checks container/codecs/duration with ffprobe.
4. Document visual accuracy, audio sync and preview/export differences; metadata-only inspection does not prove these properties.
5. Test FreeCut separately on identical samples; write `docs/evidence/freecut-evaluation.md` and `docs/evidence/openreel-evaluation.md` with exact commands, tested browser, export artifacts, performance measurements and observed bugs. Decide whether OpenReel stays the foundation, with evidence.
6. Then implement a small *working* feature that addresses the highest-value verified editor gap. Search existing code and upstream packages before new code.
7. Commit incremental changes directly to `main`, without force pushing or deleting existing work. Log the source commit, test results and outstanding limitations.

## Source locations
- `editor/apps/web` — browser application.
- `editor/apps/desktop` — alpha desktop application.
- `editor/packages/core` — timeline, playback, audio, media and export.
- `editor/packages/ui` — shared UI.
- `editor/packages/agent` — optional AI tools/commands.
- `scripts/check_media.py` — reusable ffprobe-based metadata checks.

## Acceptance before calling v0.1 usable
- Actual browser UI launches and can import local video.
- Multitrack timeline can trim video, add voice/audio and text.
- Project survives save/reopen.
- A fully edited, playable MP4 is exported and inspected.
- Automated tests and build pass.
- Licensing/attribution requirements recorded.
- Cloud-only tests not mislabeled as Windows/GPU tests.

## Suggested Codex Cloud prompt
> Open `main` of `anneshabiswaas22-collab/advance-video-edior`. Read AGENTS.md and this file. The OpenReel source is already in editor/; do not re-clone or recreate it. Run its test/build commands, fix specific failures, and implement real browser E2E import-edit-save-export checks using our synthetic media. Compare FreeCut separately, but do not merge it. Make small tested commits to main, include exact run results and link exported artifacts. Prioritize actual user-visible working editing over mockups and additional plans.
