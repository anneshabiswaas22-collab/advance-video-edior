# Master Project Context — Advanced Video Editor

**Consolidated:** 2026-11-16 | **Repository:** https://github.com/anneshabiswaas22-collab/advance-video-edior
**Status:** Ongoing commercial software development, NOT a mock UI/prototype and NOT yet commercially production-ready.
**Source of truth:** Latest main branch + CI + Issues + ADRs. This document summarizes current available project conversation and inspected repository; dates/links below are snapshots.

## 1. Founder's mission and outcome

Create an original, independently branded, extensible, high-quality video editing platform for:
- YouTubers and everyday creators who value simplicity and quick edits;
- professional editors and filmmakers needing precision, color, sound, masking, compositing and production workflow;
- content teams needing automation, social delivery, reusable templates and Windows support.

**Product benchmarks, not source to copy:** CapCut (ease of use, templates, effects, AI), Adobe Premiere Pro (precision/nonlinear editing and professional workflows), DaVinci Resolve (color/audio/compositing and post-production). Do not claim equivalent feature completeness or copy proprietary code, designs or assets.

**Primary targets:** Web browser and native Windows desktop. Future systems/platforms can be considered if they do not derail the main goal. Cross-platform architecture is a design consideration, not verified deployment support.

**Development values:** working code > glossy demos, validated exports > containers/screenshots, one coherent editor > wholesale combinations, reuse-first > unnecessary new implementations, trustworthy attribution/license compliance > unlicensed downloads, free/local when possible > recurring inference bills.

## 2. Operating constraints and instructions

- Use the strongest available reasoning for real architecture and code. User permits deep investigation (up to ~2 hours if an execution environment supports it), but do not artificially spend that time; reserve substantial effort for implementation.
- Minimize credit and cost. No paid AI APIs, premium inference, external uploads of original footage, paid media generation or unlicensed checkpoints/assets without explicit approval.
- Prefer locally run/open-source utilities, mock AI providers in CI, deterministic short media fixtures, existing Vitest and Playwright setup, FFmpeg/ffprobe validation, and caching in CI.
- Inspect latest main and all relevant docs before implementation. Read AGENTS.md, docs/CODEX_REVIEW_QUEUE.md, docs/CODEX_HANDOFF.md, related ADRs/evidence, and the 22-reference inventory.
- Current OpenReel import is provisional but real. Keep its project schema, timeline authority, editing commands and export pipeline unless objective tests justify a full migration.
- Do not merge incompatible timeline models, render pipelines, project storage schemes, history engines, or full alternative editor repositories.
- Reuse existing code and dependencies first; add small typed adapters second; write fresh code only after demonstrating a gap.
- Small focused tested changes; follow repository permissions; don't force-push or overwrite unrelated work. Earlier project AGENTS explicitly allowed non-destructive direct main commits, but reviewable PRs are appropriate for high-risk changes.
- No fake implementations presented as working, no unsubstantiated Windows/4K/GPU claims, no blanket license clearance.

## 3. Repository as inspected

Main repository: https://github.com/anneshabiswaas22-collab/advance-video-edior

OpenReel imported as the editor workspace under editor/ from upstream SHA:
367d7e90b61b5181f9861b852bb8b9d7a7d2954a

Independently studied FreeCut pinned comparison SHA:
5ceeeb388eef5423640b7db157706274bf1b8165

Key observed source locations:

| Location | Role |
|---|---|
| editor/apps/web/src/App.tsx | App routing, new project lifecycle |
| editor/apps/web/src/components/editor/AssetsPanel.tsx | Import media, asset placement, text/title presets |
| editor/apps/web/src/components/editor/Timeline.tsx | Timeline UI/tools |
| editor/apps/web/src/components/editor/Toolbar.tsx | Export entry, project name and dialogs |
| editor/apps/web/src/components/editor/ExportDialog.tsx | Settings and export selections |
| editor/apps/web/src/stores/project-store.ts | Project state and editing commands |
| editor/apps/web/src/stores/timeline-store.ts | UI timeline/playhead state |
| editor/apps/web/src/bridges/media-bridge.ts | Bridge to media import |
| editor/apps/web/src/services/auto-save.ts | Browser IndexedDB autosave/recovery |
| editor/apps/web/src/services/project-manager.ts | Project .oreel save/open |
| editor/apps/web/src/services/media-storage.ts | Media blob persistence/retrieval |
| editor/apps/web/src/services/export-runner.ts | UI-to-export-engine, download/file writes |
| editor/packages/core/src/timeline/clip-manager.ts | Timeline clip operations |
| editor/packages/core/src/media/media-import-service.ts | Media import and metadata |
| editor/packages/core/src/playback/ | Master clock and preview playback |
| editor/packages/core/src/audio/ | Audio engine, effects/routing |
| editor/packages/core/src/export/export-engine.ts | Video export engine |
| editor/packages/core/src/storage/project-serializer.ts | Project serialization |
| editor/packages/agent/src/ | Optional agent and command integration |
| editor/packages/ui/src/ | Shared UI |
| editor/apps/desktop/ | Electron/native desktop integration; not Windows-certified |
| editor/apps/studio/ | Studio app and existing Playwright test infrastructure |
| scripts/generate_fixtures.py | Deterministic synthetic media creation |
| scripts/check_media.py | Streams/codecs/duration/full decode QA |
| scripts/check_edit_content.py | Decoded-frame region and audio RMS QA |
| .github/workflows/ | CI, import and media smoke workflows |

The repo already has substantial code and tests; do not infer missing functionality solely from an untested feature list. Look up real methods and call paths.

## 4. Proven milestone and strict limits

**Verified by recorded GitHub Actions November 15, 2026:**
- PR #13: independently sampled decoded pixels and PCM audio, quantitative regression tests; merged.
- PR #14: Playwright Chromium editor E2E imports actual 640x360 24fps synthetic AV, places video/audio via UI, uses real mounted store split/trim commands, adds title, persists with IndexedDB, reloads and recovers media, exports a real MP4 using the actual Toolbar, fully decodes and checks selected cut colors, title-region visual difference and audio presence.
- The test was fixed for a genuine initial onboarding spotlight blocking a thumbnail; this is part of real browser UI coverage.
- Browser run: https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193
- Build: https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090195
- Media QA: https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090202
- Studio smoke: https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090219
- Evidence file: docs/evidence/browser-edited-export-2026-11-15.md

**NOT VERIFIED:** real pointer/keyboard split/trim for the entire flow; single-frame cut-edge sensitivity on all frame rates; sample-accurate audio sync, speech fidelity or loudness; representative preview/export pixel parity; large project memory/recovery; native Windows app launch/import/export; GPU hardware paths; 4K speed/stability; full commercial dependency audit; secure AI agent contract; complete creator/pro tool parity.

The earlier import CI report recorded 3,416 passing and 34 skipped tests across workspaces; this is a historical CI count and not a current fresh run. Never present it as universal application correctness.

## 5. Canonical architecture principles

- **One project format:** IDs, media library, track and clip ownership, title/caption timeline, serialization.
- **One editing command contract:** state validation, undo/redo, timeline notifications, project scoping; no AI direct mutation of filesystem or uncontrolled network calls.
- **One export truth:** preview and rendered export must use validated shared timing/composition semantics. Different acceleration backends may exist behind an adapter, but must produce consistent tested content.
- **Stable source media linkage:** source handles, blobs, source-file metadata, relinking, save/reopen and package import/export must be tested across sessions.
- **Local-first privacy:** user files should not upload unless requested with informed opt-in.
- **Windows constraints:** enforce safe native filesystem boundaries; document FFmpeg binary origin/config and installers/signing.
- **Performance:** use WebCodecs/MediaBunny/native FFmpeg capabilities already present, test proxy and worker paths, memory/buffer lifecycle, handling of unsupported codecs and GPU fallback.
- **Licensing:** code MIT at upstream root is not blanket clearance; audit dependencies, codec binaries, model weights, templates, fonts, music, stock media and assets separately.
- **Reproducibility:** pinned Node/pnpm toolchain; deterministic media; same fixtures/hardware for comparative benchmarking.

## 6. Functional requirements to develop in stages

| Stage | Intended capabilities | Current acceptance state |
|---|---|---|
| A: Reliable editing | Multitrack trim/split, ripple/rolling/slip/slide, snapping, transitions, keyframes, captions, undo/redo, autosave, real MP4 export | Basic browser E2E passes; broad gesture and export parity incomplete |
| B: Creator workflows | Templates, animated text, background removal, speed curves, stabilization, audio cleanup, proxy management, social presets, accessible UI | Individual modules may exist; feature-by-feature functional audit required |
| C: Local AI | Offline transcription, captions, silence/scene detection, clip suggestions, project-scoped typed AI commands, reversible operations | Capability and security audits needed; no paid API by default |
| D: Professional | Color pipelines, LUTs/scopes, multicamera, masks/tracking, advanced compositing, grading, audio bus/mixer, interchange | Existing partial code possible; no market-parity claim |
| E: Windows | Electron/native media, unsigned CI package, Windows runtime smoke, crash recovery, GPU fallback, real GPU/4K benchmarks, signed release path | NOT VERIFIED for release |

**Prioritize correctness before extra UI themes, speculative AI features or code volume.**

## 7. Definition of done for each feature

- Reachable by user through actual application UI or explicitly permitted agent command.
- Operates on real media, not mocked success.
- Correct in timeline and preview, survives save/reload when applicable, undoable when appropriate.
- Export contains the actual requested modification.
- Regression tests include failure cases; browser tests for user flows.
- FFmpeg fully decodes output; frames/audio are independently checked, not only container headers.
- No secret/key leakage; dependency and media rights reviewed.
- Reproducible commands, actual test status, CI artifacts, commit/PR, known limitations documented.
- Windows and hardware test claims limited to tests actually executed.

## 8. Cost, credit and developer collaboration

Owner expects Codex/GPT to do substantive engineering with minimal cost. Avoid bulk cloning 22 repos, redundant installs, repeated large test runs unchanged, full rewrites, paid inference, premium cloud endpoints, unlicensed images/music/checkpoints. GitHub documents must allow another developer or Codex session to resume without conversation history; maintain a changelog-like evidence trail.

## 9. Live links

- Project: https://github.com/anneshabiswaas22-collab/advance-video-edior
- Issues: https://github.com/anneshabiswaas22-collab/advance-video-edior/issues
- PRs: https://github.com/anneshabiswaas22-collab/advance-video-edior/pulls
- Actions: https://github.com/anneshabiswaas22-collab/advance-video-edior/actions
- Original research file: docs/VIDEO_EDITOR_STUDY_REPOSITORIES.txt
- Roadmap/evidence/architecture: linked from PROJECT_MEMORY_INDEX.md

This project is separate from the owner's AI video-generation studio, animated YouTube storytelling, AI interviewer, and other repositories. Do not mix those prompts, source code or model inventories into this editor's engineering context.
