#!/usr/bin/env python3
"""Verify decoded frame content and audio timing against an explicit JSON spec.

FFmpeg/ffprobe only, no paid services. Complements scripts/media/check_media.py.

Example spec:
{
  "frames": [
    {"time": 0.1, "region": [0.05, 0.05, 0.2, 0.2],
     "expected_rgb": [240, 20, 20], "max_mae": 30},
    {"time": 0.5, "region": [0.3, 0.1, 0.4, 0.3],
     "reference": "golden-title.png", "max_mae": 15}
  ],
  "audio_windows": [
    {"start": 0.25, "end": 0.45, "min_rms_dbfs": -35},
    {"start": 0.9, "end": 1.1, "max_rms_dbfs": -45}
  ]
}
Region coordinates are normalized (x, y, width, height). Reference paths are
relative to the specification file. Use independently known-good reference
images, not frames extracted from the file under test.
"""
import argparse
from array import array
import json
import math
from pathlib import Path
import subprocess
import sys


def _run(args: list[str], timeout: int = 90) -> bytes:
    result = subprocess.run(args, capture_output=True, timeout=timeout, check=False)
    if result.returncode:
        raise RuntimeError(f"{args[0]} failed: {result.stderr.decode(errors='replace')[-1200:]}")
    return result.stdout


def _video_size(path: Path) -> tuple[int, int]:
    data = json.loads(_run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height", "-of", "json", str(path),
    ]))
    streams = data.get("streams", [])
    if not streams:
        raise ValueError(f"No video stream in {path}")
    width, height = int(streams[0]["width"]), int(streams[0]["height"])
    if not (0 < width <= 8192 and 0 < height <= 8192):
        raise ValueError(f"Unsupported frame dimensions: {width}x{height}")
    return width, height


def _frame(path: Path, time: float, size: tuple[int, int]) -> bytes:
    width, height = size
    raw = _run([
        "ffmpeg", "-v", "error", "-nostdin", "-ss", str(time), "-i", str(path),
        "-an", "-frames:v", "1", "-vf",
        f"scale={width}:{height}:flags=bilinear,format=rgb24",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ])
    if len(raw) != width * height * 3:
        raise ValueError(f"No complete decoded frame at {time}s in {path}")
    return raw


def _bounds(region: list[float], size: tuple[int, int]) -> tuple[int, int, int, int]:
    if len(region) != 4 or any(not math.isfinite(v) for v in region):
        raise ValueError("Region must contain four finite normalized numbers")
    x, y, w, h = region
    if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > 1.00001 or y + h > 1.00001:
        raise ValueError(f"Invalid normalized region: {region}")
    width, height = size
    x0, y0 = int(x * width), int(y * height)
    x1, y1 = min(width, int((x + w) * width)), min(height, int((y + h) * height))
    if x1 <= x0 or y1 <= y0:
        raise ValueError("Region is smaller than a pixel")
    return x0, y0, x1, y1


def _mae(frame: bytes, region: list[float], size: tuple[int, int],
         reference: bytes | None, expected_rgb: list[int] | None) -> float:
    x0, y0, x1, y1 = _bounds(region, size)
    width = size[0]
    if (reference is None) == (expected_rgb is None):
        raise ValueError("Exactly one of reference or expected_rgb is required")
    if expected_rgb is not None and (len(expected_rgb) != 3 or
                                     any(not isinstance(v, int) or v < 0 or v > 255 for v in expected_rgb)):
        raise ValueError("expected_rgb must be three integer RGB values")
    total = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            offset = (y * width + x) * 3
            for channel in range(3):
                target = reference[offset + channel] if reference is not None else expected_rgb[channel]
                total += abs(frame[offset + channel] - target)
    return total / ((x1 - x0) * (y1 - y0) * 3)


def _audio_rms_dbfs(path: Path, start: float, end: float) -> float:
    if not (0 <= start < end and math.isfinite(end)):
        raise ValueError(f"Invalid audio window: {start}..{end}")
    audio_streams = json.loads(_run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=index", "-of", "json", str(path),
    ])).get("streams", [])
    if not audio_streams:
        return float("-inf")
    raw = _run([
        "ffmpeg", "-v", "error", "-nostdin", "-ss", str(start),
        "-i", str(path), "-t", str(end - start), "-vn", "-ac", "1",
        "-ar", "16000", "-f", "f32le", "-",
    ])
    if len(raw) % 4:
        raise ValueError("Invalid PCM sample size")
    samples = array("f")
    samples.frombytes(raw)
    if sys.byteorder != "little":
        samples.byteswap()
    if not samples:
        return float("-inf")
    rms = math.sqrt(sum(float(v) ** 2 for v in samples) / len(samples))
    return 20 * math.log10(rms) if rms > 0 else float("-inf")


def verify(media: Path, spec: dict, spec_directory: Path) -> dict:
    """Return per-check measurements; fail closed if samples cannot be decoded."""
    size = _video_size(media)
    results = []
    for index, check in enumerate(spec.get("frames", [])):
        time = float(check["time"])
        if not math.isfinite(time) or time < 0:
            raise ValueError(f"Invalid frame timestamp: {time}")
        reference = None
        if "reference" in check:
            ref_path = (spec_directory / check["reference"]).resolve()
            if not ref_path.is_file():
                raise FileNotFoundError(ref_path)
            reference = _frame(ref_path, float(check.get("reference_time", 0)), size)
        measured = _mae(
            _frame(media, time, size), check.get("region", [0, 0, 1, 1]),
            size, reference, check.get("expected_rgb"),
        )
        limit = float(check.get("max_mae", 20))
        minimum = float(check.get("min_mae", 0))
        passed = (math.isfinite(limit) and math.isfinite(minimum) and
                  0 <= minimum <= measured <= limit)
        results.append({
            "kind": "frame", "index": index, "time": time, "mae": round(measured, 3),
            "min_mae": minimum, "max_mae": limit, "passed": passed,
        })
    for index, check in enumerate(spec.get("audio_windows", [])):
        start, end = float(check["start"]), float(check["end"])
        measured = _audio_rms_dbfs(media, start, end)
        minimum = float(check.get("min_rms_dbfs", float("-inf")))
        maximum = float(check.get("max_rms_dbfs", float("inf")))
        if minimum > maximum:
            raise ValueError("Audio RMS minimum exceeds maximum")
        passed = minimum <= measured <= maximum
        results.append({
            "kind": "audio", "index": index, "start": start, "end": end,
            "rms_dbfs": round(measured, 3) if math.isfinite(measured) else "-inf",
            "passed": passed,
        })
    if not results:
        raise ValueError("Spec must contain frame or audio expectations")
    return {"media": str(media), "passed": all(item["passed"] for item in results),
            "checks": results, "failures": [item for item in results if not item["passed"]]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("media", type=Path, help="Actual MP4/WebM export to validate")
    parser.add_argument("spec", type=Path, help="JSON with independently defined expectations")
    parser.add_argument("--report", type=Path, help="Write structured JSON measurements")
    args = parser.parse_args()
    result = verify(args.media, json.loads(args.spec.read_text()), args.spec.parent)
    text = json.dumps(result, indent=2, allow_nan=False) + "\n"
    print(text, end="")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(text)
    if not result["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
