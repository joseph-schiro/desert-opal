/**
 * Generate an ADMIN_USERS entry for the admin login.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs <username>
 *
 * You'll be prompted for a password (hidden). It prints a line like:
 *   joe:<saltHex>:<hashHex>
 * Append it to ADMIN_USERS in web/.env.local (comma-separate multiple users).
 */

import { scryptSync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline";

const KEYLEN = 64;

const username = process.argv[2];
if (!username) {
  console.error("Usage: node scripts/hash-admin-password.mjs <username>");
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const onData = (char) => {
      // Mask keystrokes.
      const s = char.toString();
      if (s === "\n" || s === "\r" || s === "\r\n") process.stdout.write("\n");
      else process.stdout.write("*");
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => {
      process.stdin.off("data", onData);
      rl.close();
      resolve(answer);
    });
  });
}

const password = (await askHidden(`Password for "${username}": `)).trim();
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, KEYLEN).toString("hex");

console.log("\nAdd this to ADMIN_USERS in web/.env.local:\n");
console.log(`${username.toLowerCase()}:${salt}:${hash}`);
