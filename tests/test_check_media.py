"""Media-validation tests do not need FFmpeg; CI runs a real decode smoke test."""
import unittest
from unittest.mock import patch
from pathlib import Path

from scripts.check_media import _fps, decode_media, validate


class MediaValidationTests(unittest.TestCase):
    def setUp(self):
        self.valid = {
            "format": {"duration": "3.01"},
            "streams": [
                {"codec_type": "video", "codec_name": "h264", "width": 640,
                 "height": 360, "avg_frame_rate": "30/1"},
                {"codec_type": "audio", "codec_name": "aac"},
            ],
        }

    def test_accepts_valid_fixture(self):
        self.assertEqual([], validate(
            self.valid, require_audio=True, min_width=640, min_height=360,
            min_seconds=2.8, max_seconds=3.2))

    def test_accepts_video_audio_codec_and_frame_rate(self):
        self.assertEqual([], validate(self.valid, video_codec="h264", audio_codec="aac",
                                       min_fps=29.9, max_fps=30.1))

    def test_rejects_missing_video(self):
        bad = {"format": {"duration": "3"}, "streams": [{"codec_type": "audio"}]}
        self.assertIn("video stream missing", validate(bad))

    def test_rejects_missing_audio(self):
        bad = {"format": {"duration": "3"}, "streams": [
            {"codec_type": "video", "width": 640, "height": 360}]}
        self.assertIn("audio stream missing", validate(bad, require_audio=True))

    def test_audio_codec_implicitly_requires_audio(self):
        bad = {"format": {"duration": "3"}, "streams": [
            {"codec_type": "video", "width": 640, "height": 360}]}
        self.assertIn("audio stream missing", validate(bad, audio_codec="aac"))

    def test_rejects_wrong_video_codec(self):
        self.assertTrue(any("video codec" in x for x in validate(self.valid, video_codec="hevc")))

    def test_rejects_wrong_audio_codec(self):
        self.assertTrue(any("audio codec" in x for x in validate(self.valid, audio_codec="mp3")))

    def test_rejects_short_duration(self):
        self.assertTrue(any("duration" in e for e in validate(self.valid, min_seconds=4.0)))

    def test_rejects_invalid_duration(self):
        bad = {"format": {}, "streams": [{"codec_type": "video"}]}
        self.assertIn("format duration missing/invalid", validate(bad))

    def test_rejects_non_finite_duration(self):
        for duration in ("nan", "inf", "-inf", "-1", "0"):
            with self.subTest(duration=duration):
                d = dict(self.valid)
                d["format"] = {"duration": duration}
                self.assertIn("format duration missing/invalid", validate(d))

    def test_rejects_low_resolution(self):
        self.assertTrue(any("resolution" in e for e in validate(
            self.valid, min_width=1920, min_height=1080)))

    def test_rejects_invalid_resolution(self):
        data = dict(self.valid)
        data["streams"] = [dict(self.valid["streams"][0], width="unknown")]
        self.assertTrue(any("resolution" in e for e in validate(data)))

    def test_rejects_unsupported_fps(self):
        self.assertTrue(any("frame rate" in e for e in validate(self.valid, min_fps=59)))

    def test_handles_missing_fps(self):
        data = dict(self.valid)
        data["streams"] = [dict(self.valid["streams"][0], avg_frame_rate="0/0",
                                r_frame_rate="0/0")]
        self.assertIn("video frame rate missing/invalid", validate(data, min_fps=24))

    def test_fps_falls_back_to_nominal(self):
        self.assertEqual(24, _fps({"avg_frame_rate": "0/0", "r_frame_rate": "24/1"}))

    def test_decode_fails_with_ffmpeg_error(self):
        class Failure:
            returncode = 1
            stderr = "corrupt packet"
        with patch("scripts.check_media.shutil.which", return_value="/usr/bin/ffmpeg"), \
             patch("scripts.check_media.subprocess.run", return_value=Failure()):
            with self.assertRaisesRegex(RuntimeError, "corrupt packet"):
                decode_media(Path("video.mp4"))


if __name__ == "__main__":
    unittest.main()
