#!/usr/bin/env python3
"""Check media metadata and optionally decode streams. Not a visual fidelity test."""
import argparse
import json
import math
import shutil
import subprocess
from fractions import Fraction
from pathlib import Path
from typing import Any


def inspect_media(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(path)
    if not shutil.which("ffprobe"):
        raise RuntimeError("ffprobe is required on PATH")
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams",
         "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def _fps(stream: dict[str, Any]) -> float | None:
    """Prefer the measured average frame rate; reject unavailable/invalid values."""
    for field in ("avg_frame_rate", "r_frame_rate"):
        raw = stream.get(field)
        if not raw:
            continue
        try:
            rate = float(Fraction(str(raw)))
        except (ValueError, ZeroDivisionError, OverflowError):
            continue
        if math.isfinite(rate) and rate > 0:
            return rate
    return None


def validate(data: dict[str, Any], *, require_audio: bool = False,
             min_width: int = 0, min_height: int = 0,
             min_seconds: float = 0, max_seconds: float | None = None,
             video_codec: str | None = None, audio_codec: str | None = None,
             min_fps: float | None = None, max_fps: float | None = None) -> list[str]:
    """Validate required streams and properties without mutating ffprobe data."""
    errors: list[str] = []
    streams = data.get("streams", [])
    videos = [s for s in streams if s.get("codec_type") == "video"]
    audios = [s for s in streams if s.get("codec_type") == "audio"]
    if not videos:
        errors.append("video stream missing")
    else:
        video = videos[0]
        try:
            width, height = int(video.get("width") or 0), int(video.get("height") or 0)
        except (TypeError, ValueError):
            width, height = 0, 0
        if width < min_width or height < min_height or width <= 0 or height <= 0:
            errors.append(f"resolution {width}x{height} invalid or below {min_width}x{min_height}")
        if video_codec and video.get("codec_name") != video_codec:
            errors.append(f"video codec {video.get('codec_name')!r} != {video_codec!r}")
        if min_fps is not None or max_fps is not None:
            fps = _fps(video)
            if fps is None:
                errors.append("video frame rate missing/invalid")
            elif (min_fps is not None and fps < min_fps) or (max_fps is not None and fps > max_fps):
                errors.append(f"video frame rate {fps:.3f} outside [{min_fps}, {max_fps}]")
    if (require_audio or audio_codec is not None) and not audios:
        errors.append("audio stream missing")
    elif audios and audio_codec and audios[0].get("codec_name") != audio_codec:
        errors.append(f"audio codec {audios[0].get('codec_name')!r} != {audio_codec!r}")
    raw_duration = data.get("format", {}).get("duration")
    try:
        duration = float(raw_duration)
    except (TypeError, ValueError):
        duration = float("nan")
    if not math.isfinite(duration) or duration <= 0:
        errors.append("format duration missing/invalid")
    else:
        if duration < min_seconds:
            errors.append(f"duration {duration:.3f}s below {min_seconds:.3f}s")
        if max_seconds is not None and duration > max_seconds:
            errors.append(f"duration {duration:.3f}s above {max_seconds:.3f}s")
    return errors


def decode_media(path: Path, timeout: int = 180) -> None:
    """Decode video and optional audio with FFmpeg to detect corrupt media streams.

    This does not measure frame-level composition or audio/video synchronization.
    """
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is required on PATH for --decode")
    try:
        result = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-xerror",
             "-i", str(path), "-map", "0:v:0", "-map", "0:a?", "-f", "null", "-"],
            capture_output=True, text=True, timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"decode timed out after {timeout}s") from exc
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg decode failed: {result.stderr.strip()[:1200]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path)
    parser.add_argument("--require-audio", action="store_true")
    parser.add_argument("--min-width", type=int, default=0)
    parser.add_argument("--min-height", type=int, default=0)
    parser.add_argument("--min-seconds", type=float, default=0)
    parser.add_argument("--max-seconds", type=float)
    parser.add_argument("--video-codec", help="Expected ffprobe codec_name, e.g. h264")
    parser.add_argument("--audio-codec", help="Expected ffprobe codec_name, e.g. aac")
    parser.add_argument("--min-fps", type=float)
    parser.add_argument("--max-fps", type=float)
    parser.add_argument("--decode", action="store_true", help="Also decode video/audio to catch corrupt streams")
    args = parser.parse_args()
    if args.min_fps is not None and args.min_fps <= 0:
        parser.error("--min-fps must be > 0")
    if args.max_fps is not None and args.max_fps <= 0:
        parser.error("--max-fps must be > 0")
    if args.min_fps is not None and args.max_fps is not None and args.min_fps > args.max_fps:
        parser.error("--min-fps must not exceed --max-fps")
    data = inspect_media(args.file)
    errors = validate(
        data, require_audio=args.require_audio,
        min_width=args.min_width, min_height=args.min_height,
        min_seconds=args.min_seconds, max_seconds=args.max_seconds,
        video_codec=args.video_codec, audio_codec=args.audio_codec,
        min_fps=args.min_fps, max_fps=args.max_fps,
    )
    decoded = False
    if args.decode and not errors:
        decoded = True
        try:
            decode_media(args.file)
        except RuntimeError as exc:
            errors.append(str(exc))
    print(json.dumps({
        "file": str(args.file),
        "streams": [
            {k: s.get(k) for k in ("codec_type", "codec_name", "width", "height", "avg_frame_rate")}
            for s in data.get("streams", [])
        ],
        "duration": data.get("format", {}).get("duration"),
        "decode_attempted": decoded,
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
    }, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
