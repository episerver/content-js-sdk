/**
 * Canonical JSON + digest8 — contracts.md §2.
 * digest8 = first 8 base64url chars of SHA-256(canonical-JSON(mutation args)).
 * Server-only (node:crypto).
 */
import { createHash } from 'node:crypto';

/** Deterministic JSON: object keys sorted recursively, undefined values dropped. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortValue(v);
    }
    return out;
  }
  return value;
}

/** First 8 base64url chars of SHA-256 over canonical JSON. */
export function digest8(args: unknown): string {
  return createHash('sha256').update(canonicalJson(args)).digest('base64url').slice(0, 8);
}
