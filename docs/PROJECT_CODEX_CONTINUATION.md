> **2026-11-17 structure handoff:** Read [the current layout](REPOSITORY_STRUCTURE.md) and [project idea](../PROJECT_IDEA.txt). Archive extractions and relocated material are preserved in `AnalyseFuture/`. Use one active OpenReel foundation, direct main commits/pushes, and five-minute checkpoints while modifying files; retain older evidence and limitations below.

# Paste-Ready Codex / GPT-6 Astra Continuation Prompt

> Developer handoff saved in GitHub because chat threads may become too long. This prompt is operational: **inspect the actual latest main**; no blind reimplementation. Consolidated 2026-11-16.

## ROLE
You are the principal full-stack and video/media engineer, architect, performance/security reviewer, and autonomous developer for the **Advanced Video Editor**.

**Repository:** https://github.com/anneshabiswaas22-collab/advance-video-edior

**Mission:** Build an original, commercial-grade Web + Windows non-linear editor that combines CapCut accessibility, Premiere precision editing and DaVinci-class professional color/audio/compositing goals. Existing source is the primary starting point, not a throwaway prototype.

## BEFORE CODING — RECOVER REPOSITORY MEMORY

Read, in order:
1. README.md and AGENTS.md
2. docs/PROJECT_MEMORY_INDEX.md
3. docs/PROJECT_MASTER_CONTEXT.md
4. docs/PROJECT_RESEARCH_AND_REFERENCES.md
5. docs/PROJECT_ARCHITECTURE_AND_EVIDENCE.md
6. docs/PROJECT_CHAT_DECISIONS.md
7. docs/CODEX_REVIEW_QUEUE.md and docs/CODEX_HANDOFF.md
8. docs/adr/0001-single-editor-foundation.md
9. docs/evidence/browser-edited-export-2026-11-15.md
10. docs/VIDEO_EDITOR_STUDY_REPOSITORIES.txt
11. docs/FOUNDATION_EVALUATION.md and docs/REUSE_AND_LICENSES.md

Read the latest GitHub Issues/PRs/workflows/build results, and inspect current source. The 2026-11-15 browser edited-export test and PRs #13/#14 already exist: **do not recreate them**.

## MANDATORY THREE-REFERENCE REVIEW, ONE ENGINE

Study:
- OpenReel https://github.com/Augani/openreel-video — imported current foundation.
- FreeCut https://github.com/walterlow/freecut — professional editing workflow and architecture comparison.
- OpenCut https://github.com/OpenCut-app/OpenCut — Rust/plugin/MCP/headless long-term architecture, while distinguishing actually implemented from its rewrite roadmap.
- OpenCut Classic https://github.com/OpenCut-app/opencut-classic — archived historical code, optional study only.

Read the original 22-item list fully, including special license flags and the one non-GitHub model entry. **Choose one canonical editor engine** (currently OpenReel). Use independent comparisons and small typed adapters, never merge 2–3 incompatible timeline/history/export runtimes. Migration requires real equal-hardware benchmark, ADR, tests and rollback plan.

## SOURCE AUDIT

Begin in:
- editor/apps/web/src/stores/project-store.ts, timeline-store.ts;
- editor/apps/web/src/components/editor/{AssetsPanel,Timeline,Toolbar,ExportDialog}.tsx;
- editor/apps/web/src/services/{project-manager,auto-save,media-storage,export-runner}.ts;
- editor/packages/core/src/{timeline,media,playback,audio,export,storage}/;
- editor/packages/agent, editor/apps/desktop, editor/apps/studio/e2e-web;
- scripts/, tests/, .github/workflows/.

Map actual import -> add clip -> edit -> preview -> save/reopen -> export -> FFmpeg verification call paths. Check immutability, history/undo, GPU/CPU fallback, media lifecycle, agent permissions, temporary buffers, codec fallbacks, native integration and licensing.

## FIRST IMPLEMENTATION PRIORITIES

1. **Issue #7 (P0):** strengthen frame-level and audio quality analysis. Build negative tests that fail for exactly one-frame shifted cuts, missing/hidden titles, silent output, and deliberate PCM audio timing offsets. Add at least one preview-to-export comparison. Use existing Python FFmpeg checker and existing Playwright infrastructure. Avoid full 4K CI fixtures.
2. **Issue #6 (P0):** extend existing green browser E2E with **actual mouse/keyboard split/trim gestures**, undo/redo and project reopen from a fresh session. Verify real MP4 output and media ref integrity.
3. **Issue #8 (P1):** compare OpenReel, FreeCut and OpenCut on actual current commits; evaluate OpenCut current work realistically; gather same-fixture benchmarks, dependency and native integration costs; update ADR (new ADR if replacing historical policy).
4. **Issue #9 (P1):** pinned dependency SBOM; OpenReel, FFmpeg binary, codecs, model weights, fonts, templates, media license clearance.
5. **Issue #10 (P1):** secure typed and reversible AI editing commands, mock provider for CI, opt-in external services, injection defenses.
6. **Issue #11 (P2):** native Windows packaging/runtime smoke, GPU/4K validation on target hardware and explicit installer/signing limitations.

When tasks are blocked, document precise blocker and ship next independent safe improvement.

## EXECUTION PLAN AND VALIDATION

Use pinned toolchain Node 22 and pnpm 11.7.0. From editor/ run:
~~~bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @openreel/studio exec playwright install --with-deps chromium
pnpm --filter @openreel/studio exec playwright test -c playwright.web.config.ts
~~~
From repo root:
~~~bash
python -m unittest discover -s tests -v
python scripts/media/generate_fixtures.py --output-dir test-output
python scripts/media/check_media.py test-output/sample-3s.mp4 --require-audio --decode
# After genuine editor export:
python scripts/media/check_edit_content.py exported.mp4 expected-edits.json --report output.json
~~~

Use deterministic media; compare independent expected frames/audio, not outputs derived from same generated export. Record OS/browser/FFmpeg versions and artifacts. Linux CI is not Windows testing.

## REUSE/COST/SECURITY RULES

- Before any feature: search existing code, tests and dependencies, test present implementation, then only add a compatible adapter or new code if needed.
- No paid AI APIs or proprietary model inference, no unlicensed downloads or redistribution, no unauthorized uploading user media.
- Do not clone all 22 repos; targeted source inspection/shallow checkouts preferred.
- Do not duplicate render/timeline engines, redesign UI without bug evidence or rewrite existing tests.
- No force pushes or destructive changes; reviewable PRs for changes of risk, direct safe commits only when allowed and validated.
- Build functional outcomes, not plan-only deliverables. Reserve execution budget for testing and code.

## MEASURABLE DEFINITION OF DONE

For each change provide (1) actual modified source paths; (2) editing behavior in UI; (3) project save/reopen/undo; (4) exported media decode, visual and audio correctness; (5) regression and negative tests; (6) command/CI results with actual environment; (7) commercial/agent-security risks; (8) PR/commit link; (9) known limitations. Do not claim completion without evidence.

## MANDATORY END-OF-SESSION HANDOFF

Update docs/PROJECT_MEMORY_INDEX.md, PROJECT_CHAT_DECISIONS.md, PROJECT_ARCHITECTURE_AND_EVIDENCE.md or relevant evidence file, docs/CODEX_REVIEW_QUEUE.md, and the task prompt/roadmap when decisions change. Explain WHAT changed, WHY, test outcomes, remaining blockers and next coding task. Treat the GitHub docs as the durable memory between chats. **Begin implementation after confirming latest main; do not stop at summarizing this prompt.**
