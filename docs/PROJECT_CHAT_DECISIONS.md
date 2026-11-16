# Project Conversation & Decision Archive (Reconstructed)

**Purpose:** Preserve meaningful user instructions, decisions, research questions, and outcomes so future agents do not need original chats.
**Important limit:** This is a faithful **summary of available project chat context plus inspected GitHub**, NOT a verbatim complete ChatGPT export. Some earlier conversations are represented only by retained summaries, so missing exact word-for-word history cannot be reconstructed. Do not call this an exhaustive chat transcript.

## Timeline of major requests and choices

### Nov 12–13, 2026 — World-class editor vision and ownership
- User supplied repository: https://github.com/anneshabiswaas22-collab/advance-video-edior
- Goal: commercial Web/Windows editor, eventual benchmark against CapCut usability, Premiere precision and DaVinci audio/color/compositing; should be own original product, not a generic demo.
- Codex/GPT to act as principal architect/senior engineer, inspect existing code before changes, combine compatible *features* not incompatible engines, push useful code to GitHub, validate real media, preserve licenses.
- User authorized careful direct commits to main in AGENTS.md history; later prompts also favor reviewable PRs when appropriate. Never force push or overwrite unrelated work.
- Desired autonomy: "think longer" and do work, not just propose plans; keep spend/credits low, use free/local tools and avoid paid API calls.

### Nov 13–15 — Source import, initial CI and 22 references
- OpenReel source imported and pinned under editor/ (SHA 367d7e90b61b5181f9861b852bb8b9d7a7d2954a).
- FreeCut evaluated as separate alternative/reference (historical SHA 5ceeeb388eef5423640b7db157706274bf1b8165), not merged into editor.
- Study list established at docs/VIDEO_EDITOR_STUDY_REPOSITORIES.txt: 22 references (21 GitHub repositories + Kokoro-82M Hugging Face model). Includes OpenCut as reference #4.
- Media QA and GitHub workflows added; passing compilation/unit counts do not imply verified editing/export.
- Historical earlier merged PRs: #3, #4, #5, #12.

### Nov 15 — Master build specification and real media proof
- User supplied comprehensive 10-phase "MASTER BUILD PROMPT — ADVANCED VIDEO EDITOR": latest main audit, inspect named source paths, study all 22, select exactly two primary references, reuse first, implement Issue #6 first then #7, roadmap stages A–E, typecheck/test/build, GitHub Actions handoff, real code delivery, low-credit execution limits, structured final report.
- Early focus on 2 editors: OpenReel (main provisional) and FreeCut (comparison); reasons: imported code and avoid full parallel renderers.
- PR #13 merged: exported content QA script, tests and ADR.
- PR #14 merged: real Chromium browser import/edit/recover/export test and content checks. Evidence: docs/evidence/browser-edited-export-2026-11-15.md.
- The E2E test uses actual UI import + title/audio addition, actual mounted project-store split/trim calls, IndexedDB persistence/recovery, real MP4 download/export, FFmpeg full decode and sampled pixel/audio checks. It does not guarantee every mouse gesture or sample-accurate sync.

### Nov 16 — Why not OpenCut?
- User asked whether previous prompt gives the right answers and why OpenCut was not also chosen.
- Review of current upstream OpenCut README showed current **rewrite** still advertises Rust core, Editor API, plugins, MCP, headless and scripting as upcoming; current root has web/desktop/api projects and Rust media crate.
- The older OpenCut Classic at https://github.com/OpenCut-app/opencut-classic identifies itself as archived and no longer maintained.
- User's concern is valid: evaluate OpenCut seriously, rather than excluding it by a rigid "exactly two" rule.
- **New research policy:** compare THREE primary repositories: OpenReel (retain pending benchmark), FreeCut (editing feature reference), OpenCut current (plugin/native/headless/automation reference). **Production rule stays ONE canonical editor engine**, not three merged editors. Apply rigorous actual-source evidence and minimal adapters.
- Recommended prompt addendum: current main and Issue #7 before new work; new gap matrix, code deliverables, three-repo comparison, preserve existing tests.

### Nov 16 — Why this archive exists
- User reports that long ChatGPT chats become difficult to load and models lose earlier research and decisions.
- User explicitly requested all project details, documents, charts/diagrams, links and relevant messages be deposited in the GitHub repository so a new developer or fresh Codex session can continue independently.
- The repository is now the durable project-memory hub: index, context, research, diagrams/evidence, chronological decision summary and paste-ready next Codex prompt.
- No unrelated projects, private data, credentials or personal chat details should be archived into this public repo.

## Invariants repeatedly requested by the owner

1. Build a REAL usable application, not a demonstration.
2. Compete as a product across creator and professional editing capabilities, incrementally.
3. Prioritize strong open-source reuse and low compute/API cost; do not waste coding credit writing what exists.
4. Never treat marketing README, a green TypeScript build or valid MP4 header as video-output correctness.
5. Ensure imported media, title, trimming, audio, recovery and actual exported video are correct.
6. Keep one timeline/project/renderer contract and avoid disconnected source merging.
7. Maintain user privacy, robust undo/recovery and AI command permissions.
8. Give reproducible commands, test output, artifacts, commit/PR links, blockers and next steps.
9. Document project state in GitHub so chat loss does not erase decisions.

## Distinguish past assistant findings from verified proof

- Verified by GitHub code/evidence: OpenReel import; GitHub merged PR records; passing Ubuntu browser E2E and example MP4; current READMEs and directory structure.
- Reported/documented by upstream: FreeCut feature breadth, OpenCut roadmap, various candidate licenses/features; must independently test and audit.
- Desired future capabilities: professional grade color, audio, GPU/4K, Windows certification and full plugin/AI ecosystem; not yet delivered.
- Unavailable: complete verbatim content of every earlier ChatGPT thread and attachments not supplied in current context. If exact archival transcripts are required, user should export conversations and commit sanitized copies deliberately.

## Knowledge maintenance rule

For every new completed milestone, add dated bullets to this file (request/decision/outcome/source), update current status in PROJECT_MEMORY_INDEX.md, save CI/export evidence and append the next task to PROJECT_CODEX_CONTINUATION.md. No speculative "done" claims.
