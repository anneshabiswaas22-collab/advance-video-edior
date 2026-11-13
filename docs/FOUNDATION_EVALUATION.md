# Video editor foundation evaluation

**Status (2026-11-13): OpenReel source has been provisionally imported, not fully benchmarked.**
GitHub Actions cloned OpenReel at `367d7e90b61b5181f9861b852bb8b9d7a7d2954a` and FreeCut at `5ceeeb388eef5423640b7db157706274bf1b8165`. Only OpenReel source is copied under `editor/`. This does NOT demonstrate either editor passes rendering/export or user workflow tests.

| Candidate | Source state | Documented scope | Real editor export benchmark |
| --- | --- | --- | --- |
| [OpenReel](https://github.com/Augani/openreel-video) | **Imported provisionally** at pinned SHA; upstream MIT license retained | Web + alpha desktop + editor agent modules | **NOT YET VERIFIED** |
| [FreeCut](https://github.com/walterlow/freecut) | Cloned separately and inspected for import suitability; not merged | Browser WebGPU/WebCodecs editor with detailed editing UI and local models | **NOT YET VERIFIED** |

## Scoring rubric

| Dimension | Weight | Required evidence |
| --- | ---: | --- |
| Preview/export fidelity | 30% | saved/reopened exported scenes checked by ffprobe, visible frames and audio |
| Core editing quality | 20% | trim/split, multitrack audio, captions, keyframes, undo/redo |
| Extensibility | 15% | command/state contracts, testability, cross-package coupling and maintenance |
| Performance/stability | 15% | memory, startup/scrub and GPU render behavior under identical clips |
| Windows + browser feasibility | 10% | verified browser, credible Windows-native build/test plan |
| License/security | 10% | source+transitive dependencies, FFmpeg build flags, models, keys, untrusted input |

Score 0–5 in each category, record supporting logs/samples and a calculated result out of 100. A license incompatibility or fundamentally broken export is disqualifying regardless of numerical score.

## Minimum real benchmark cases
1. Generate three-second 640×360 video and sine-wave audio via `scripts/generate_fixtures.py`.
2. Import, trim to two seconds, insert title, mix audio and export a playable MP4.
3. Save, close, reopen and re-export; inspect reproducibility.
4. Verify timecode alignment at cut boundaries, audio sync, captions, mask/transition preview-versus-export.
5. Evaluate representative 1080p 30fps editing and 4K on appropriate hardware.
6. Record actual memory, CPU/GPU and export duration; report hardware, browser and build revision.
7. Document crashes, availability of autosave and recovery.
8. Never claim correctness based on UI screenshots or metadata-only ffprobe checks.

## Decision record
Store evidence under `docs/evidence/`. If independent benchmarks strongly favor FreeCut, propose a migration and preserve current working code until replacement passes tests. Never merge two incompatible editor/timeline render engines.
