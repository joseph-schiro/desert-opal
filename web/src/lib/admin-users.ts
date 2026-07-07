/**
 * Admin user store — the source of truth for who can log into /admin.
 *
 * Backed by a JSON file (web/data/admin-users.json) so accounts can be managed
 * from the browser at runtime (env vars can't be written). On first run the file
 * is seeded from the ADMIN_USERS env var, so existing config migrates seamlessly;
 * after that, the file is authoritative and the env var is ignored.
 *
 * Passwords are never stored in plaintext — each user has a scrypt salt + hash.
 * Server-only (uses node:fs / node:crypto); never import from a client component.
 */

import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const KEYLEN = 64;
const DATA_FILE = join(process.cwd(), "data", "admin-users.json");
/** Usernames: 2–30 chars, lowercase letters/numbers/dot/underscore/hyphen. */
const USERNAME_RE = /^[a-z0-9._-]{2,30}$/;

interface StoredUser {
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
}

/** Public view of a user (no secrets). */
export interface AdminUserInfo {
  username: string;
  createdAt: string;
}

function seedFromEnv(): StoredUser[] {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const [username, salt, hash] = e.split(":");
      return { username, salt, hash, createdAt: new Date().toISOString() };
    })
    .filter((u) => u.username && u.salt && u.hash);
}

function read(): StoredUser[] {
  if (existsSync(DATA_FILE)) {
    try {
      return JSON.parse(readFileSync(DATA_FILE, "utf8")) as StoredUser[];
    } catch {
      return [];
    }
  }
  // First run: migrate from env and persist.
  const seeded = seedFromEnv();
  write(seeded);
  return seeded;
}

function write(users: StoredUser[]): void {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: scryptSync(password, salt, KEYLEN).toString("hex") };
}

/** List admins (no secrets), newest last. */
export function listUsers(): AdminUserInfo[] {
  return read().map((u) => ({ username: u.username, createdAt: u.createdAt }));
}

/**
 * Verify credentials. Returns the matched username on success, else null.
 * Always runs a hash (even for unknown users) to blunt timing side-channels.
 */
export function authenticate(username: string, password: string): string | null {
  const uname = username.trim().toLowerCase();
  const cred = read().find((u) => u.username.toLowerCase() === uname);

  const salt = cred?.salt ?? "0".repeat(32);
  const derived = scryptSync(password, salt, KEYLEN);
  if (!cred) return null;

  const expected = Buffer.from(cred.hash, "hex");
  if (expected.length === derived.length && timingSafeEqual(expected, derived)) {
    return cred.username;
  }
  return null;
}

/** Create a new admin. Returns an error string, or null on success. */
export function addUser(username: string, password: string): string | null {
  const uname = username.trim().toLowerCase();
  if (!USERNAME_RE.test(uname)) {
    return "Username must be 2–30 characters: letters, numbers, . _ or -";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  const users = read();
  if (users.some((u) => u.username.toLowerCase() === uname)) {
    return "That username already exists.";
  }
  const { salt, hash } = hashPassword(password);
  users.push({ username: uname, salt, hash, createdAt: new Date().toISOString() });
  write(users);
  return null;
}

/** Delete an admin. Refuses to remove the last one (would lock everyone out). */
export function deleteUser(username: string): string | null {
  const uname = username.trim().toLowerCase();
  const users = read();
  if (users.length <= 1) {
    return "Can't delete the last admin — create another account first.";
  }
  const next = users.filter((u) => u.username.toLowerCase() !== uname);
  if (next.length === users.length) return "User not found.";
  write(next);
  return null;
}
