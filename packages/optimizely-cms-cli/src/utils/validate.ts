/**
 * Check if the keyName is alphanumeric and does not have a prefix or suffix of special characters or numbers
 * @param key keyName of the content type
 * @returns boolean
 */
export function isKeyInvalid(key: string): boolean {
  return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) || /^_/.test(key);
}


/**
 * Validates that a field is a non-empty string.
 * Throws an error with a formatted message if validation fails.
 * 
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated
 * @param context - The context (e.g., "applications", "propertyGroups")
 * @param index - The index of the item in the array
 * @throws {Error} If the value is missing, not a string, or empty after trimming
 */
export function validateRequiredStringField(
  value: unknown,
  fieldName: string,
  context: string,
  index: number
): void {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    // Extract singular form: "applications" -> "Application"
    const singularContext = context.charAt(0).toUpperCase() + context.slice(1, -1);
    throw new Error(
      `Error in ${context}: ${singularContext} at index ${index} has an empty or missing "${fieldName}" field`
    );
  }
}