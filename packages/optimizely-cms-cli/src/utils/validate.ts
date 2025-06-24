/**
 * Check if the keyName is alphanumeric and does not have a prefix or suffix of special characters or numbers
 * @param key keyName of the content type
 * @returns boolean
 */
export function isKeyInvalid(key: string): boolean {
  return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) || /^_/.test(key);
}
