import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IpcMainInvokeEvent, WebContents } from "electron";
import { z } from "zod";
import { assertTrustedIpcSender, isTrustedIpcSender, trustIpcRenderer } from "../src/main/ipc/sender";

const { handlers } = vi.hoisted(() => ({ handlers: new Map<string, (event: IpcMainInvokeEvent, raw: unknown) => Promise<unknown>>() }));
vi.mock("electron", () => ({ ipcMain: { handle: (channel: string, fn: (event: IpcMainInvokeEvent, raw: unknown) => Promise<unknown>) => handlers.set(channel, fn) } }));
import { handle } from "../src/main/ipc";

function renderer(url = "app://openreel/index.html") {
  const frame = { url };
  const state = { destroyed: false, url };
  const contents = {
    mainFrame: frame,
    isDestroyed: () => state.destroyed,
    getURL: () => state.url,
  } as unknown as WebContents;
  const event = { sender: contents, senderFrame: frame } as unknown as IpcMainInvokeEvent;
  return { frame, state, contents, event };
}

describe("desktop IPC sender authority", () => {
  beforeEach(() => handlers.clear());

  it("accepts the registered app window's live main frame and SPA routes", () => {
    const app = renderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    expect(isTrustedIpcSender(app.event)).toBe(true);
    app.frame.url = app.state.url = "app://openreel/motion#project";
    expect(isTrustedIpcSender(app.event)).toBe(true);
  });

  it("does not grant authority from a matching URL or a different WebContents", () => {
    const app = renderer();
    const foreign = renderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    expect(isTrustedIpcSender(foreign.event)).toBe(false);
    expect(() => assertTrustedIpcSender(foreign.event)).toThrow("untrusted sender");
  });

  it("rejects same-origin subframes and detached frames", () => {
    const app = renderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    expect(isTrustedIpcSender({ ...app.event, senderFrame: { url: app.frame.url } } as IpcMainInvokeEvent)).toBe(false);
    expect(isTrustedIpcSender({ ...app.event, senderFrame: null })).toBe(false);
  });

  it.each([
    "https://evil.example/index.html", "app://other/index.html", "file:///etc/passwd",
    "app://attacker@openreel/index.html", "javascript:alert(1)", "not a URL",
  ])("rejects registered renderer navigation to %s", (url) => {
    const app = renderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    app.frame.url = app.state.url = url;
    expect(isTrustedIpcSender(app.event)).toBe(false);
  });

  it("rejects a destroyed renderer and mismatched main-frame navigation state", () => {
    const app = renderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    app.state.destroyed = true;
    expect(isTrustedIpcSender(app.event)).toBe(false);
    app.state.destroyed = false;
    app.state.url = "https://evil.example";
    expect(isTrustedIpcSender(app.event)).toBe(false);
  });

  it("allows an explicitly registered localhost dev origin only at its exact port", () => {
    const app = renderer("http://localhost:5173/editor");
    trustIpcRenderer(app.contents, "http://localhost:5173/");
    expect(isTrustedIpcSender(app.event)).toBe(true);
    app.frame.url = app.state.url = "http://localhost:5174/";
    expect(isTrustedIpcSender(app.event)).toBe(false);
  });

  it("allows an explicitly registered file entry only at its exact path", () => {
    const app = renderer("file:///app/index.html#editor");
    trustIpcRenderer(app.contents, "file:///app/index.html");
    expect(isTrustedIpcSender(app.event)).toBe(true);
    app.frame.url = app.state.url = "file:///tmp/untrusted.html";
    expect(isTrustedIpcSender(app.event)).toBe(false);
  });

  it("does not trust registration of an arbitrary remote origin", () => {
    const app = renderer("https://evil.example/");
    trustIpcRenderer(app.contents, "https://evil.example/");
    expect(isTrustedIpcSender(app.event)).toBe(false);
  });

  it("rejects unauthorized calls before parsing payloads or invoking privileged work", async () => {
    const app = renderer();
    trustIpcRenderer(app.contents, "app://openreel/index.html");
    const privileged = vi.fn((args: { path: string }) => args.path);
    handle("test:privileged", z.object({ path: z.string() }), privileged);
    const invoke = handlers.get("test:privileged")!;
    await expect(invoke(renderer().event, { path: "/owner/private.txt" })).rejects.toThrow("untrusted sender");
    expect(privileged).not.toHaveBeenCalled();
    await expect(invoke(app.event, { path: 1 })).rejects.toThrow("invalid payload");
    expect(privileged).not.toHaveBeenCalled();
    await expect(invoke(app.event, { path: "/chosen/project.txt" })).resolves.toBe("/chosen/project.txt");
    expect(privileged).toHaveBeenCalledOnce();
  });
});
