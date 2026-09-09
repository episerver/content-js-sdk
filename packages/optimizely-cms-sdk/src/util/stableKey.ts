/** Generates a unique id for inline array content items with no CMS identity; used to build `_opuid`. */
export function stableKey(item: unknown): string {
  const str = JSON.stringify(item, (key, value) =>
    key.startsWith('__') ? undefined : value,
  );
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
