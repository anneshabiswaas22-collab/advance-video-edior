import { net } from "electron";
import { BlockList, isIP } from "node:net";

const DEFAULT_MAX_BYTES = 256 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export interface FetchUrlResult {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly contentType: string;
  readonly body: ArrayBuffer;
  readonly error?: string;
}

function err(message: string, status = 0): FetchUrlResult {
  return { ok: false, status, statusText: message, contentType: "", body: new ArrayBuffer(0), error: message };
}

// Conservative public-unicast policy. BlockList handles IPv6 address expansion;
// textual prefix checks do not correctly classify IPv4-mapped IPv6 addresses.
const blockedV4 = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blockedV4.addSubnet(address, prefix, "ipv4");

const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
const blockedV6 = new BlockList();
for (const [address, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
] as const) blockedV6.addSubnet(address, prefix, "ipv6");

function validateDestination(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (url.username || url.password) throw new Error("URL credentials are not allowed");
  const hostname = url.hostname;
  const host = hostname.startsWith("[") ? hostname.slice(1, -1) : hostname;
  const family = isIP(host);
  // Electron net.fetch cannot pin a validated DNS answer to a connection. A DNS
  // preflight would still permit rebinding between validation and the request.
  // Keep the existing proxy-aware transport, but fail closed on hostnames until
  // a supported pinned transport exists. Local file import is unaffected.
  if (!family) {
    throw new Error("Hostname URL import is disabled until DNS-pinned fetching is available; download the media separately and import the local file");
  }
  const allowed = family === 4
    ? !blockedV4.check(host, "ipv4")
    : globalV6.check(host, "ipv6") && !blockedV6.check(host, "ipv6");
  // Mapped IPv4 addresses are outside 2000::/3, as are loopback, link-local,
  // unique-local, multicast, unspecified and translation-prefix addresses.
  if (!allowed) throw new Error("Refusing to fetch a private or reserved IP address");
}

async function readBoundedBody(response: Response, max: number, abort: AbortController): Promise<ArrayBuffer> {
  const declared = Number(response.headers.get("content-length"));
  if (declared > max) {
    abort.abort();
    throw new Error(`Resource too large: ${declared} bytes (max ${max})`);
  }
  const reader = response.body?.getReader();
  if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        abort.abort();
        throw new Error(`Resource too large: more than ${max} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

export async function fetchUrl(args: { url: string; maxBytes?: number }): Promise<FetchUrlResult> {
  const max = args.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isSafeInteger(max) || max < 1 || max > DEFAULT_MAX_BYTES) {
    return err(`maxBytes must be an integer between 1 and ${DEFAULT_MAX_BYTES}`);
  }
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);
  try {
    let target = new URL(args.url);
    for (let redirects = 0; ; redirects++) {
      validateDestination(target);
      const response = await net.fetch(target.toString(), {
        method: "GET", redirect: "manual", signal: abort.signal,
      });
      if (REDIRECT_STATUSES.has(response.status)) {
        await response.body?.cancel();
        if (redirects >= MAX_REDIRECTS) throw new Error("Too many URL redirects");
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect is missing its location");
        target = new URL(location, target);
        continue;
      }
      const body = await readBoundedBody(response, max, abort);
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type") ?? "",
        body,
      };
    }
  } catch (error) {
    return err(abort.signal.aborted ? "URL fetch aborted (timeout or size limit)" : error instanceof Error ? error.message : "Fetch failed");
  } finally {
    clearTimeout(timeout);
  }
}
