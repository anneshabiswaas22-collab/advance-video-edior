import type { Context } from "hono";

/**
 * A principal must be established by trusted server authentication middleware.
 * Request headers and environment names are not proof of identity. There is
 * deliberately no header-based development bypass in the deployed application.
 * Until a real verifier populates this context, authenticated routes fail closed.
 */
export interface Identity {
  userId: string;
  creatorId?: string;
  handle?: string;
}

export function getIdentity(c: Context): Identity | null {
  const principal: unknown = c.get("verifiedIdentity");
  if (!principal || typeof principal !== "object") return null;
  const { userId, creatorId, handle } = principal as Partial<Identity>;
  if (typeof userId !== "string" || !userId.trim()) return null;
  return {
    userId,
    creatorId: typeof creatorId === "string" && creatorId.trim() ? creatorId : undefined,
    handle: typeof handle === "string" && handle.trim() ? handle : undefined,
  };
}

export function requireUser(c: Context): Identity | Response {
  const id = getIdentity(c);
  if (!id) return c.json({ error: "unauthorized" }, 401);
  return id;
}

export function requireCreator(c: Context): (Identity & { creatorId: string }) | Response {
  const id = getIdentity(c);
  if (!id || !id.creatorId) return c.json({ error: "creator_required" }, 401);
  return { ...id, creatorId: id.creatorId };
}

export function isResponse(v: unknown): v is Response {
  return v instanceof Response;
}
