"""Regression checks for actual frames and audio, not MP4 container metadata."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from scripts.media.check_edit_content import verify


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg unavailable")
class ContentValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.directory = Path(cls.tmp.name)
        cls.good = cls.directory / "edited.mp4"
        cls.missing_title = cls.directory / "no-title.mp4"
        cls.missing_audio = cls.directory / "no-audio.mp4"
        cls.wrong_cut = cls.directory / "wrong-cut.mp4"
        cls.reference = cls.directory / "known-good-title.png"

        def make(name, first="red", second="blue", title=True, audio=True):
            cmd = [
                "ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                f"color=c={first}:s=160x90:r=10:d=1",
                "-f", "lavfi", "-i", f"color=c={second}:s=160x90:r=10:d=1",
            ]
            if audio:
                cmd += ["-f", "lavfi", "-i", "sine=frequency=440:sample_rate=16000:duration=0.4"]
            filters = "[0:v][1:v]concat=n=2:v=1:a=0[v]"
            if title:
                filters += ";[v]drawbox=x=50:y=15:w=60:h=20:color=white:t=fill:enable='between(t,0.2,0.7)'[out]"
            else:
                filters += ";[v]null[out]"
            if audio:
                filters += ";[2:a]adelay=200,apad=whole_dur=2[a]"
            cmd += ["-filter_complex", filters, "-map", "[out]"]
            if audio:
                cmd += ["-map", "[a]"]
            else:
                cmd += ["-an"]
            cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
                    "-t", "2", str(name)]
            subprocess.run(cmd, check=True, capture_output=True)

        make(cls.good)
        make(cls.missing_title, title=False)
        make(cls.missing_audio, audio=False)
        make(cls.wrong_cut, first="blue", second="red")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0.4", "-i", str(cls.good),
                        "-frames:v", "1", str(cls.reference)], check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def spec(self):
        return {
            "frames": [
                {"time": 0.1, "region": [0.05, 0.1, 0.15, 0.2],
                 "expected_rgb": [253, 0, 0], "max_mae": 15},
                {"time": 1.3, "region": [0.05, 0.1, 0.15, 0.2],
                 "expected_rgb": [0, 0, 254], "max_mae": 15},
                {"time": 0.4, "region": [0.28, 0.10, 0.45, 0.40],
                 "reference": self.reference.name, "max_mae": 8},
            ],
            "audio_windows": [
                {"start": 0.3, "end": 0.48, "min_rms_dbfs": -35},
                {"start": 1.0, "end": 1.2, "max_rms_dbfs": -40},
            ],
        }

    def test_correct_export_passes(self):
        report = verify(self.good, self.spec(), self.directory)
        self.assertTrue(report["passed"], report)
        self.assertEqual(5, len(report["checks"]))

    def test_missing_title_is_detected(self):
        report = verify(self.missing_title, self.spec(), self.directory)
        self.assertFalse(report["passed"])
        self.assertIn(2, [x["index"] for x in report["failures"] if x["kind"] == "frame"])

    def test_title_differs_from_clean_source(self):
        # A source without a title is an independent negative reference.
        spec = {"frames": [{
            "time": 0.4, "reference": self.missing_title.name,
            "reference_time": 0.4, "region": [0.28, 0.10, 0.45, 0.40],
            "min_mae": 10, "max_mae": 255,
        }]}
        self.assertTrue(verify(self.good, spec, self.directory)["passed"])
        self.assertFalse(verify(self.missing_title, spec, self.directory)["passed"])

    def test_wrong_cut_is_detected(self):
        report = verify(self.wrong_cut, self.spec(), self.directory)
        self.assertFalse(report["passed"])
        self.assertIn(0, [x["index"] for x in report["failures"] if x["kind"] == "frame"])

    def test_missing_audio_is_detected(self):
        report = verify(self.missing_audio, self.spec(), self.directory)
        self.assertFalse(report["passed"])
        self.assertIn(0, [x["index"] for x in report["failures"] if x["kind"] == "audio"])

    def test_misaligned_audio_is_detected(self):
        spec = self.spec()
        spec["audio_windows"][0]["start"] = 1.2
        spec["audio_windows"][0]["end"] = 1.4
        report = verify(self.good, spec, self.directory)
        self.assertFalse(report["passed"])

    def test_rejects_invalid_region(self):
        spec = {"frames": [{"time": 0.5, "region": [0, 0, 0, 0.5],
                            "expected_rgb": [1, 2, 3]}]}
        with self.assertRaisesRegex(ValueError, "[Rr]egion"):
            verify(self.good, spec, self.directory)

    def test_rejects_empty_expectations(self):
        with self.assertRaisesRegex(ValueError, "Spec"):
            verify(self.good, {}, self.directory)


if __name__ == "__main__":
    unittest.main()
