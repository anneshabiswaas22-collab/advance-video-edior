import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import app from "../index";
import { getIdentity, requireCreator, isResponse } from "./auth";

const spoofedHeaders = {
  Authorization: "Bearer invented-user",
  "X-User-Id": "invented-user",
  "X-Creator-Id": "invented-creator",
  "X-Creator-Handle": "invented-handle",
  "Content-Type": "application/json",
};

describe("cloud authentication boundary", () => {
  it.each(["production", "development", "test"])(
    "does not trust caller identity headers in %s",
    async (environment) => {
      const response = await app.request("/v1/drafts", {
        method: "POST", headers: spoofedHeaders, body: JSON.stringify({ kind: "filter" }),
      }, { ENVIRONMENT: environment } as never);
      expect(response.status).toBe(401);
    },
  );

  it.each([
    ["POST", "/templates"], ["DELETE", "/templates/custom"],
    ["POST", "/shares"], ["POST", "/highlights"], ["POST", "/crash"],
    ["POST", "/v1/events"], ["POST", "/v1/assets/asset/install"],
    ["POST", "/v1/submissions/submission/review"],
  ])("denies unverified %s %s before touching storage or AI", async (method, path) => {
    const response = await app.request(path, {
      method, headers: spoofedHeaders, body: "{}",
    }, { ENVIRONMENT: "production" } as never);
    expect(response.status).toBe(401);
  });

  it("protects authenticated reads from spoofed headers", async () => {
    const response = await app.request("/v1/me/library", { headers: spoofedHeaders }, {} as never);
    expect(response.status).toBe(401);
  });

  it("keeps public discovery available without identity", async () => {
    const response = await app.request("/v1/blueprints", undefined, {} as never);
    expect(response.status).toBe(200);
  });

  it("accepts a server-verified principal without inventing creator permission", async () => {
    const test = new Hono();
    test.use("*", async (c, next) => {
      c.set("verifiedIdentity", { userId: "verified-user" });
      await next();
    });
    test.get("/", (c) => {
      expect(getIdentity(c)).toEqual({ userId: "verified-user", creatorId: undefined, handle: undefined });
      const identity = requireCreator(c);
      return isResponse(identity) ? identity : c.json(identity);
    });
    expect((await test.request("/")).status).toBe(401);
  });

  it.each([null, {}, { userId: " " }, { userId: 42 }])(
    "rejects malformed server principals: %j", async (principal) => {
      const test = new Hono();
      test.get("/", (c) => {
        c.set("verifiedIdentity", principal);
        return c.json({ identity: getIdentity(c) });
      });
      expect(await (await test.request("/")).json()).toEqual({ identity: null });
    },
  );
});
