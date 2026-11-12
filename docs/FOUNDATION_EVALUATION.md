# Foundation comparison and evaluation gates

**State: documentation-only review; NO benchmark tests run yet.** The two projects below were read from their public README files on 2026-11-13. Features in an upstream README do not prove they work on our target systems.

| Candidate | Documented approach | Areas to test | Known suitability considerations | Result |
| --- | --- | --- | --- | --- |
| [OpenReel](https://github.com/Augani/openreel-video) | React/TypeScript monorepo with browser, alpha desktop app and AI agent packages | browser+desktop export, project persistence, timeline accuracy, assistant safety, performance | Ready architectural split for web + desktop; desktop is described as alpha | **UNTESTED** |
| [FreeCut](https://github.com/walterlow/freecut) | Browser-focused React/TypeScript editor using WebGPU, WebCodecs and local workspace | GPU/browser requirements, export fidelity, advanced editing tools, potential desktop packaging | Rich documented timeline features; needs compatible Chromium/WebGPU/File System Access environment | **UNTESTED** |

## Decision procedure: do not select on star counts

Use a version-pinned evaluation record and identical media fixtures for each candidate.

| Dimension | Weight | Minimum evidence |
| --- | ---: | --- |
| Correct export & preview parity | 30% | Two successful saved/reopened/exported edit cases checked visually and with ffprobe |
| Core timeline & editing quality | 20% | multitrack trim, split, crossfade, audio sync, undo, timecode |
| Extensibility & maintainability | 15% | review project schema, commands, tests, module boundaries, dependency hygiene |
| Performance & stability | 15% | preview scrub, memory, 1080p and 4K where available, no critical crashes |
| Browser + Windows feasibility | 10% | browser run plus credible native integration/testing path |
| Licensing & security | 10% | reviewed app/license, FFmpeg build, AI weights, dependencies and untrusted media handling |

Score each dimension 0–5, cite measured evidence and compute the weighted score out of 100. An unresolved blocking license problem or inability to export a simple MP4 disqualifies a candidate regardless of the total.

## Required shared benchmarks

1. 3-second 640x360 source video with synthetic audio (generate with scripts/generate_fixtures.py).
2. Trim to 2 seconds; add visible title; export H.264/AAC MP4 where supported.
3. Two tracks: overlay image + voice/audio; confirm A/V synchronization.
4. Save project, close application, reopen, and export same output.
5. Verify scrub near cuts, speed changes, transitions and undo/redo against reference preview.
6. 1080p 30fps 30-second edit and a 4K source if suitable hardware exists.
7. Check out-of-memory, crash recovery, project schema evolution and browser storage limitations.
8. Record final output file metadata using scripts/check_media.py, AND inspect rendered frames/audio for correctness.
9. Distinguish Linux cloud results from Windows-native/GPU tests.

## Recording results

For each candidate, create docs/evidence/<candidate>-evaluation.md with upstream SHA, license/review date, machine/browser, commands, screenshots or artifacts, output metadata, pass/fail evidence, and a prioritized defects list. Update THIS document with results and a signed-off Architecture Decision Record before importing a base.

Never merge two incompatible timeline or compositor engines to chase feature counts.
