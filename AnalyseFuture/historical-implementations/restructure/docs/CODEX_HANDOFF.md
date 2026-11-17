> **New (2026-11-16):** Read [PROJECT_MEMORY_INDEX.md](PROJECT_MEMORY_INDEX.md) for consolidated project history, all research links/diagrams, three-reference OpenReel/FreeCut/OpenCut evaluation policy and current Codex continuation prompt. This document remains an earlier onboarding snapshot; verify latest main and review queue.

# Codex Cloud: development handoff after first working Chromium edited export

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
- PRs [#13](../pull/13) and [#14](../pull/14) are **MERGED** and provide a decoded-content verifier and the actual main Chromium import/edit/recover/export regression.
- [Browser CI run 43742090193](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193) passed 2 Playwright tests, exporting an actual edited MP4 with FFmpeg frame/audio checks. [Editor typecheck/tests/build](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090195), [media QA](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090202) and [Studio smoke](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090219) also passed.
- This **proves one narrow, automated Chromium/Linux workflow**, **not** sample-accurate A/V sync, GUI split/trim gestures, native Windows, 4K/GPU throughput or commercial checkpoint/codec clearance. See [full evidence](evidence/browser-edited-export-2026-11-15.md).

## Immediate coding milestone — strengthen verified output, do not reimplement

1. Read [the completed Chromium E2E](../editor/apps/studio/e2e-web/main-editor-edit-export.spec.ts), [actual export artifact and logs](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193), `docs/CODEX_REVIEW_QUEUE.md` and [ADR-0001](adr/0001-single-editor-foundation.md).
2. **Issue #7**: add frame-center cut-boundary assertions at 24/30fps, an intentionally one-frame-shifted output that must fail, timed audio tone/burst checks with measurable sample tolerances, and actual preview-versus-export sample matching. Make compact deterministic fixture tests first.
3. **Issue #6**: expand the real browser test to verify split/trim **UI pointer/keyboard controls** rather than only genuine project-store commands; test reopening projects containing different clip formats and missing/relinked assets.
4. **Issue #8**: run FreeCut separately with the exact same media fixture/hardware and record export artifact, codec/timing, memory, CPU, GPU, observed errors, and exact source/license versions. Do not import a second project state or render engine.
5. **Issue #9**: audit transitive and asset/model/checkpoint licenses; report any uncertainty as BLOCKED rather than assuming commercial usability.
6. Preserve current `pnpm@11.7.0`, Node22, browser Playwright/Vitest and root Python/FFmpeg infrastructure. Use targeted tests and small pull requests; never spend credits duplicating mature functionality.

## Source locations
- `editor/apps/web` — browser application.
- `editor/apps/desktop` — alpha desktop application.
- `editor/packages/core` — timeline, playback, audio, media and export.
- `editor/packages/ui` — shared UI.
- `editor/packages/agent` — optional AI tools/commands.
- `scripts/check_media.py` — ffprobe metadata + full FFmpeg decode.
- `scripts/check_edit_content.py` — decoded frame reference/color and audio RMS window checks.
- `editor/apps/studio/e2e-web/main-editor-edit-export.spec.ts` — actual Chromium edited MP4 export and persisted project recovery.

## Remaining acceptance before calling v0.1 generally usable
- Actual browser UI launches and can import local video.
- Multitrack timeline can trim video, add voice/audio and text.
- Project survives save/reopen.
- A fully edited, playable MP4 is exported and inspected.
- Automated tests and build pass.
- Licensing/attribution requirements recorded.
- Cloud-only tests not mislabeled as Windows/GPU tests.

## Suggested Codex Cloud continuation prompt

> Begin at latest `main`. Read AGENTS.md, CODEX_REVIEW_QUEUE.md and the 2026-11-15 edited export evidence. The real browser import/split/trim/title/audio/save/recover/export MP4 path is **already passing** after PR #14; do not recreate it. Strengthen Issue #7 by adding deliberately one-frame-shifted video failures, audio burst latency/sync measurements and preview/output comparison. Preserve one OpenReel engine, reuse the existing Python media QA and Playwright tests and verify a real output after changes. Benchmark FreeCut independently only when useful. Submit small tested commits, record measured runs and remaining gaps without any paid services.

## Portable document copies

GitHub-native master files are indexed at [PROJECT_MEMORY_INDEX.md](PROJECT_MEMORY_INDEX.md). For Word users, [DOCX consolidated project handoff](ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.docx) and [RTF fallback](ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.rtf) provide portable copies. These are curated available context, not full verbatim chat exports.
