/**
 * Stateless admin sessions: a small JSON payload ({ username, exp }) signed with
 * HMAC-SHA256 using SESSION_SECRET, stored in an httpOnly cookie. No database —
 * the signature is what makes the cookie tamper-proof. Verified in `proxy.ts`
 * (Node runtime) and the data-access layer.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
/** Sessions last 7 days. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface SessionPayload {
  username: string;
  /** Expiry, epoch seconds. */
  exp: number;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64url");

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Create a signed session token for a username. */
export function createSessionToken(
  username: string,
  maxAgeSeconds = SESSION_MAX_AGE
): string {
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/** Verify a token; returns the username if valid & unexpired, else null. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  // Constant-time signature comparison.
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (!payload.username || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.username;
  } catch {
    return null;
  }
}
