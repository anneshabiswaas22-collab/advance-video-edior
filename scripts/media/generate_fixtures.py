#!/usr/bin/env python3
"""Create short, synthetic audio/video media for smoke tests, no external assets."""
import argparse
import shutil
import subprocess
from pathlib import Path


def generate(output_dir: Path, seconds: float = 3.0) -> Path:
    if seconds <= 0:
        raise ValueError("seconds must be > 0")
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is required on PATH")
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / "sample-3s.mp4"
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "lavfi", "-i", f"testsrc2=size=640x360:rate=30:duration={seconds:g}",
        "-f", "lavfi", "-i", f"sine=frequency=440:sample_rate=48000:duration={seconds:g}",
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast",
        "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart",
        str(target),
    ]
    subprocess.run(cmd, check=True)
    if not target.is_file() or not target.stat().st_size:
        raise RuntimeError("fixture file missing or empty after FFmpeg")
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path("test-output"))
    parser.add_argument("--seconds", type=float, default=3.0)
    args = parser.parse_args()
    print(generate(args.output_dir, args.seconds))


if __name__ == "__main__":
    main()
