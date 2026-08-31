import { createHash, randomBytes } from "node:crypto";

/**
 * A visitor session is `sha256(daySalt + ip + userAgent)`. The salt lives only in
 * process memory and rotates every UTC day, so the stored hash cannot be reversed
 * into a visitor identity after the day ends and cannot be joined across days.
 */
const salts = new Map<string, string>();

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function saltFor(now: Date): string {
  const key = dayKey(now);
  let salt = salts.get(key);
  if (!salt) {
    salt = randomBytes(16).toString("hex");
    salts.clear(); // keep exactly one live day salt
    salts.set(key, salt);
  }
  return salt;
}

export function sessionHash(ip: string, userAgent: string, now: Date = new Date()): string {
  return createHash("sha256")
    .update(`${saltFor(now)}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}
