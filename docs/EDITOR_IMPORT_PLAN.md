# Import and verification strategy

The source import workflow clones **both** primary candidates at pinned commits into temporary
GitHub Actions directories, but commits only the provisional OpenReel foundation under `editor/`.
The project does not and should not redistribute every source repository as its own tree.

## Why not upload all nine projects?
- Different editors have incompatible state and rendering engines.
- FFmpeg, MLT and other media libraries are best evaluated/linked through their supported distributions.
- Multiple copies increase maintenance, licensing and build risk without adding usable features.
- Model weights and assets can have licenses independent of code.

## First run after editor import
```bash
cd editor
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Open a compatible Chromium browser to the URL printed by the development server.
Do a manual import/trim/add-text/save/reopen/export workflow with real media. The
automated GitHub smoke test proves only that synthetic MP4 is valid; it is **not**
an end-to-end editor export test.

## Next engineering review
- Examine OpenReel's full dependency license graph and compare FreeCut on the same media.
- Document export fidelity, timing, A/V sync, memory and GPU differences.
- Keep or replace the foundation based on actual evidence, rather than branding.
- Add an actual browser E2E media export regression test before claiming editor readiness.

## Supporting libraries to assess, not bulk-clone into production
- https://github.com/medhachim/CapRocket
- https://github.com/Vanilagy/mediabunny
- https://github.com/FFmpeg/FFmpeg
- https://github.com/ggml-org/whisper.cpp
- https://github.com/mltframework/mlt
- https://github.com/OpenCut-app/OpenCut
