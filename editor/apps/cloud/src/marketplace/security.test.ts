import { describe, it, expect, vi } from "vitest";
import app from "../index";
import { InMemoryStore } from "./store";

const protectedRoutes = [
  ["POST", "/v1/drafts"],
  ["GET", "/v1/drafts"],
  ["GET", "/v1/drafts/victim-draft"],
  ["PUT", "/v1/drafts/victim-draft"],
  ["POST", "/v1/drafts/victim-draft/validate"],
  ["POST", "/v1/drafts/victim-draft/submit"],
  ["GET", "/v1/me/assets"],
  ["POST", "/v1/me/assets/victim-asset/rollback"],
  ["GET", "/v1/submissions"],
  ["POST", "/v1/submissions/victim-submission/review"],
  ["POST", "/v1/assets/victim-asset/install"],
  ["GET", "/v1/me/library"],
  ["POST", "/v1/events"],
  ["POST", "/templates"],
  ["DELETE", "/templates/victim-template"],
] as const;

const forgedHeaders: Array<Record<string, string>> = [
  {},
  { Authorization: "Bearer victim-user" },
  { "X-User-Id": "victim-user", "X-Creator-Id": "victim-creator", "X-Creator-Handle": "victim", "X-Reviewer-Id": "admin" },
];

describe("cloud authentication is unavailable until server verification is implemented", () => {
  it.each(protectedRoutes)("denies %s %s before touching storage", async (method, path) => {
    for (const environment of [undefined, "production", "development", "test"]) {
      for (const headers of forgedHeaders) {
        const bucket = { get: vi.fn(), put: vi.fn(), delete: vi.fn(), list: vi.fn() };
        const response = await app.request(`http://localhost${path}`, {
          method,
          headers: { "Content-Type": "application/json", ...headers },
          ...(method === "GET" || method === "DELETE" ? {} : { body: JSON.stringify({
            kind: "filter", id: "forged-template", name: "Forged", timeline: {}, decision: "approve", events: [],
          }) }),
        }, { ENVIRONMENT: environment, TEMPLATES_BUCKET: bucket, ASSETS_BUCKET: bucket } as never);
        expect(response.status, `${environment}: ${JSON.stringify(headers)}`).toBe(503);
        expect(await response.json()).toEqual({ error: "authentication_not_configured" });
        expect(bucket.get).not.toHaveBeenCalled();
        expect(bucket.put).not.toHaveBeenCalled();
        expect(bucket.delete).not.toHaveBeenCalled();
        expect(bucket.list).not.toHaveBeenCalled();
      }
    }
  });

  it("blocks highlights before parsing requests or invoking paid AI", async () => {
    for (const environment of [undefined, "production", "development", "test"]) {
      for (const headers of forgedHeaders) {
        for (const body of ["not-json", JSON.stringify({ transcript: [{ text: "Test", start: 0, end: 1 }], energy: [], duration: 1 })]) {
          const ai = { run: vi.fn().mockResolvedValue({ response: '{"highlights":[]}' }) };
          const response = await app.request("/highlights", {
            method: "POST", headers: { "Content-Type": "application/json", ...headers }, body,
          }, { ENVIRONMENT: environment, AI: ai } as never);
          expect(response.status).toBe(503);
          expect(await response.json()).toEqual({ error: "authentication_not_configured" });
          expect(ai.run).not.toHaveBeenCalled();
        }
      }
    }
  });

  it("does not create a draft or credit an export in the in-memory fallback", async () => {
    const draft = vi.spyOn(InMemoryStore.prototype, "putDraft");
    const earning = vi.spyOn(InMemoryStore.prototype, "addEarning");
    const balance = vi.spyOn(InMemoryStore.prototype, "setBalance");
    try {
      for (const path of ["/v1/drafts", "/v1/events"]) {
        const response = await app.request(path, {
          method: "POST", headers: { "Content-Type": "application/json", "X-User-Id": "attacker" },
          body: JSON.stringify({ kind: "filter", events: [{ type: "EXPORT_COMPLETED", user_id: "victim", payload: { export: { gross_cents: 100000 } } }] }),
        }, { ENVIRONMENT: "production" } as never);
        expect(response.status).toBe(503);
      }
      expect(draft).not.toHaveBeenCalled();
      expect(earning).not.toHaveBeenCalled();
      expect(balance).not.toHaveBeenCalled();
    } finally {
      draft.mockRestore(); earning.mockRestore(); balance.mockRestore();
    }
  });
});
