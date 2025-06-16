import { AnyProperty } from '../model/properties';

/**
 * Maximum number of fragments allowed before a warning is issued.
 * Helps avoid excessive fragment depth, which may impact performance or GraphQL limits.
 * Can be overridden via the MAX_FRAGMENT_THRESHOLD environment variable.
 */
const MAX_FRAGMENT_THRESHOLD = (() => {
  const raw = process.env.MAX_FRAGMENT_THRESHOLD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
})();

/**
 * Checks if the `allowedTypes` or `restrictedTypes` of a property are undefined or empty.
 * @param property - The property definition to check.
 * @returns boolean - True if either `allowedTypes` or `restrictedTypes` are undefined or empty.
 */
function arePropertyConstraintsMissing(property: AnyProperty): boolean {
  return (
    property.type === 'content' &&
    (('allowedTypes' in property && !property.allowedTypes?.length) ||
      ('restrictedTypes' in property && !property.restrictedTypes?.length))
  );
}

/**
 * Checks if the `allowedTypes` or `restrictedTypes` of a property's items are undefined or empty.
 * @param property - The property definition to check.
 * @returns boolean - True if either `allowedTypes` or `restrictedTypes` in items are undefined or empty.
 */
function areItemConstraintsMissing(property: AnyProperty): boolean {
  return (
    property.type === 'array' &&
    (('allowedTypes' in property.items &&
      !property.items.allowedTypes?.length) ||
      (property.type === 'array' &&
        'restrictedTypes' in property.items &&
        !property.items.restrictedTypes?.length))
  );
}

/**
 * Checks if a property or its items have missing or incomplete type constraints.
 * Specifically, it validates whether `allowedTypes` or `restrictedTypes` are undefined or empty.
 * @param property - The property definition to check.
 * @param propertyName - The name of the property being processed.
 * @returns string | null - A warning message if type constraints are missing or incomplete, otherwise null.
 */
export function checkTypeConstraintIssues(
  rootName: string,
  property: AnyProperty,
  result: {
    fields: string[];
    extraFragments: string[];
  }
): string | null {
  if (
    arePropertyConstraintsMissing(property) ||
    areItemConstraintsMissing(property) ||
    result.extraFragments.length > MAX_FRAGMENT_THRESHOLD
  ) {
    return (
      `\x1b[33m⚠️ [optimizely-cms-sdk] Fragment "${rootName}" generated ${result.extraFragments.length} inner fragments (limit: ${MAX_FRAGMENT_THRESHOLD}). Excessive fragment depth may breach GraphQL limits or degrade performance.\x1b[0m\n` +
      `\x1b[2m→ Consider narrowing it using \x1b[1mallowedTypes\x1b[22m and \x1b[1mrestrictedTypes\x1b[22m or reviewing \x1b[1mschema references\x1b[22m to reduce complexity.\x1b[0m`
    );
  }

  return null;
}
