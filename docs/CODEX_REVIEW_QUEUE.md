> **2026-11-17 structure handoff:** Read [the current layout](REPOSITORY_STRUCTURE.md) and [project idea](../PROJECT_IDEA.txt). Archive extractions and relocated material are preserved in `AnalyseFuture/`. Use one active OpenReel foundation, direct main commits/pushes, and five-minute checkpoints while modifying files; retain older evidence and limitations below.

# Codex Astra engineering handoff

**Verified:** 2026-11-15  
**Repository:** https://github.com/anneshabiswaas22-collab/advance-video-edior  
**Branch:** `main`  
**Open pull requests at handoff:** **0**

## Completed merge review (2026-11-15)

Six engineering PRs have now been merged. PRs #13 and #14 additionally completed
decoded media assertions and an actual Chromium edited-MP4 end-to-end baseline.
All relevant CI workflows were successful before #14 merged.

| PR | Result | Change |
| --- | --- | --- |
| [#3](../pull/3) | MERGED | Pin Playwright CI to supported Ubuntu 24.04; enable PR checks |
| [#4](../pull/4) | MERGED | Validate codecs, FPS, duration, decode and add media QA unit tests |
| [#5](../pull/5) | MERGED | Honor the actual presence/absence of audio in compressed-export planning |
| [#12](../pull/12) | MERGED | Real Chromium smoke for main web-editor startup and empty-export guard |
| [#13](../pull/13) | MERGED | Decode edited frames and audio; detect wrong cut, missing title and silent output |
| [#14](../pull/14) | MERGED | Actual main Chromium import, split/trim, title/audio, IndexedDB recovery, MP4 export and content assertions |

Post-merge GitHub Actions can be inspected at
https://github.com/anneshabiswaas22-collab/advance-video-edior/actions.
The [passing browser edited-export run](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193) now demonstrates **one** real decoded edited MP4 with selected pixel/audio checks. This is **not** proof of all editing workflows, sample-accurate audio sync, Windows/GPU/4K readiness, or commercial licensing. See [evidence](evidence/browser-edited-export-2026-11-15.md).

## Study/reference repositories

See [VIDEO_EDITOR_STUDY_REPOSITORIES.txt](VIDEO_EDITOR_STUDY_REPOSITORIES.txt)
for all **22** previously discussed editor frameworks, media libraries and AI
references. These are candidates for evaluation, NOT code automatically approved
for importing or commercial distribution.

## Next prioritized work — do not redo the merged fixes

- **P0:** [#7 Frame/audio comparison](../issues/7): extend verified baseline to one-frame boundary sensitivity, exact timed audio bursts, preview/export parity, and deliberately failing negatives.
- **P0:** [#6 Main web editor E2E](../issues/6): expand the passing store-backed editing test to actual mouse/keyboard trim and split gestures, app restart/cross-session media recovery, codec variants and richer edits.
- **P1:** [#8 Foundation ADR](../issues/8): ADR-0001 is recorded; benchmark OpenReel and FreeCut on identical media and hardware before finalizing.
- **P1:** [#9 License/SBOM](../issues/9): audit direct/transitive media dependencies, codecs and model weights.
- **P1:** [#10 AI editing security](../issues/10): validated and undoable editor commands.
- **P2:** [#11 Windows packaging](../issues/11): native runtime, hardware/GPU and release checks.
- **Umbrella:** [#2 end-to-end editor readiness](../issues/2).

## Codex continuation instruction

> Start at GitHub `main` and inspect completed PRs **#13 and #14** and
> their passing CI, especially the actual MP4 artifact from browser run 43742090193.
> The first real browser import/edit/recover/export test is **already implemented**:
> `editor/apps/studio/e2e-web/main-editor-edit-export.spec.ts`. Do NOT rewrite
> this baseline. Focus next on Issue #7 (frame-edge precision, audio synchronization,
> preview/export parity), then strengthen #6 with real UI gestures and persistence
> coverage. Read `AGENTS.md`, `docs/CODEX_HANDOFF.md`,
> `docs/evidence/browser-edited-export-2026-11-15.md`, and the 22 study references.
> Keep OpenReel the canonical editor; independently benchmark FreeCut rather
> than merging two models. No paid AI calls or unlicensed dependencies.

**Reuse-before-rebuild:** This project already contains the pinned OpenReel
source and built-in editing/agent features. Inspect what is present before adding
another dependency; preserve applicable source and media licenses.
