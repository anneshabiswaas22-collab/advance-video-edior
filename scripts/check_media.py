#!/usr/bin/env python3
"""Use ffprobe to validate basic media metadata. NOT a visual fidelity check."""
import argparse
import json
import shutil
import subprocess
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


def validate(data: dict[str, Any], *, require_audio: bool = False,
             min_width: int = 0, min_height: int = 0,
             min_seconds: float = 0, max_seconds: float | None = None) -> list[str]:
    errors: list[str] = []
    streams = data.get("streams", [])
    videos = [s for s in streams if s.get("codec_type") == "video"]
    audios = [s for s in streams if s.get("codec_type") == "audio"]
    if not videos:
        errors.append("video stream missing")
    else:
        width = int(videos[0].get("width") or 0)
        height = int(videos[0].get("height") or 0)
        if width < min_width or height < min_height:
            errors.append(f"resolution {width}x{height} below {min_width}x{min_height}")
    if require_audio and not audios:
        errors.append("audio stream missing")
    raw_duration = data.get("format", {}).get("duration")
    try:
        duration = float(raw_duration)
    except (TypeError, ValueError):
        errors.append("format duration missing/invalid")
        return errors
    if duration < min_seconds:
        errors.append(f"duration {duration:.3f}s below {min_seconds:.3f}s")
    if max_seconds is not None and duration > max_seconds:
        errors.append(f"duration {duration:.3f}s above {max_seconds:.3f}s")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path)
    parser.add_argument("--require-audio", action="store_true")
    parser.add_argument("--min-width", type=int, default=0)
    parser.add_argument("--min-height", type=int, default=0)
    parser.add_argument("--min-seconds", type=float, default=0)
    parser.add_argument("--max-seconds", type=float)
    args = parser.parse_args()
    data = inspect_media(args.file)
    errors = validate(data, require_audio=args.require_audio,
                      min_width=args.min_width, min_height=args.min_height,
                      min_seconds=args.min_seconds, max_seconds=args.max_seconds)
    print(json.dumps({
        "file": str(args.file),
        "streams": [
            {k: s.get(k) for k in ("codec_type", "codec_name", "width", "height")}
            for s in data.get("streams", [])
        ],
        "duration": data.get("format", {}).get("duration"),
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
    }, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
