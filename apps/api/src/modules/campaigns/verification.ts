import { resolveTxt } from "node:dns/promises";
import type { VerificationMethod } from "@repo/contracts";

export const VERIFY_PREFIX = "adstukar-verify=";
const FETCH_TIMEOUT_MS = 5000;

/** True when any line of the body equals `adstukar-verify=<token>` (whitespace tolerant). */
export function bodyContainsToken(body: string, token: string): boolean {
  const want = `${VERIFY_PREFIX}${token}`;
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === want);
}

/** True when any TXT record (chunks joined) equals `adstukar-verify=<token>`. */
export function txtContainsToken(records: string[][], token: string): boolean {
  const want = `${VERIFY_PREFIX}${token}`;
  return records.some((chunks) => chunks.join("").trim() === want);
}

export async function verifyByWellKnown(domain: string, token: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://${domain}/.well-known/adstukar.txt`, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "AdsTukar-Verifier/1.0" },
    });
    if (!res.ok) return false;
    const body = (await res.text()).slice(0, 4096);
    return bodyContainsToken(body, token);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyByDns(domain: string, token: string): Promise<boolean> {
  try {
    const records = await resolveTxt(domain);
    return txtContainsToken(records, token);
  } catch {
    return false;
  }
}

export interface VerificationResult {
  verified: boolean;
  method: VerificationMethod | null;
  message: string;
}

export async function verifyDomain(domain: string, token: string): Promise<VerificationResult> {
  if (await verifyByWellKnown(domain, token)) {
    return {
      verified: true,
      method: "well-known",
      message: "Verified via /.well-known/adstukar.txt",
    };
  }
  if (await verifyByDns(domain, token)) {
    return { verified: true, method: "dns", message: "Verified via DNS TXT record" };
  }
  return {
    verified: false,
    method: null,
    message: `Token not found. Publish "${VERIFY_PREFIX}${token}" at https://${domain}/.well-known/adstukar.txt or as a DNS TXT record on ${domain}.`,
  };
}
