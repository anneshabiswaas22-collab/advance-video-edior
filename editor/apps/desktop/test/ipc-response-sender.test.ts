import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BrowserWindow, IpcMainEvent, WebContents } from "electron";
import { CHANNELS } from "../src/shared/ipc-contract";
import { trustIpcRenderer } from "../src/main/ipc/sender";

const electron = vi.hoisted(() => ({
  listeners: new Map<string, Set<(event: IpcMainEvent, payload: unknown) => void>>(),
  windows: [] as unknown[],
  showMessageBox: vi.fn(),
  quit: vi.fn(),
}));
vi.mock("electron", () => ({
  app: { quit: electron.quit },
  BrowserWindow: { getAllWindows: () => electron.windows },
  dialog: { showMessageBox: electron.showMessageBox },
  ipcMain: {
    on: (channel: string, fn: (event: IpcMainEvent, payload: unknown) => void) => {
      const listeners = electron.listeners.get(channel) ?? new Set();
      listeners.add(fn);
      electron.listeners.set(channel, listeners);
    },
    removeListener: (channel: string, fn: (event: IpcMainEvent, payload: unknown) => void) => {
      electron.listeners.get(channel)?.delete(fn);
    },
  },
}));
import { attachUnsavedGuard } from "../src/main/lifecycle";
import { installRendererBridge, teardownRendererBridge } from "../src/main/mcp/renderer-bridge";

function windowRenderer() {
  const mainFrame = { url: "app://openreel/index.html" };
  const send = vi.fn();
  const contents = {
    mainFrame,
    isDestroyed: () => false,
    getURL: () => mainFrame.url,
    send,
  } as unknown as WebContents;
  let onClose: (event: { preventDefault: () => void }) => void = () => {};
  const close = vi.fn();
  const win = {
    webContents: contents,
    isDestroyed: () => false,
    close,
    on: (_event: string, fn: typeof onClose) => { onClose = fn; },
  } as unknown as BrowserWindow;
  const event = { sender: contents, senderFrame: mainFrame } as unknown as IpcMainEvent;
  return { contents, win, event, send, close, requestClose: () => onClose({ preventDefault: vi.fn() }) };
}

function emit(channel: string, event: IpcMainEvent, payload: unknown): void {
  for (const listener of electron.listeners.get(channel) ?? []) listener(event, payload);
}

function untrustedEvents(app: ReturnType<typeof windowRenderer>): IpcMainEvent[] {
  return [
    windowRenderer().event,
    { ...app.event, senderFrame: { url: "app://openreel/index.html" } } as IpcMainEvent,
    { ...app.event, senderFrame: null },
  ];
}

async function flush(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  electron.listeners.clear();
  electron.windows.length = 0;
  electron.showMessageBox.mockReset().mockResolvedValue({ response: 2 });
  electron.quit.mockClear();
});

afterEach(() => {
  teardownRendererBridge();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("lifecycle reply sender checks", () => {
  it("does not treat another renderer or a subframe's false reply as clean", async () => {
    const app = windowRenderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    attachUnsavedGuard(app.win);
    app.requestClose();
    for (const event of untrustedEvents(app)) emit(CHANNELS.lifecycleUnsavedReply, event, false);
    await flush();
    expect(app.close).not.toHaveBeenCalled();
    expect(electron.showMessageBox).not.toHaveBeenCalled();
    emit(CHANNELS.lifecycleUnsavedReply, app.event, false);
    await flush();
    expect(app.close).toHaveBeenCalledOnce();
  });

  it("ignores forged save-success replies until the trusted main frame confirms", async () => {
    const app = windowRenderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    electron.showMessageBox.mockResolvedValue({ response: 0 });
    attachUnsavedGuard(app.win);
    app.requestClose();
    emit(CHANNELS.lifecycleUnsavedReply, app.event, true);
    await flush();
    expect(app.send).toHaveBeenCalledWith(CHANNELS.lifecycleFlush);
    for (const event of untrustedEvents(app)) emit(CHANNELS.lifecycleFlushed, event, true);
    await flush();
    expect(app.close).not.toHaveBeenCalled();
    emit(CHANNELS.lifecycleFlushed, app.event, true);
    await flush();
    expect(app.close).toHaveBeenCalledOnce();
  });

  it("prompts and preserves the open project when the unsaved query times out", async () => {
    const app = windowRenderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    attachUnsavedGuard(app.win);
    app.requestClose();
    await vi.advanceTimersByTimeAsync(1500);
    expect(electron.showMessageBox).toHaveBeenCalledOnce();
    expect(electron.showMessageBox.mock.calls[0][1].title).toBe("Unsaved changes");
    expect(app.close).not.toHaveBeenCalled();
    expect(electron.quit).not.toHaveBeenCalled();
  });

  it("does not discard work when save confirmation times out", async () => {
    const app = windowRenderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    electron.showMessageBox.mockResolvedValueOnce({ response: 0 }).mockResolvedValue({ response: 0 });
    attachUnsavedGuard(app.win);
    app.requestClose();
    emit(CHANNELS.lifecycleUnsavedReply, app.event, true);
    await flush();
    await vi.advanceTimersByTimeAsync(8000);
    expect(electron.showMessageBox).toHaveBeenCalledTimes(2);
    expect(electron.showMessageBox.mock.calls[1][1].title).toBe("Could not save");
    expect(app.close).not.toHaveBeenCalled();
  });
});

describe("MCP response sender checks", () => {
  it("ignores forged responses with a real pending call ID", async () => {
    const app = windowRenderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    electron.windows.push(app.win);
    const provider = installRendererBridge();
    const pending = provider.listTools();
    const completed = vi.fn();
    void pending.then(completed, () => {});
    const request = app.send.mock.calls[0][1] as { callId: string };
    for (const event of untrustedEvents(app)) {
      emit(CHANNELS.mcpResponse, event, { callId: request.callId, ok: true, result: [{ name: "forged" }] });
    }
    await flush();
    expect(completed).not.toHaveBeenCalled();
    emit(CHANNELS.mcpResponse, app.event, { callId: request.callId, ok: true, result: [{ name: "trusted" }] });
    await expect(pending).resolves.toEqual([{ name: "trusted" }]);
  });

  it("rejects another registered window's response for the target window", async () => {
    const app = windowRenderer();
    const other = windowRenderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    trustIpcRenderer(other.contents, "app://openreel/index.html");
    electron.windows.push(app.win, other.win);
    const pending = installRendererBridge().callTool("test", {});
    const completed = vi.fn();
    void pending.then(completed, () => {});
    const request = app.send.mock.calls[0][1] as { callId: string };
    emit(CHANNELS.mcpResponse, other.event, { callId: request.callId, ok: true, result: { forged: true } });
    await flush();
    expect(completed).not.toHaveBeenCalled();
    emit(CHANNELS.mcpResponse, app.event, { callId: request.callId, ok: true, result: { trusted: true } });
    await expect(pending).resolves.toEqual({ trusted: true });
  });
});
