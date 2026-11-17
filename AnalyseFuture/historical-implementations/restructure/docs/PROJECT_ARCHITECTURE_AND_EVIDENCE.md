# Architecture, Verification & Links

Context 2026-11-16. Paths observed in imported source and ADR-0001, not a substitute for inspecting current code. This diagram is GitHub Mermaid-renderable.

## Canonical production architecture (provisional)

~~~mermaid
flowchart TD
  A["Browser UI: apps/web / AssetsPanel + Timeline + Toolbar"]
  B["Zustand state: project-store + timeline-store"]
  C["Core: clip-manager / editing commands / media library"]
  D["Media: media-bridge + import-service + persisted blobs"]
  E["Playback: master clock + preview + audio engine"]
  F["Persistence: project-serializer / project-manager / IndexedDB autosave"]
  G["Export: export-runner + export-engine"]
  H["Backends: WebCodecs / MediaBunny / FFmpeg fallback"]
  I["Actual downloaded MP4"]
  J["FFmpeg + ffprobe + check_edit_content.py"]
  A --> B
  B --> C
  B --> D
  B --> E
  B --> F
  B --> G
  D --> E
  D --> G
  C --> E
  C --> G
  G --> H
  H --> I
  I --> J
~~~

## Real call paths to inspect in code

**Import + timeline:** editor/apps/web/src/components/editor/AssetsPanel.tsx file input -> editor/apps/web/src/stores/project-store.ts importMedia -> editor/apps/web/src/bridges/media-bridge.ts -> editor/packages/core/src/media/media-import-service.ts + browser media storage -> addClipToNewTrack -> editor/packages/core/src/timeline/clip-manager.ts and timeline state.

**Preview:** project/timeline state -> editor/packages/core/src/playback/ + editor/packages/core/src/audio/ -> browser preview. Verify title and effect composition at actual timestamps.

**Persistence:** editor/apps/web/src/services/auto-save.ts (IndexedDB) + project-store recovery; editor/apps/web/src/services/project-manager.ts (.oreel explicit save/open); editor/packages/core/src/storage/project-serializer.ts and media blob/handle references.

**Export:** Toolbar.tsx / ExportDialog.tsx -> services/export-runner.ts -> core/src/export/export-engine.ts -> chosen media encoder/mux and downloadable MP4. Validate media from the UI output, not a synthetically generated fake "editor export".

## CI and regression evidence (historical validated links)

| PR / Run | Result | Exactly what was shown |
|---|---|---|
| https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/3 | MERGED | Playwright CI Ubuntu 24.04 alignment |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/4 | MERGED | Basic FFmpeg/media QA extensions |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/5 | MERGED | Export audio-presence plan handling |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/12 | MERGED | Browser real startup and empty-export guard |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/13 | MERGED | Independent pixel/audio content checker |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/pull/14 | MERGED | First actual browser edit/recover/MP4 export |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090193 | PASS | Ubuntu Chromium, 2 Playwright tests, 36.4s; edited MP4 retained as artifact |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090195 | PASS | Workspace install/typecheck/unit/build |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090202 | PASS | FFmpeg/Python media QA |
| https://github.com/anneshabiswaas22-collab/advance-video-edior/actions/runs/43742090219 | PASS | Studio browser smoke |

Detailed evidence: docs/evidence/browser-edited-export-2026-11-15.md. One earlier E2E attempt failed because onboarding spotlight blocked thumbnail click; fixed test chose the real "Skip tour" control. That is meaningful test coverage, not proof all first-run workflows are perfect.

## Test pyramid and acceptance chart

~~~mermaid
flowchart TD
  U["Unit: Vitest clip/audio/export/storage"]
  I["Integration: real store + media objects + project persistence"]
  B["Playwright: actual editor import/title/export, gestures"]
  Q["FFmpeg: stream/probe/full decode"]
  V["Visual: expected frame regions, title, one-frame boundaries"]
  S["Audio: timed PCM/RMS, deliberate silence/tone offsets"]
  P["Parity: browser preview vs rendered frames"]
  W["Windows: package, launch, edit, native media, GPU fallback"]
  U --> I --> B --> Q --> V --> S --> P --> W
~~~

**Current verified level:** some U/I, one B and Q + representative V/S. **Remaining:** exact 1-frame, exact sync, comprehensive preview parity, full gestures, Windows native runtime/GPU/4K.

## Proposed equal-hardware benchmark protocol (Issue #8)

1. Record exact commit SHA, dependency snapshot, browser version, OS/CPU/GPU/RAM, sandbox conditions.
2. Use identical deterministic 640x360 test media (red->blue cut, tone and independent WAV); then a realistic 1080p 30fps short fixture.
3. Execute import/scrub/split/trim/title/audio/save/reopen/MP4 export using each editor's supported workflow.
4. Collect measured import, seek, render latency, peak memory, crash/failure and file size.
5. Decode every export; assert expected cut pixels, title visibility, PCM tone windows and relative alignment.
6. Distinguish native Windows/GPU/4K from Chromium/Linux and unsupported cases; mark NOT TESTED.
7. Review code/asset/model/transitive licenses, maintainer recent activity, issue backlog and adapter surface.
8. Log measurements in docs/evidence and update ADR-0001 or create a successor ADR with explicit migration/rollback criteria.

## Known high-priority failure modes to detect

Off-by-one cut; title visible in UI but absent from MP4; wrong media source after recovery; silent/missing audio; wrong audio start/tail, failed waveform or channel mix; fallback encoder produces different composition; memory leaks during long export; unavailable browser codec; relink references lost on reopen; destructive agent/tool call; unlicensed model/FFmpeg redistribution.

## Reproducible commands

Run in repo root for Python/FFmpeg:

~~~bash
python -m unittest discover -s tests -v
python scripts/generate_fixtures.py --output-dir test-output
python scripts/check_media.py test-output/sample-3s.mp4 --require-audio --decode
# For actual editor output, supply independent expected-edits.json:
python scripts/check_edit_content.py exported.mp4 expected-edits.json --report qa-output.json
~~~

Then from editor workspace:

~~~bash
cd editor
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @openreel/studio exec playwright install --with-deps chromium
pnpm --filter @openreel/studio exec playwright test -c playwright.web.config.ts
~~~

Do not claim these commands were executed during this documentation-only consolidation. Above test outcomes were historical recorded GitHub CI evidence.
