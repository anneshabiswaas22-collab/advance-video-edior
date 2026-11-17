import type { Context } from "hono";

/**
 * Protected cloud functionality is unavailable until a server-verified identity
 * provider and authorization policy are implemented. Caller-supplied bearer and
 * X-User/Creator headers are not identity evidence, including in development.
 * Public discovery and explicitly public sharing have separate routes.
 */
export interface Identity {
  userId: string;
  creatorId?: string;
  handle?: string;
}

export function getIdentity(_c: Context): Identity | null {
  return null;
}

function authenticationUnavailable(c: Context): Response {
  return c.json({ error: "authentication_not_configured" }, 503);
}

export function requireUser(c: Context): Identity | Response {
  return authenticationUnavailable(c);
}

export function requireCreator(c: Context): (Identity & { creatorId: string }) | Response {
  return authenticationUnavailable(c);
}

/** Review/publication needs a separate server-verified reviewer permission. */
export function requireReviewer(c: Context): (Identity & { creatorId: string }) | Response {
  return authenticationUnavailable(c);
}

export function isResponse(v: unknown): v is Response {
  return v instanceof Response;
}
