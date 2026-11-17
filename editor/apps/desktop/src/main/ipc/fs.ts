import { dialog, shell, BrowserWindow } from "electron";
import { promises as fs } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import os from "node:os";

interface PendingFileWrite {
  file: FileHandle;
  target: string;
  staging: string;
  queue: Promise<void>;
  failed?: unknown;
  aborted: boolean;
  finalization?: Promise<void>;
}

const MAX_OPEN_WRITERS = 32;

export class FileWriterRegistry {
  private handles = new Map<string, PendingFileWrite>();
  private opening = 0;

  async open(targetPath: string): Promise<string> {
    if (this.handles.size + this.opening >= MAX_OPEN_WRITERS) {
      throw new Error("too many open write handles");
    }
    this.opening++;
    try {
      const id = randomUUID();
      const target = path.resolve(targetPath);
      const staging = path.join(path.dirname(target), `.openreel-write-${id}.tmp`);
      // An exclusive sibling keeps cancellation/failure from truncating an
      // existing export. Keeping it on the same filesystem permits atomic rename.
      const file = await fs.open(staging, "wx", 0o600);
      this.handles.set(id, { file, target, staging, queue: Promise.resolve(), aborted: false });
      return id;
    } finally {
      this.opening--;
    }
  }

  async writeChunk(id: string, data: ArrayBuffer | Uint8Array, position: number): Promise<void> {
    const entry = this.handles.get(id);
    if (!entry || entry.finalization) throw new Error(`unknown or closing write handle ${id}`);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (!Number.isSafeInteger(position) || position < 0 ||
        !Number.isSafeInteger(position + bytes.byteLength)) {
      const error = new Error("write position must be a nonnegative safe integer");
      entry.failed = error;
      throw error;
    }
    const operation = entry.queue.then(async () => {
      if (entry.failed) throw entry.failed;
      let offset = 0;
      while (offset < bytes.byteLength) {
        const { bytesWritten } = await entry.file.write(
          bytes, offset, bytes.byteLength - offset, position + offset,
        );
        if (bytesWritten <= 0) throw new Error("file write made no progress");
        offset += bytesWritten;
      }
    });
    // Serialize overlapping chunks and retain a failure so close cannot commit
    // an incomplete file even if its caller catches the write rejection.
    entry.queue = operation.catch((error: unknown) => { entry.failed = error; });
    await operation;
  }

  async close(id: string): Promise<void> {
    const entry = this.handles.get(id);
    if (!entry) return;
    entry.finalization ??= this.finalize(id, entry);
    await entry.finalization;
  }

  async abort(id: string): Promise<void> {
    const entry = this.handles.get(id);
    if (!entry) return;
    entry.aborted = true;
    entry.finalization ??= this.finalize(id, entry);
    await entry.finalization;
  }

  private async finalize(id: string, entry: PendingFileWrite): Promise<void> {
    let closed = false;
    try {
      await entry.queue;
      await entry.file.close();
      closed = true;
      if (entry.aborted) return;
      if (entry.failed) throw entry.failed;
      await fs.rename(entry.staging, entry.target);
    } finally {
      if (!closed) await entry.file.close().catch(() => {});
      this.handles.delete(id);
      // Only remove the staging file. Never unlink the user's target on abort.
      await fs.rm(entry.staging, { force: true });
    }
  }
}

export const fileWriters = new FileWriterRegistry();

export async function showSaveDialog(args: {
  defaultPath: string;
  filters: { name: string; extensions: string[] }[];
}): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? undefined;
  const res = await dialog.showSaveDialog(win!, {
    defaultPath: args.defaultPath,
    filters: args.filters,
  });
  return res.canceled || !res.filePath ? null : res.filePath;
}

export async function showOpenDialog(args: {
  filters: { name: string; extensions: string[] }[];
}): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? undefined;
  const res = await dialog.showOpenDialog(win!, {
    filters: args.filters,
    properties: ["openFile"],
  });
  return res.canceled || res.filePaths.length === 0 ? null : res.filePaths[0];
}

export async function readTextFile(args: { path: string }): Promise<string> {
  return fs.readFile(args.path, "utf8");
}

export async function readFileBytes(args: { path: string }): Promise<ArrayBuffer> {
  const buf = await fs.readFile(args.path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function writeTextFile(args: { path: string; data: string }): Promise<void> {
  await fs.writeFile(args.path, args.data, "utf8");
}

export async function revealInFolder(args: { path: string }): Promise<void> {
  shell.showItemInFolder(args.path);
}

export async function tempFilePath(args: { ext: string }): Promise<string> {
  const safeExt = args.ext.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  return path.join(os.tmpdir(), `openreel-mat-${randomUUID()}.${safeExt}`);
}
