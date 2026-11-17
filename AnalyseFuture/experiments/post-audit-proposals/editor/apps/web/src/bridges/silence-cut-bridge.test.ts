import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SilenceCutBridge, DEFAULT_SILENCE_SETTINGS } from "./silence-cut-bridge";

const mocks = vi.hoisted(() => ({
  getClip: vi.fn(), getMediaItem: vi.fn(), detectSilence: vi.fn(),
  loadAudioBuffer: vi.fn(), close: vi.fn(), decodeAudioData: vi.fn(),
}));
vi.mock("@openreel/core", () => ({ getAudioEngine: () => ({ detectSilence: mocks.detectSilence }) }));
vi.mock("../stores/project-store", () => ({ useProjectStore: { getState: () => mocks } }));
vi.mock("../utils/load-audio-buffer", () => ({ loadAudioBuffer: mocks.loadAudioBuffer }));

describe("silence analysis uses the shared audio-track loader", () => {
  let bridge: SilenceCutBridge;
  const blob = new Blob(["video container"], { type: "video/mp4" });
  const clip = Object.freeze({ id: "clip", mediaId: "video", inPoint: 2, outPoint: 8, audioTrackIndex: 1 });
  const buffer = { duration: 10 } as AudioBuffer;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("AudioContext", class { close = mocks.close; decodeAudioData = mocks.decodeAudioData; });
    bridge = new SilenceCutBridge();
    mocks.getClip.mockReturnValue(clip);
    mocks.getMediaItem.mockReturnValue({ blob });
    mocks.loadAudioBuffer.mockResolvedValue(buffer);
    mocks.detectSilence.mockReturnValue([{ start: 2, end: 5 }, { start: 7.5, end: 8 }]);
  });
  afterEach(() => { bridge.dispose(); vi.unstubAllGlobals(); });

  it("forwards the selected recorded stream and preserves trimmed-region padding and progress", async () => {
    const progress = vi.fn();
    const result = await bridge.analyzeClip("clip", DEFAULT_SILENCE_SETTINGS, progress);
    expect(mocks.loadAudioBuffer).toHaveBeenCalledWith(expect.anything(), blob, { audioTrackIndex: 1 });
    expect(mocks.decodeAudioData).not.toHaveBeenCalled();
    expect(mocks.detectSilence).toHaveBeenCalledWith(buffer, -40);
    expect(result.clipDuration).toBe(6);
    expect(result.silentRegions).toHaveLength(1);
    expect(result.silentRegions[0].start).toBeCloseTo(0.1);
    expect(result.silentRegions[0].end).toBeCloseTo(2.9);
    expect(result.totalSilenceDuration).toBeCloseTo(2.8);
    expect(progress.mock.calls.map(([value]) => value)).toEqual([10, 30, 60, 90, 100]);
    expect(clip).toEqual({ id: "clip", mediaId: "video", inPoint: 2, outPoint: 8, audioTrackIndex: 1 });
  });

  it("stops before analysis when the selected stream cannot be decoded", async () => {
    mocks.loadAudioBuffer.mockResolvedValue(null);
    await expect(bridge.analyzeClip("clip", DEFAULT_SILENCE_SETTINGS)).rejects.toThrow("selected audio track");
    expect(mocks.detectSilence).not.toHaveBeenCalled();
  });

  it("rejects missing media before loading audio", async () => {
    mocks.getMediaItem.mockReturnValue(null);
    await expect(bridge.analyzeClip("clip", DEFAULT_SILENCE_SETTINGS)).rejects.toThrow("Media blob not found");
    expect(mocks.loadAudioBuffer).not.toHaveBeenCalled();
  });
});
