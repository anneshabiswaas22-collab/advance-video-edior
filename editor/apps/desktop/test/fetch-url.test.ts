import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("electron", () => ({ net: { fetch: fetchMock } }));
import { fetchUrl } from "../src/main/ipc/fetch-url";

const PUBLIC = "https://8.8.8.8/media.mp4";

beforeEach(() => { fetchMock.mockReset(); });
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("desktop media URL fetch policy", () => {
  it.each([
    "http://127.0.0.1/", "http://2130706433/", "http://0x7f000001/",
    "http://10.0.0.1/", "http://172.16.0.1/", "http://192.168.1.1/",
    "http://169.254.169.254/", "http://100.64.0.1/", "http://0.0.0.0/",
    "http://198.18.0.1/", "http://224.0.0.1/", "http://255.255.255.255/",
    "http://[::1]/", "http://[::]/", "http://[fc00::1]/", "http://[fe80::1]/",
    "http://[ff02::1]/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:7f00:1]/",
    "http://[::ffff:c0a8:101]/", "http://[2002:7f00:1::]/",
    "http://[64:ff9b::7f00:1]/", "http://[2001:db8::1]/",
  ])("rejects private/reserved/transition address %s before any request", async (url) => {
    const result = await fetchUrl({ url });
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["https://media.example/file", "http://localhost/", "http://internal.local/"])(
    "fails closed on unpinned hostname %s", async (url) => {
      const result = await fetchUrl({ url });
      expect(result.error).toContain("download the media separately");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("does not allow the old environment escape hatch to enable loopback", async () => {
    vi.stubEnv("OPENREEL_ALLOW_LOCAL_FETCH", "1");
    expect((await fetchUrl({ url: "http://127.0.0.1/" })).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["file:///etc/passwd", "ftp://8.8.8.8/file", "https://user:password@8.8.8.8/file", "invalid"])(
    "rejects unsupported URL %s", async (url) => {
      expect((await fetchUrl({ url })).ok).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([PUBLIC, "https://[2001:4860:4860::8888]/media.mp4"])(
    "reads a bounded response from public literal %s through Electron", async (url) => {
      fetchMock.mockResolvedValue(new Response("abc", { headers: { "content-type": "video/mp4" } }));
      const result = await fetchUrl({ url, maxBytes: 3 });
      expect(result.ok).toBe(true);
      expect(result.contentType).toBe("video/mp4");
      expect(new TextDecoder().decode(result.body)).toBe("abc");
      expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ redirect: "manual", signal: expect.any(AbortSignal) }));
    },
  );

  it.each(["http://127.0.0.1/secret", "http://[::ffff:7f00:1]/secret", "https://private.example/secret"])(
    "rejects redirect destination %s before following it", async (location) => {
      fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location } }));
      expect((await fetchUrl({ url: PUBLIC })).ok).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("validates and follows a relative redirect without automatic redirects", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: "/final" } }))
      .mockResolvedValueOnce(new Response("done"));
    const result = await fetchUrl({ url: PUBLIC });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://8.8.8.8/final", expect.objectContaining({ redirect: "manual" }));
  });

  it("bounds redirect chains", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 301, headers: { location: "/again" } })));
    expect((await fetchUrl({ url: PUBLIC })).error).toContain("Too many");
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("rejects an oversized declared body and aborts without reading it", async () => {
    const response = new Response("oversized", { headers: { "content-length": "999" } });
    const reader = vi.spyOn(response.body!, "getReader");
    fetchMock.mockResolvedValue(response);
    expect((await fetchUrl({ url: PUBLIC, maxBytes: 3 })).ok).toBe(false);
    expect(reader).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("stops a chunked body at the limit even when content length is absent", async () => {
    const cancelled = vi.fn();
    let chunks = 0;
    const stream = new ReadableStream({
      pull(controller) { chunks++; controller.enqueue(new Uint8Array(2)); },
      cancel: cancelled,
    });
    fetchMock.mockResolvedValue(new Response(stream));
    const result = await fetchUrl({ url: PUBLIC, maxBytes: 3 });
    expect(result.ok).toBe(false);
    expect(result.body.byteLength).toBe(0);
    expect(cancelled).toHaveBeenCalledOnce();
    expect(chunks).toBeLessThanOrEqual(3);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 256 * 1024 * 1024 + 1])(
    "rejects invalid or unbounded size %s", async (maxBytes) => {
      expect((await fetchUrl({ url: PUBLIC, maxBytes })).ok).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("aborts stalled fetching on the deadline", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    const result = fetchUrl({ url: PUBLIC });
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await result).error).toContain("timeout");
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
