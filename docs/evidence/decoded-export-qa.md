# Decoded export fidelity QA — regression tests and integration guide

Date: 2026-11-15. Related: [Issue #7](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/7) and [Issue #6](https://github.com/anneshabiswaas22-collab/advance-video-edior/issues/6).

## What was implemented

- \`scripts/check_edit_content.py\`: decode selected video frames to RGB24 with FFmpeg and compute ROI pixel mean-absolute error against expected RGB or **independent** golden images. Decode specified audio windows to mono PCM, measuring RMS in dBFS to assert sound or silence at exact times. JSON results can be saved for CI artifacts.
- \`tests/test_check_edit_content.py\`: creates deterministic 160x90 test media with a visible white overlay, red→blue cut, and delayed audio tone. Regression tests verify the good clip passes while missing overlay, wrong cut order, missing audio and wrong audio timing fail.
- \`.github/workflows/media-smoke.yml\`: runs Python regression suite **after** FFmpeg installation.

## Reproduce

Prerequisite: Python 3.10+ and FFmpeg/ffprobe on PATH.

\`\`\`bash
python -m unittest discover -s tests -v
python scripts/check_media.py exported.mp4 --require-audio --decode
python scripts/check_edit_content.py exported.mp4 expected-edits.json --report test-output/content-qa.json
\`\`\`

The expectations JSON must be authored from the planned edit, not derived from the export being checked. Example:

\`\`\`json
{
  "frames": [
    {"time": 0.1, "region": [0.05, 0.05, 0.15, 0.2], "expected_rgb": [253, 0, 0], "max_mae": 15},
    {"time": 1.3, "region": [0.05, 0.05, 0.15, 0.2], "expected_rgb": [0, 0, 254], "max_mae": 15},
    {"time": 0.4, "region": [0.25, 0.1, 0.5, 0.3], "reference": "golden-title.png", "max_mae": 12}
  ],
  "audio_windows": [
    {"start": 0.3, "end": 0.48, "min_rms_dbfs": -35},
    {"start": 1.0, "end": 1.2, "max_rms_dbfs": -40}
  ]
}
\`\`\`

Normalized regions are \`[x, y, width, height]\`, with dimensions in \`[0,1]\`. Reference paths are relative to the spec's directory. The golden image should be obtained from **a separately trusted renderer/specification**, not from the file under test. Tight tolerances can over-reject legitimate GPU/codec color differences; calibrate per output codec, resolution and browser. For one-frame edit boundary assertions, sample frame centers at the actual output FPS (for 30 fps: \`(frame_index + 0.5)/30\`) on both sides of the cut.

## Verification completed outside GitHub CI

In a local Linux environment with FFmpeg and Python, all **7 new unittest cases passed** in about 4.1 seconds. The generated good video passed five content assertions (two sequence colors, one overlay comparison, two audio windows); four intentionally wrong videos/expectations were correctly rejected. This is **not** evidence that the real OpenReel browser exporter passes. It only establishes the checker/fixture contract.

## Remaining gates

1. Exercise the main browser editor (not just Studio) in Chromium with an actual media fixture, split/trim and text/audio controls.
2. Persist and reopen the same project, verify media sources can still be resolved.
3. Capture the resulting MP4 as a Playwright download artifact.
4. Apply \`check_media.py --decode\` **and** this content verifier to the actual MP4 with known correct cut/title/audio expectations.
5. Record decoded frames, audio measurements and Chromium/OS details; do not assert Windows/GPU compatibility without running there.

This verifier detects pixel errors at sampled times and RMS-window failures; it does **not** prove all frames, subtitle semantics, frequency accuracy or sub-frame A/V phase alignment.
