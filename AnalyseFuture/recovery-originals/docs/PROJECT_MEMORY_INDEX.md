# Project Memory & Developer Handoff — START HERE

**Project:** Advanced Video Editor (Web + Windows)
**Repository:** https://github.com/anneshabiswaas22-collab/advance-video-edior
**Last context consolidation:** 2026-11-16
**Purpose:** Make this repository understandable after ChatGPT/Codex chat context is lost.

> **Scope / accuracy:** This is a curated archive of the project context available at consolidation time, including the user's stated product goals, currently inspectable GitHub source/evidence, research inventory, decisions, links, and next tasks. It is NOT a verbatim export of every historical chat message. Prior conversations not provided or recoverable are not recreated. Repository source, currently merged GitHub code, Issues, PRs, and CI logs remain the primary record for factual status. Recheck live GitHub before changing code.

## Read these documents in this order

| Order | File | Contents |
|---|---|---|
| 1 | [PROJECT_MASTER_CONTEXT.md](PROJECT_MASTER_CONTEXT.md) | Mission, complete target capabilities, current architecture, verified vs unverified status, design rules, costs, milestones, limitations |
| 2 | [PROJECT_RESEARCH_AND_REFERENCES.md](PROJECT_RESEARCH_AND_REFERENCES.md) | All 22 study references and URLs, OpenReel vs FreeCut vs OpenCut, risks, integration guidance |
| 3 | [PROJECT_ARCHITECTURE_AND_EVIDENCE.md](PROJECT_ARCHITECTURE_AND_EVIDENCE.md) | GitHub-rendered architecture diagrams, observed call paths, quality gates, CI and PR links |
| 4 | [PROJECT_CHAT_DECISIONS.md](PROJECT_CHAT_DECISIONS.md) | Reconstructed discussion chronology, approved rules, decisions and unresolved questions; NOT a literal chat transcript |
| 5 | [PROJECT_CODEX_CONTINUATION.md](PROJECT_CODEX_CONTINUATION.md) | Complete paste-ready Codex prompt, prioritized tasks, reproducible commands, definition of done |
| 6 | [VIDEO_EDITOR_STUDY_REPOSITORIES.txt](VIDEO_EDITOR_STUDY_REPOSITORIES.txt) | Original canonical 22-reference inventory from earlier research |
| 7 | [CODEX_REVIEW_QUEUE.md](CODEX_REVIEW_QUEUE.md) | Latest engineering handoff, merged work and issue queue (recheck for newer status) |
| 8 | [evidence/browser-edited-export-2026-11-15.md](evidence/browser-edited-export-2026-11-15.md) | Evidence of first actual edited browser MP4 |
| 9 | [adr/0001-single-editor-foundation.md](adr/0001-single-editor-foundation.md) | Original provisional one-engine decision (updated three-repository study protocol is in the research document) |
| 10 | [REUSE_AND_LICENSES.md](REUSE_AND_LICENSES.md) | Commercial dependency and licensing safeguards |

**Consolidated Word documents:** [DOCX — ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.docx](ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.docx) and [RTF fallback](ADVANCED_VIDEO_EDITOR_PROJECT_HANDOFF.rtf). GitHub Markdown files are the editable, diffable source of truth. Word formats are generated snapshots; update the Markdown sources after every engineering milestone.

## Five-minute restart checklist

1. Read this index, [AGENTS.md](../AGENTS.md) and [CODEX_REVIEW_QUEUE.md](CODEX_REVIEW_QUEUE.md).
2. Pull latest main and inspect open PRs, Issues #6–#11, CI and source changes. Do not trust this date as permanently current.
3. Existing implementation: OpenReel is already under editor/. Do NOT reimport it or introduce a second timeline/project/rendering engine.
4. PRs [#13](https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/13) and [#14](https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/14) were merged; the main browser real edited MP4 test has passed.
5. First next engineering work: improve [Issue #7](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/7) one-frame cut/audio timing/preview-export parity, then [Issue #6](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/6) real GUI editing gestures; compare OpenReel, FreeCut, OpenCut for [Issue #8](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/8).
6. Make a focused working code improvement and real tests; do not spend all effort on new plans/docs.
7. Update this index plus evidence and the queue after each meaningful milestone. Never mark a feature done from a README claim alone.

## Status snapshot (not a live dashboard)

- Verified 2026-11-16: main branch was accessible, with **zero open PRs** at the moment of inspection.
- Merged PRs referenced in the existing handoff: #3, #4, #5, #12, #13, #14.
- [CI browser edited-export run](https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193) passed two Playwright tests on Ubuntu 24.04; output includes an edited, decoded MP4 and selected visual/audio checks.
- Windows desktop runtime, Windows GPU, 4K performance, comprehensive frame-perfect audio sync, creator workflows at professional scale, and complete commercial license/SBOM review remain **NOT VERIFIED**.

## Update policy / chat durability

Keep project memory **in GitHub docs, not only in chat**. Each completed task should update the architecture map, a link to its commit/PR, test evidence (commands + outcome), known limitations, the prioritized queue and the next Codex starting prompt. Large chat context can be summarized in PROJECT_CHAT_DECISIONS.md, with dates and source links; avoid claiming full verbatim capture. Never store API keys, account credentials, private media, or personal secrets in a public repository.
