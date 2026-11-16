# ADR-0001 — One canonical OpenReel editor; FreeCut as independent comparison

- Status: **Provisional, pending real end-to-end media and equal-hardware benchmark**
- Date: 2026-11-15
- Decision scope: [Issue #8](../../issues/8), [Issue #6](../../issues/6), [Issue #7](../../issues/7)
- Upstream sources: [OpenReel](https://github.com/Augani/openreel-video) at \`367d7e90b61b5181f9861b852bb8b9d7a7d2954a\`; [FreeCut](https://github.com/walterlow/freecut) at \`5ceeeb388eef5423640b7db157706274bf1b8165\`.

## Exactly two primary editor references

1. **OpenReel — keep as canonical implementation** in \`editor/\` for now. Existing web, desktop, core, agent and shared UI packages; reusing them avoids a high-risk migration. Root MIT license exists; transitive licenses and shipped assets/weights are NOT cleared.
2. **FreeCut — independent comparison/reference**, NOT a second installed editor engine. Its documented source-monitor, rolling/slip/slide operations, project workspace persistence, proxy workflow and export verification deserve targeted study. FreeCut's source license is MIT, but all dependencies, assets, checkpoints, GPU behavior and commercial redistribution still require auditing.

Do not copy FreeCut's \`src/runtime/\` composition/clock, project/workspace schema, Zustand editor command history or WebCodecs encoder into OpenReel. Those boundaries implement different authoritative models. Integrate a proven capability only through a narrow, typed adapter **after** demonstrating a missing feature with tests. Complexity: low for pure algorithms or UI patterns, medium for focused media adapters, high for project/timeline/render internals (reject wholesale merger).

## Observed OpenReel source architecture

\`\`\`mermaid
flowchart LR
    UI["apps/web: AssetsPanel, Timeline, Toolbar, ExportDialog"]
    STORE["apps/web: project-store, timeline-store"]
    CORE["packages/core: clip-manager, media, storage"]
    PLAY["packages/core: playback / audio"]
    EXP["packages/core: export-engine / codecs"]
    SAVE["apps/web: auto-save, project-manager"]
    GPU["WebCodecs / Mediabunny / FFmpeg fallback"]
    UI --> STORE
    STORE --> CORE
    STORE --> PLAY
    STORE --> EXP
    STORE --> SAVE
    EXP --> GPU
\`\`\`

Observed import path: \`AssetsPanel.tsx\` file input → \`project-store.ts#importMedia\` → \`bridges/media-bridge.ts\` / \`core/src/media/media-import-service.ts\` → media library + media storage. User places clips via \`AssetsPanel#addClipToNewTrack\`; timeline editing uses project-store commands and \`core/src/timeline/clip-manager.ts\`. \`Toolbar.tsx\` → \`services/export-runner.ts\` → \`core/src/export/export-engine.ts\`. \`services/project-manager.ts\` handles explicit project file save/open; \`services/auto-save.ts\` uses IndexedDB. Title clips are stored as project text clips and synchronized with the title engine in project-store; exported titles require independent frame verification. Asset references can require relinking after reopening; metadata-only project JSON is not proof of source-media durability.

The imported source provides extensive unit tests, but current linked passing CI is **not** proof of all those paths working together. \`editor/apps/studio/e2e-web/main-editor-startup.spec.ts\` verifies startup/empty export only. Existing root \`scripts/check_media.py\` validates format, streams and decodability, not composition. The content verifier added in this branch tests **actual pixels and PCM amplitude** using independently defined expectations.

## Research inventory dispositions (22 references)

- **Primary editors:** OpenReel (retain), FreeCut (compare), CapRocket/OpenCut/react-video-editor (source-pattern study only; avoid additional app roots; inspect individual licenses).
- **Media/FX:** Mediabunny (already referenced in editor dependencies), FFmpeg (native/wasm; binary configuration required), MLT (native backend candidate only), gl-transitions (license per shader), wavesurfer.js (audio waveform UI if absent).
- **AI/media analysis:** whisper.cpp, silero-vad, PySceneDetect, SAM2, rembg, RNNoise, Kokoro-82M (later isolated optional modules; checkpoint licenses, compute limits and no paid inference).
- **Pro/UI:** OpenTimelineIO (interchange), OpenColorIO (color management), SubtitleEdit (subtitle QA reference), shadcn/ui (selective design patterns), Remotion (special licensing review before editor-product use).
- The complete catalog and URLs are in \`docs/VIDEO_EDITOR_STUDY_REPOSITORIES.txt\`. Inclusion here **does not mean its runtime or license was verified**.

## Required evidence before finalizing foundation

On the **same** Chromium version, OS, files and machine, for both candidates record the Issue #8 rubric: identical import/seek/split/trim/title/audio/save/reopen/export sequences; frame comparisons at cut edges and title visibility; PCM windows; render time, RAM, crash rate; and transitive license review. Windows GPU/4K are NOT TESTED by Linux CI. Do not score missing measurements as successes. Keep OpenReel while that comparison remains unperformed.

## Consequences

- Lower integration and migration risk; some capabilities may take longer to add.
- One model/timeline/export contract; no dual engine state drift.
- Block declaring production readiness until Issue #6 edited MP4 and Issue #7 content checks pass against an **actual editor export**.
