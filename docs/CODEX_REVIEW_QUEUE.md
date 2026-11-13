# Codex Astra review queue

**Updated:** 2026-11-13  
**Repository:** https://github.com/anneshabiswaas22-collab/advance-video-edior  
**Target branch:** `main`

This is an **on-demand handoff**, not a continuously running agent. Review and merge
only verified changes. The main branch currently contains a pinned OpenReel source
import, a successful upstream `pnpm typecheck && pnpm test && pnpm build` baseline,
and independent FreeCut build/test comparison. Real main-editor import/edit/export
browser E2E remains unverified.

## Changes awaiting Astra review

| Order | Pull request | Intent | Available evidence |
| --- | --- | --- | --- |
| 1 | [#3 — Studio Playwright runner](../pull/3) | Use supported Ubuntu 24.04 runner and run Studio E2E on PRs | PR Playwright + root media CI passed; does **not** prove the main editor export |
| 2 | [#4 — Media export validation](../pull/4) | Add codecs, frame rate and FFmpeg full-decode checks | 16 Python unit tests + synthetic MP4 decode passed locally, root PR CI passed |
| 3 | [#5 — Silent compression sizing](../pull/5) | Honor `hasAudio=false` in Smaller File export mode | Editor CI passed with two new regression tests; review before merge |
| 4 | [#12 — Main editor Chromium startup](../pull/12) | Exercise the main web editor in real Chromium, separate from Studio | CI PR startup workflow pending; follow test artifacts and logs |

### Review procedure for each PR

1. Inspect code diff, upstream compatibility, TypeScript/Python versions and the license impact.
2. Check all relevant GitHub Actions runs at the **current PR head SHA**.
3. When failures occur, reproduce and fix without weakening the assertion or hiding an error.
4. Confirm each change actually addresses the stated problem and preserves existing behavior.
5. Merge independently in order after successful checks; do not merge on a stale CI result.
6. If a PR changes `main` while another is under review, check whether its base or tests need updating.
7. After merges, verify `main` CI, and update this table/close completed work.

## New prioritized work (separate tasks, do not implement all at once)

- **P0:** [#6 Main web editor E2E](../issues/6) — actual import, trim, text/audio, save, reopen, MP4 export.
- **P0:** [#7 Frame and audio fidelity checks](../issues/7) — prove content/timing, not just decodability.
- **P1:** [#8 FreeCut vs OpenReel real benchmarks](../issues/8) — measured final foundation decision.
- **P1:** [#9 License, codecs and AI asset SBOM](../issues/9) — redistribution readiness.
- **P1:** [#10 Agent command security/undo](../issues/10) — guarded, reversible AI editing.
- **P2:** [#11 Windows packaging and real GPU QA](../issues/11) — native release pipeline.
- **Umbrella:** [#2 Working export milestone](../issues/2).

## Credit-saving rule

Use existing OpenReel code under `editor/`; do **not** restart the editor
from scratch. Inspect dependencies and current tests before implementing a
feature. Avoid paid inference or arbitrary bulk repository copying.
Keep scope bounded to one verified behavior per PR, and preserve source licenses.

## Suggested first Codex instruction

> Review PRs #3, #4, #5 and #12 in order. Check their actual GitHub Actions results and
> fix any failures. Merge into main only after adequate review/approval. Then begin
> issue #6: deliver a real browser import-edit-save-export E2E using test media.
> Read AGENTS.md and docs/CODEX_HANDOFF.md. Document measured outcomes rather
> than claiming capability from upstream README files.
