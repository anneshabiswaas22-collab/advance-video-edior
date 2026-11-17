# Verified browser import/edit/recover/export — 2026-11-15

Repository: https://github.com/anneshabiswaas22-collab/advance-video-edior  
Foundation: pinned OpenReel at \`367d7e90b61b5181f9861b852bb8b9d7a7d2954a\` (provisional).  
Issue: [#6](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/6), with content QA toward [#7](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/7).
Code change: [PR #14](https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/14), squash merge \`e4d24050c6cc057be99699665accd22eef0dc7c6\`.  
Independent decoded-content checker: [PR #13](https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/13), squash merge \`8e841f52df03a7b42b57d02b7221eaa7bdf814e6\`.

## What was ACTUALLY verified

GitHub Actions on Ubuntu 24.04:
- **Main editor browser smoke:** [run 43742090193](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193) — PASS: **2 Playwright tests**, 36.4 seconds.
- **Core editor install/typecheck/unit/build:** [run 43742090195](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090195) — PASS.
- **Python media fixture and content QA:** [run 43742090202](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090202) — PASS.
- **Studio browser smoke:** [run 43742090219](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090219) — PASS.

The E2E test is \`editor/apps/studio/e2e-web/main-editor-edit-export.spec.ts\`. It creates FFmpeg synthetic media: 640×360, 24fps, 1s red then 2s blue with a 440Hz soundtrack, plus an independent 880Hz WAV. The test uses the **real browser UI** to create the project, import media, double-click the video and audio thumbnails onto the timeline, dismiss the onboarding tour, and add a visible title. It exercises the **real, mounted project-store commands** (not UI split/trim gesture automation) to split at 1 second and trim the second segment to 2 seconds total, then sets the title text to "E2E TITLE". It forces an actual IndexedDB autosave, reloads the page, recovers the project with the UI, and asserts identical clip state, restored title, media references and no missing-media placeholders.

The test then invokes the **actual browser Toolbar's MP4 Standard export**, waits for a browser download, saves the bytes, fully decodes them with FFmpeg and checks codec/duration/resolution. Content QA samples pixels before and after the red/blue cut, asserts visible difference in the title region against the clean source, and verifies PCM audio is present in two expected windows. The exported MP4 and decoded measurements were attached to the Playwright test and retained in [the run's \`main-editor-browser-smoke\` artifact](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193).

The first test attempt [run 43741356307](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43741356307) **failed** because the actual first-run onboarding spotlight blocked a thumbnail click. We inspected \`editor/apps/web/src/features/onboarding/components/SpotlightTour.tsx\` and fixed the test to click the accessible **Skip tour** control. This is not an app rendering error; it was an unhandled genuine first-run UX step in the test.

## Reproduction

Use Node 22, pnpm 11.7.0, Python 3.10+, FFmpeg/ffprobe and a Chromium installation compatible with the Playwright config.

\`\`\`bash
cd editor
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @openreel/studio exec playwright install --with-deps chromium
pnpm --filter @openreel/studio exec playwright test -c playwright.web.config.ts
\`\`\`

For explicit media checks of any output:

\`\`\`bash
python scripts/media/check_media.py exported.mp4 --require-audio --decode
python scripts/media/check_edit_content.py exported.mp4 expected-edits.json --report output.json
\`\`\`

Run Python commands from the **repository root**, not \`editor/\`. Content expectations must come from known edit intent or trusted independent source media, not a golden reference derived from the export being tested.

## Unverified and remaining limitations

- **No Windows desktop packaging/installer/GPU test**; Ubuntu browser checks cannot validate those.
- **No 4K performance proof**, hardware encoding validation, benchmark across real long footage or memory/CPU budget.
- Split/trim and title-content updates in the E2E are invoked via the mounted real editor store; **pointer-driven gestures and all manual editing controls have not been exhaustively tested**.
- RGB/reference ROI and audio RMS at selected times **do not prove all-frame correctness, frame-edge one-frame sensitivity for all frame rates, full spectral mixing quality, or sample-level audio/video synchronization**. Add frame-center checks and deliberately shifted waveforms for Issue #7.
- Preview versus export frame parity and long-project crash recovery remain open.
- Both OpenReel and FreeCut have not been benchmarked equally or cleared for every third-party codec, checkpoint and asset license. Do not promote a commercial-release claim.

## Recommended next coding task

Strengthen Issue #7 with frame-index-specific boundary tests, deliberate one-frame cut-shift negatives, time-localized audio bursts with measurable latency tolerance, and a preview snapshot vs exported-frame comparison. Then benchmark FreeCut independently with the same actual media and runtime hardware (Issue #8). The browser E2E baseline should remain a regression gate for every change to timeline, persistence, export or renderer.
