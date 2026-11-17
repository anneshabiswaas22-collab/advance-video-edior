import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadAudioBuffer } from "./load-audio-buffer";

const { extractAudioWav } = vi.hoisted(() => ({ extractAudioWav: vi.fn() }));
vi.mock("@openreel/core/media", () => ({ extractAudioWav }));

describe("shared analysis audio loading", () => {
  const sourceBytes = new ArrayBuffer(4);
  const extractedBytes = new ArrayBuffer(8);
  const source = { arrayBuffer: vi.fn().mockResolvedValue(sourceBytes) } as unknown as Blob;
  const wav = { arrayBuffer: vi.fn().mockResolvedValue(extractedBytes) } as unknown as Blob;
  const decoded = { duration: 2 } as AudioBuffer;
  const decodeAudioData = vi.fn();
  const context = { decodeAudioData } as unknown as AudioContext;

  beforeEach(() => {
    vi.clearAllMocks();
    extractAudioWav.mockResolvedValue(wav);
    decodeAudioData.mockResolvedValue(decoded);
  });

  it("extracts the requested stream before decoding and reports completion", async () => {
    const onProgress = vi.fn();
    expect(await loadAudioBuffer(context, source, { audioTrackIndex: 2, onProgress })).toBe(decoded);
    expect(extractAudioWav).toHaveBeenCalledWith(source, 2, expect.objectContaining({ onProgress: expect.any(Function) }));
    expect(decodeAudioData).toHaveBeenCalledWith(extractedBytes);
    expect(source.arrayBuffer).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenLastCalledWith({ stage: "decoding", progress: 1, message: "Audio ready for analysis" });
  });

  it("retains source decoding as a fallback for stream zero", async () => {
    extractAudioWav.mockRejectedValue(new Error("container extraction unavailable"));
    expect(await loadAudioBuffer(context, source)).toBe(decoded);
    expect(decodeAudioData).toHaveBeenCalledWith(sourceBytes);
  });

  it("does not silently substitute the default audio for a failed nonzero stream", async () => {
    extractAudioWav.mockRejectedValue(new Error("selected stream missing"));
    expect(await loadAudioBuffer(context, source, { audioTrackIndex: 2 })).toBeNull();
    expect(source.arrayBuffer).not.toHaveBeenCalled();
    expect(decodeAudioData).not.toHaveBeenCalled();
  });

  it("returns null after both extraction and source decode fail", async () => {
    extractAudioWav.mockRejectedValue(new Error("extraction failed"));
    decodeAudioData.mockRejectedValue(new Error("decode failed"));
    expect(await loadAudioBuffer(context, source)).toBeNull();
  });
});
