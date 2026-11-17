import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Clip, Project, Track } from "@openreel/core";
import { buildTriggerTrackBuffer } from "./AudioDuckingSection";

const mocks = vi.hoisted(() => ({
  loadAudioBuffer: vi.fn(), close: vi.fn(), start: vi.fn(),
  sourceConnect: vi.fn(), gainConnect: vi.fn(), startRendering: vi.fn(),
  offlineCreated: vi.fn(), sourceCreated: vi.fn(),
}));
vi.mock("../../../utils/load-audio-buffer", () => ({ loadAudioBuffer: mocks.loadAudioBuffer }));

describe("ducking trigger audio uses shared media extraction", () => {
  const blob = new Blob(["multitrack video"], { type: "video/mp4" });
  const background = { id: "music", startTime: 4, duration: 4 } as Clip;
  const trigger = Object.freeze({ id: "voice", mediaId: "recording", startTime: 2, duration: 8, inPoint: 1, speed: 2, volume: 0.6, audioTrackIndex: 2 });
  const track = { clips: [trigger] } as unknown as Track;
  const project = { settings: { channels: 2, sampleRate: 48_000 }, mediaLibrary: { items: [{ id: "recording", blob }] } } as Project;
  const decoded = { duration: 20 } as AudioBuffer;
  const rendered = { duration: 4 } as AudioBuffer;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.close.mockResolvedValue(undefined);
    mocks.loadAudioBuffer.mockResolvedValue(decoded);
    mocks.startRendering.mockResolvedValue(rendered);
    vi.stubGlobal("AudioContext", class { close = mocks.close; });
    vi.stubGlobal("OfflineAudioContext", class {
      destination = {};
      constructor(...args: unknown[]) { mocks.offlineCreated(...args); }
      createBufferSource() {
        const source = { buffer: null, playbackRate: { value: 1 }, connect: mocks.sourceConnect, start: mocks.start };
        mocks.sourceCreated(source);
        return source;
      }
      createGain() { return { gain: { value: 1 }, connect: mocks.gainConnect }; }
      startRendering = mocks.startRendering;
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("forwards stream selection and keeps overlap, source offset, speed and output duration", async () => {
    expect(await buildTriggerTrackBuffer(project, background, track)).toBe(rendered);
    expect(mocks.loadAudioBuffer).toHaveBeenCalledWith(expect.anything(), blob, { audioTrackIndex: 2 });
    expect(mocks.offlineCreated).toHaveBeenCalledWith(2, 192_000, 48_000);
    expect(mocks.sourceCreated.mock.calls[0][0].buffer).toBe(decoded);
    expect(mocks.sourceCreated.mock.calls[0][0].playbackRate.value).toBe(2);
    expect(mocks.start).toHaveBeenCalledWith(0, 5, 8);
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(trigger.audioTrackIndex).toBe(2);
    expect(trigger.inPoint).toBe(1);
  });

  it("rejects an undecodable stream without scheduling a source or rendering", async () => {
    mocks.loadAudioBuffer.mockResolvedValue(null);
    await expect(buildTriggerTrackBuffer(project, background, track)).rejects.toThrow("No decodable trigger audio");
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.startRendering).not.toHaveBeenCalled();
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("continues to another trigger when one recorded source fails", async () => {
    mocks.loadAudioBuffer.mockRejectedValueOnce(new Error("bad source"));
    const mixedTrack = { clips: [trigger, { ...trigger, id: "second" }] } as unknown as Track;
    expect(await buildTriggerTrackBuffer(project, background, mixedTrack)).toBe(rendered);
    expect(mocks.loadAudioBuffer).toHaveBeenCalledTimes(2);
    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.close).toHaveBeenCalledOnce();
  });
});
