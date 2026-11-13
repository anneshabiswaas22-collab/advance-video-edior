# Codex Cloud handoff: first implementation assignment

Repository: https://github.com/anneshabiswaas22-collab/advance-video-edior

Current setup PR introduces docs and portable media QA tooling, **not a finished editor**. In Codex Cloud, select this repository and start from the bootstrap PR branch after merging or checking out the proposed files.

## Immediate tasks (in order)

1. Read AGENTS.md, docs/FOUNDATION_EVALUATION.md and docs/REUSE_AND_LICENSES.md.
2. Run Python unit tests, generate the synthetic MP4 fixture and probe it. Check both Python and FFmpeg versions.
3. Fetch exact upstream commits and clone OpenReel + FreeCut separately for benchmark testing. Run the documented install/test/build commands, capture failures.
4. Perform the benchmark scenarios; include verified outputs, at minimum import -> trim -> captions/title -> save -> reopen -> MP4 export.
5. Create docs/evidence/ evaluation records, including observed bugs, measurements and license findings. Decide the foundation using the rubric.
6. After decision, import exactly one core editing architecture in its own pull request, preserving license text and attribution. Do not replace working work without tests.
7. Implement a true vertical slice that a user can run: import a local MP4, add to timeline, trim, mix audio, add text, save/reopen, export. Validate output with this repository's QA tools and additional frame inspection.
8. Log Windows-native test requirements separately rather than presenting cloud GPU results as Windows validation.

## Definition of success for this first milestone

- Both candidates assessed with recorded reproducible evidence.
- A defensible, documented choice of primary foundation.
- Clear architecture and dependency/license inventory.
- A browser editor integrated and runnable with at least one user-editable and exported project.
- Tests and exact local/Codex instructions.
- No false claims about universal CapCut parity, AI costs, desktop installers or 4K performance.

## Codex prompt

Work directly in the connected repository. Read AGENTS.md and docs/CODEX_HANDOFF.md. First run and improve the baseline tests. Then benchmark OpenReel and FreeCut using docs/FOUNDATION_EVALUATION.md. Make evidence-based selection, record pinned upstream revisions and licenses, and integrate ONE working editor in a reviewable PR. Focus on import-edit-save-reopen-export before AI features. Report commands, verified results, failures and test artifacts. Avoid redundant engine development and duplicate dependencies.
