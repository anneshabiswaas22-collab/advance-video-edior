"""Unit tests do not require FFmpeg; integration validation runs in CI."""
import unittest

from scripts.check_media import validate


class MediaValidationTests(unittest.TestCase):
    def setUp(self):
        self.valid = {
            "format": {"duration": "3.01"},
            "streams": [
                {"codec_type": "video", "width": 640, "height": 360},
                {"codec_type": "audio"},
            ],
        }

    def test_accepts_valid_fixture(self):
        self.assertEqual([], validate(
            self.valid, require_audio=True, min_width=640, min_height=360,
            min_seconds=2.8, max_seconds=3.2))

    def test_rejects_missing_video(self):
        bad = {"format": {"duration": "3"}, "streams": [{"codec_type": "audio"}]}
        self.assertIn("video stream missing", validate(bad))

    def test_rejects_missing_audio(self):
        bad = {"format": {"duration": "3"}, "streams": [{"codec_type": "video", "width": 640, "height": 360}]}
        self.assertIn("audio stream missing", validate(bad, require_audio=True))

    def test_rejects_short_duration(self):
        self.assertTrue(any("duration" in e for e in validate(self.valid, min_seconds=4.0)))

    def test_rejects_invalid_duration(self):
        bad = {"format": {}, "streams": [{"codec_type": "video"}]}
        self.assertIn("format duration missing/invalid", validate(bad))

    def test_rejects_low_resolution(self):
        self.assertTrue(any("resolution" in e for e in validate(
            self.valid, min_width=1920, min_height=1080)))


if __name__ == "__main__":
    unittest.main()
