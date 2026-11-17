import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { FileWriterRegistry } from "../src/main/ipc/fs";

let directory: string;
let target: string;
let registry: FileWriterRegistry;
let handles: string[];

async function open(filePath = target): Promise<string> {
  const id = await registry.open(filePath);
  handles.push(id);
  return id;
}

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

describe("FileWriterRegistry", () => {
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(tmpdir(), "openreel-writer-test-"));
    target = path.join(directory, "output.bin");
    registry = new FileWriterRegistry();
    handles = [];
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(handles.map((id) => registry.abort(id)));
    await fs.rm(directory, { recursive: true, force: true });
  });

  it("writes positioned chunks then finalizes to disk", async () => {
    const id = await open();
    await registry.writeChunk(id, bytes("world").buffer as ArrayBuffer, 5);
    await registry.writeChunk(id, bytes("hello").buffer as ArrayBuffer, 0);
    await registry.close(id);
    expect(await fs.readFile(target, "utf8")).toBe("helloworld");
    expect(await fs.readdir(directory)).toEqual(["output.bin"]);
  });

  it("writes Uint8Array chunks without requiring an ArrayBuffer copy", async () => {
    const id = await open();
    await registry.writeChunk(id, bytes("typed-array"), 0);
    await registry.close(id);
    expect(await fs.readFile(target, "utf8")).toBe("typed-array");
  });

  it("abort discards a new partial file", async () => {
    const id = await open();
    await registry.writeChunk(id, bytes("partial"), 0);
    await registry.abort(id);
    await expect(fs.readFile(target)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await fs.readdir(directory)).toEqual([]);
  });

  it("keeps an existing export unchanged until close, including after cancellation", async () => {
    await fs.writeFile(target, "original");
    const id = await open();
    await registry.writeChunk(id, bytes("replacement"), 0);
    expect(await fs.readFile(target, "utf8")).toBe("original");
    await registry.abort(id);
    expect(await fs.readFile(target, "utf8")).toBe("original");
    expect(await fs.readdir(directory)).toEqual(["output.bin"]);
  });

  it("replaces an existing export only after all queued chunks complete", async () => {
    await fs.writeFile(target, "original-longer-content");
    const id = await open();
    const first = registry.writeChunk(id, bytes("hello"), 0);
    const second = registry.writeChunk(id, bytes("world"), 5);
    await Promise.all([first, second, registry.close(id)]);
    expect(await fs.readFile(target, "utf8")).toBe("helloworld");
    expect(await fs.readdir(directory)).toEqual(["output.bin"]);
  });

  it("keeps the original if committing the staging file fails", async () => {
    await fs.writeFile(target, "original");
    const id = await open();
    await registry.writeChunk(id, bytes("replacement"), 0);
    vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("rename failed"));
    await expect(registry.close(id)).rejects.toThrow("rename failed");
    expect(await fs.readFile(target, "utf8")).toBe("original");
    expect(await fs.readdir(directory)).toEqual(["output.bin"]);
  });

  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])(
    "rejects unsafe position %s and prevents a subsequent close from overwriting the original",
    async (position) => {
      await fs.writeFile(target, "original");
      const id = await open();
      await expect(registry.writeChunk(id, bytes("replacement"), position))
        .rejects.toThrow("write position");
      await expect(registry.close(id)).rejects.toThrow("write position");
      expect(await fs.readFile(target, "utf8")).toBe("original");
      expect(await fs.readdir(directory)).toEqual(["output.bin"]);
    },
  );

  it("retries short filesystem writes until the full chunk is written", async () => {
    const realOpen = fs.open.bind(fs);
    vi.spyOn(fs, "open").mockImplementationOnce(async (...args: Parameters<typeof fs.open>) => {
      const handle = await realOpen(...args);
      const realWrite = handle.write.bind(handle);
      const shortWrite = async (buffer: Uint8Array, offset: number, length: number, position: number) =>
        realWrite(buffer, offset, Math.min(length, 2), position);
      vi.spyOn(handle, "write").mockImplementation(shortWrite as FileHandle["write"]);
      return handle;
    });
    const id = await open();
    await registry.writeChunk(id, bytes("complete-chunk"), 0);
    await registry.close(id);
    expect(await fs.readFile(target, "utf8")).toBe("complete-chunk");
  });

  it("retains a write failure so close cannot commit incomplete data", async () => {
    await fs.writeFile(target, "original");
    const realOpen = fs.open.bind(fs);
    vi.spyOn(fs, "open").mockImplementationOnce(async (...args: Parameters<typeof fs.open>) => {
      const handle = await realOpen(...args);
      vi.spyOn(handle, "write").mockRejectedValueOnce(new Error("disk full"));
      return handle;
    });
    const id = await open();
    await expect(registry.writeChunk(id, bytes("replacement"), 0)).rejects.toThrow("disk full");
    await expect(registry.close(id)).rejects.toThrow("disk full");
    expect(await fs.readFile(target, "utf8")).toBe("original");
    expect(await fs.readdir(directory)).toEqual(["output.bin"]);
  });

  it("bounds concurrent open handles including pending opens", async () => {
    const results = await Promise.allSettled(Array.from({ length: 33 }, (_, i) =>
      open(path.join(directory, `output-${i}.bin`)),
    ));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(32);
    const rejected = results.filter((result) => result.status === "rejected");
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toBe("too many open write handles");
  });
});
