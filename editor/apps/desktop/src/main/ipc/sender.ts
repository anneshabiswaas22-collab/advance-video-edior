import type { IpcMainInvokeEvent, WebContents } from "electron";

type SenderEvent = Pick<IpcMainInvokeEvent, "sender" | "senderFrame">;

// Only windows explicitly created by the main process gain bridge authority.
// A matching URL in another WebContents or a same-origin iframe is insufficient.
const trustedRenderers = new WeakMap<WebContents, string>();

export function trustIpcRenderer(contents: WebContents, appUrl: string): void {
  trustedRenderers.set(contents, appUrl);
}

function matchesRendererUrl(currentUrl: string, expectedUrl: string): boolean {
  try {
    const current = new URL(currentUrl);
    const expected = new URL(expectedUrl);
    if (current.username || current.password || expected.username || expected.password) return false;
    if (current.protocol !== expected.protocol || current.host !== expected.host) return false;
    if (expected.protocol === "app:") return expected.host === "openreel";
    if (expected.protocol === "file:") return current.pathname === expected.pathname;
    // A dev server must be explicitly registered by main, including its port.
    return ["http:", "https:"].includes(expected.protocol)
      && ["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname);
  } catch {
    return false;
  }
}

export function isTrustedIpcSender(event: SenderEvent): boolean {
  const { sender, senderFrame } = event;
  if (sender.isDestroyed() || !senderFrame || senderFrame !== sender.mainFrame) return false;
  const expectedUrl = trustedRenderers.get(sender);
  return !!expectedUrl
    && matchesRendererUrl(senderFrame.url, expectedUrl)
    && matchesRendererUrl(sender.getURL(), expectedUrl);
}

export function assertTrustedIpcSender(event: SenderEvent): void {
  if (!isTrustedIpcSender(event)) throw new Error("[ipc] untrusted sender");
}
