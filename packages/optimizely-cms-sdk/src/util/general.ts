export function toArray<T>(item: T[] | T): T[] {
  return Array.isArray(item) ? item : [item];
}
