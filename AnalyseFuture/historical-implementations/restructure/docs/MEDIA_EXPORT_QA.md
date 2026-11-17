# Media export quality gates

Use the bundled media validator in GitHub Actions and when checking real exports from
the selected video editor. It reports stream metadata and can try to decode the entire
video/audio payload, which catches failures that container metadata alone will miss.

## Example: expected H.264/AAC 1080p30 MP4

```bash
python scripts/check_media.py final-edit.mp4 \
  --require-audio --min-width 1920 --min-height 1080 \
  --video-codec h264 --audio-codec aac \
  --min-fps 29.9 --max-fps 30.1 \
  --min-seconds 28 --max-seconds 32 --decode
```

The validator exits nonzero on failure and emits a JSON result with errors, codecs,
frame-rate metadata, duration, and whether a full FFmpeg decode was attempted.

## Generated regression fixture

```bash
python scripts/generate_fixtures.py --output-dir test-output
python scripts/check_media.py test-output/sample-3s.mp4 \
  --require-audio --video-codec h264 --audio-codec aac \
  --min-fps 29.9 --max-fps 30.1 --min-seconds 2.8 --max-seconds 3.2 --decode
```

**What this proves:** expected streams/codecs/resolution/frame-rate/duration and
decodability by local FFmpeg.

**What this does NOT prove:** frames match the editor preview, effects are applied
correctly, subtitles are timed correctly, that audio is properly synchronized, or
that performance is acceptable. Codex must build separate browser E2E and frame/audio
reference checks for those requirements.

Optional --decode may be expensive for large files; use it on representative
short export fixtures as the fast gating test before exhaustive benchmarks.
