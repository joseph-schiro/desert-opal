/**
 * Newsletter subscriber store — a simple JSON file (web/data/newsletter.json)
 * so signups work immediately without an email-marketing integration. Later this
 * can be synced to Shopify customers / an email tool. Server-only (node:fs).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHmac } from "node:crypto";

const FILE = join(process.cwd(), "data", "newsletter.json");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Subscriber {
  email: string;
  subscribedAt: string;
}

function read(): Subscriber[] {
  if (!existsSync(FILE)) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Subscriber[];
  } catch {
    return [];
  }
}

function write(subs: Subscriber[]): void {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(subs, null, 2), "utf8");
}

/** Add a subscriber. Returns an error string, or null on success. Idempotent. */
export function addSubscriber(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return "Please enter a valid email address.";
  const subs = read();
  if (subs.some((s) => s.email === e)) return null; // already subscribed — treat as success
  subs.push({ email: e, subscribedAt: new Date().toISOString() });
  write(subs);
  return null;
}

export function listSubscribers(): Subscriber[] {
  return read();
}

/** Remove a subscriber (used by the unsubscribe link). */
export function removeSubscriber(email: string): void {
  const e = email.trim().toLowerCase();
  const subs = read();
  const next = subs.filter((s) => s.email !== e);
  if (next.length !== subs.length) write(next);
}

/** Signed token so unsubscribe links can't be forged. Signed with SESSION_SECRET. */
export function unsubscribeToken(email: string): string {
  const secret = process.env.SESSION_SECRET ?? "desertopal";
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url");
}

export function verifyUnsubscribe(email: string, token: string): boolean {
  return Boolean(token) && token === unsubscribeToken(email);
}
