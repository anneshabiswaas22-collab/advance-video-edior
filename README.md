# Advanced Video Editor

An early-stage project to build an original, high-quality, AI-assisted video editor for web and Windows, inspired by the usability of CapCut and the professional workflows of DaVinci Resolve and Premiere.

> **Project state (2026-11-13): Bootstrap only.** This repository does **not** yet contain a working video editor. No third-party editor source has been imported, and no video export has been verified.

## Engineering approach

**Reuse before rebuild.** Evaluate [OpenReel](https://github.com/Augani/openreel-video) and [FreeCut](https://github.com/walterlow/freecut) with identical test media. Adopt exactly one primary editor codebase, keeping one authoritative timeline, project format and preview/export contract. Other repositories are possible libraries or implementation references, **not** codebases to merge wholesale.

Start with [AGENTS.md](AGENTS.md), [the foundation decision procedure](docs/FOUNDATION_EVALUATION.md), [reuse and licensing policy](docs/REUSE_AND_LICENSES.md), and [the Codex handoff](docs/CODEX_HANDOFF.md).

## Current executable contribution: repeatable media QA

We can test the validity and basic audio/video properties of files exported by whichever editor wins the evaluation. The QA tools require Python 3.10+; fixture generation and probing additionally require FFmpeg and ffprobe on PATH.

```bash
python -m unittest discover -s tests -v
python scripts/generate_fixtures.py --output-dir test-output
python scripts/check_media.py test-output/sample-3s.mp4 --require-audio --min-width 640 --min-height 360 --min-seconds 2.8 --max-seconds 3.2
```

Test clips are generated locally and not committed. The inspection script checks metadata and rough timing, **not** frame-level visual fidelity. See the evaluation document for the necessary manual and automated export tests.

## Milestones

1. Inspect and benchmark OpenReel and FreeCut (not yet done).
2. Select and import a foundation while retaining license notices and upstream history/attribution where appropriate.
3. Verify one edit-save-reopen-export workflow in browser and desktop environments.
4. Add proven creator, AI, audio and professional features incrementally.
5. Validate security, performance and redistribution obligations before release.

Contributions should happen in reviewable pull requests, with evidence of what was actually run. No proprietary editor code/assets or unlicensed media may be copied.
