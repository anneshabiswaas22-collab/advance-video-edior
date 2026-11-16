# Research & 22-Reference Inventory — Reuse Strategy

Updated context 2026-11-16. Research archive, NOT blanket dependency approval. Source links indicate research leads. Capability claims in upstream READMEs are **documented claims**, not independently proven export correctness, performance, stability or redistribution rights.

## Most important correction to previous prompts

The original build prompt and ADR-0001 required "exactly two" leading editors, OpenReel and FreeCut. Follow-up discussion requested that **OpenCut also receive independent serious architectural evaluation**. The reconciled policy is:
- One canonical editor engine / timeline / project schema: **provisionally OpenReel in editor/**.
- Up to two primary independent references: **FreeCut** and **current OpenCut rewrite**.
- OpenCut Classic is an **additional legacy study source**, not a fourth engine.
- This is a research policy extension, not approval to merge 3 engines or migration evidence. ADR-0001 is historical; complete Issue #8 benchmarks before a final foundation choice.

## Three-editor comparison and role

| Candidate | URL | What source/docs currently indicate | Recommended role | Evidence still required |
|---|---|---|---|---|
| **OpenReel** | https://github.com/Augani/openreel-video | Existing React/TS/Zustand editor workspace with web, Electron desktop, core, agent, WebCodecs/media backend; imported at SHA 367d7e90b61b5181f9861b852bb8b9d7a7d2954a | **Retain production foundation for now**; protects tested browser edited MP4 and migration budget | Full visual/audio parity, gesture tests, Windows runtime, GPU/4K, licenses |
| **FreeCut** | https://github.com/walterlow/freecut | README documents browser-first WebGPU/WebCodecs editing, source monitor, rolling/slip/slide, sequences/compound clips, proxy/relink, scoped audio EQ, local AI, workspace files; previous comparison SHA 5ceeeb388eef5423640b7db157706274bf1b8165 | **Editing/workflow comparison**, targeted algorithms or UI concepts only | Same-fixture real benchmark, dependency and browser compatibility, export timing |
| **OpenCut current** | https://github.com/OpenCut-app/OpenCut | Project README explicitly says active **ground-up rewrite**; roadmap includes Rust cross-platform core, Editor API, plugins, MCP server, headless scripting. Checked root has apps/web, apps/desktop, apps/api, crates/media. Many advertised capabilities are described as coming, not validated | **Long-term plugin/native/automation architecture reference**, independent evaluation | Which APIs/renderer are actually executable, maturity, platform build, export correctness, Rust integration cost |
| **OpenCut Classic** | https://github.com/OpenCut-app/opencut-classic | README says legacy code is archived and no longer maintained; previous web/desktop/Rust/WASM implementation | Historical subsystem patterns; not active foundation | Reuse license/maintenance assessment; prefer no direct copy unless justified |

**Why not make OpenCut the current engine?** Lack of confirmed replacement-level user-flow benchmark in this repo, rewrite in progress, high Rust/editor migration risk, already-working OpenReel foundation. This is a provisional engineering risk assessment, **not evidence that OpenCut is inferior or unusable**. Its MIT root LICENSE does not settle transitive or model/media rights.

## Original list: 22 study references (21 GitHub repositories + 1 Hugging Face model)

| # | URL | Research purpose / integration decision |
|---:|---|---|
| 01 | https://github.com/Augani/openreel-video | Imported primary editor foundation; improve in-place |
| 02 | https://github.com/walterlow/freecut | Independent feature/quality benchmark; never wholesale-merge its timeline |
| 03 | https://github.com/medhachim/CapRocket | Windows desktop integrations, effects, offline captions; review FFmpeg/GPL and root licensing |
| 04 | https://github.com/OpenCut-app/OpenCut | Current rewrite; inspect plugin-first, Rust, MCP, headless goals vs code |
| 05 | https://github.com/openvideodev/react-video-editor | React editor UI; **license review required** before any commercial reuse |
| 06 | https://github.com/Vanilagy/mediabunny | Browser encoding/decoding/mux; existing OpenReel dependency first |
| 07 | https://github.com/FFmpeg/FFmpeg | Native/wasm media processing; check compiled binary configuration LGPL/GPL/codecs |
| 08 | https://github.com/mltframework/mlt | Professional media processing; separate backend consideration, not timeline merge |
| 09 | https://github.com/gl-transitions/gl-transitions | GPU transition shaders; review each shader author's license |
| 10 | https://github.com/katspaugh/wavesurfer.js | Audio waveform UI, only if current capabilities inadequate |
| 11 | https://github.com/ggml-org/whisper.cpp | Offline ASR/transcription, with model checkpoint audit |
| 12 | https://github.com/snakers4/silero-vad | VAD and speech region selection, checkpoint rights to confirm |
| 13 | https://github.com/Breakthrough/PySceneDetect | Scene cut analysis and timeline suggestions, adapter only |
| 14 | https://github.com/facebookresearch/sam2 | GPU video object segmentation/tracking, model redistribution and compute assessment |
| 15 | https://github.com/danielgatis/rembg | Image background removal; separate model license check |
| 16 | https://github.com/xiph/rnnoise | Speech denoising/audio enhancement, native integration possible |
| 17 | https://huggingface.co/hexgrad/Kokoro-82M | TTS MODEL reference, **not a GitHub repo**; review weights, voices, terms |
| 18 | https://github.com/AcademySoftwareFoundation/OpenTimelineIO | Editorial interchange; no rendering engine |
| 19 | https://github.com/AcademySoftwareFoundation/OpenColorIO | Professional color management; not a full grading/editor UI |
| 20 | https://github.com/SubtitleEdit/subtitleedit | Subtitle workflows, formats, sync and QA; inspect dependencies/license |
| 21 | https://github.com/shadcn-ui/ui | Selective React UI components; avoid wholesale design changes |
| 22 | https://github.com/remotion-dev/remotion | Motion/video programmatic renderer, **special commercial editor-product license review** |

Additional historical repository **outside original 22**: https://github.com/OpenCut-app/opencut-classic (archived). Do not mislabel 23 links as 22 GitHub repos.

## Compatibility and integration guide

**Good low-risk candidate:** isolated pure algorithm, waveform component, subtitle parser, frame comparison, image/audio processing behind a typed interface; tests demonstrate no breaking timing semantics.

**Medium-risk:** FFmpeg native adapter, isolated transcoding/proxy process, color transform layer, on-device transcription with worker isolation; requires performance, security and licensing review.

**High-risk / NOT TO MERGE:** FreeCut's custom playback Clock, timeline/composition runtime, history/state, project/workspace file layout, codecs and canvas renderer; OpenCut's future Rust core and editor schema; entire alternative web apps; competing video renderer and project persistence. Migration requires an ADR with measurable import/edit/export proof and rollback plan.

## Feature gap audit template for Codex

| Capability | Current source path / test | Existing? | Works? | External reference | Proposed minimal adapter/fix | Risks | Acceptance evidence |
|---|---|---|---|---|---|---|---|
| Mouse trim/split | editor/apps/web/src/components/editor/Timeline.tsx; e2e-web | Implemented in UI | Not comprehensively E2E-verified | FreeCut advanced edit tools | Add Playwright gestures first | Timing regression | Cut boundary frames and undo |
| Project/missing media | project-store.ts; auto-save.ts; media-storage.ts | Yes | One recovery test passes | FreeCut workspace persistence | Test app restart/handles | Browser privacy/permissions | Reopen same project with media |
| GPU color scopes | core effects and UI to inspect | Needs audit | NOT VERIFIED | FreeCut, OpenColorIO | Only after source and perf audit | GPU fallback, color accuracy | Matched test patterns |
| Plugin/MCP automation | packages/agent and desktop to inspect | Partial code | Security not verified | OpenCut rewrite goals | Typed agent commands+permissions | prompt injection, uploads | Denial/adversarial tests |
| Windows release | editor/apps/desktop | Source present | Not validated on Windows | OpenReel, CapRocket, OpenCut | Windows CI packaging/runtime smoke | native binary licenses | Native import/edit/export artifacts |

Before choosing integration, inspect source + tests in our repo; compare licensing and memory/runtime, and do not inflate upstream marketing into verified capabilities.

## Research sources and limitations

Primary evidence source: upstream README and LICENSE where inspected, project's original docs/VIDEO_EDITOR_STUDY_REPOSITORIES.txt, docs/evidence/supporting-source-inventory.md, ADR-0001, GitHub CI. Independent equal-hardware comparisons for OpenCut and FreeCut are **not yet recorded**. Avoid unsupported numerical performance/maintenance claims.
