import { describe, it, expect } from "vitest";
import app from "../index";

const env = { ENVIRONMENT: "test" } as never;

// Successful authoring with forged caller headers is intentionally no longer an
// API contract. The exact former workflow is preserved in security-recovery;
// security.test.ts asserts denial on every protected route and no storage writes.
describe("public marketplace discovery", () => {
  it("lists real blueprints and the selected ABI node library without identity", async () => {
    const blueprints = await app.request("/v1/blueprints", undefined, env);
    expect(blueprints.status).toBe(200);
    const body = await blueprints.json() as { blueprints: Array<{ id: string }> };
    expect(body.blueprints.map((b) => b.id)).toContain("fire-aura.v1");
    const nodes = await app.request("/v1/nodelib?abi=1.0", undefined, env);
    expect(nodes.status).toBe(200);
    const library = await nodes.json() as { nodes: Array<{ id: string }> };
    expect(library.nodes.some((n) => n.id === "Source")).toBe(true);
    expect(library.nodes.some((n) => n.id === "Depth")).toBe(false);
  });

  it.each(["/v1/assets?sort=new", "/v1/search?q=missing", "/v1/creators/missing"])(
    "keeps public discovery at %s available without identity", async (path) => {
      const response = await app.request(path, undefined, env);
      expect(response.status).toBe(200);
      expect((await response.json() as { assets: unknown[] }).assets).toEqual([]);
    },
  );

  it("returns published catalog metadata from the existing durable read path", async () => {
    const documents: Record<string, unknown> = {
      "index/assets.json": ["asset-1"],
      "assets/asset-1.json": { id: "asset-1", creatorId: "creator-1", slug: "published-filter", kind: "filter", createdAt: "2026-01-01" },
      "versions/asset-1/1.json": { id: "version-1", assetId: "asset-1", version: 1, reviewState: "published", manifest: { title: "Published Filter" } },
      "index/versions/asset-1.json": [1],
    };
    const bucket = { get: async (key: string) => key in documents ? { json: async () => documents[key] } : null };
    const response = await app.request("/v1/assets?sort=new", undefined, { ENVIRONMENT: "production", ASSETS_BUCKET: bucket } as never);
    expect(response.status).toBe(200);
    const body = await response.json() as { assets: Array<{ id: string; title: string }> };
    expect(body.assets).toEqual([expect.objectContaining({ id: "asset-1", title: "Published Filter" })]);
  });

  it("keeps the public template catalog readable", async () => {
    const bucket = {
      list: async () => ({ objects: [{ key: "sample.json" }], truncated: false }),
      get: async () => ({ json: async () => ({ name: "Sample", timeline: { duration: 5 } }) }),
    };
    const response = await app.request("/templates", undefined, { TEMPLATES_BUCKET: bucket } as never);
    expect(response.status).toBe(200);
    expect((await response.json() as { templates: Array<{ id: string; name: string }> }).templates)
      .toEqual([expect.objectContaining({ id: "sample", name: "Sample" })]);
  });
});
