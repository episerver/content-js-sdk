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
 * Generates a warning message if type configuration is missing or incomplete.
 * @param property - The property definition to check.
 * @param propertyName - The name of the property being processed.
 * @param rootName - The root content type name used for tracing and warning messages.
 */
export function checkTypeConstraintIssues(
  rootName: string,
  property: AnyProperty,
  result: {
    fields: string[];
    extraFragments: string[];
  }
) {
  if (
    (result.extraFragments.length > MAX_FRAGMENT_THRESHOLD &&
      property.type === 'content' &&
      (!property.allowedTypes?.length || !property.restrictedTypes?.length)) ||
    (property.type === 'array' &&
      ((property.items.type === 'content' &&
        !property.items.allowedTypes?.length &&
        'allowedTypes' in property.items) ||
        ('restrictedTypes' in property.items &&
          !property.items.restrictedTypes?.length &&
          'restrictedTypes' in property.items)))
  ) {
    console.warn(
      `\x1b[33m⚠️ [optimizely-cms-sdk] Fragment "${rootName}" generated ${result.extraFragments.length} inner fragments (limit: ${MAX_FRAGMENT_THRESHOLD}). Excessive fragment depth may breach GraphQL limits or degrade performance.\x1b[0m\n` +
        `\x1b[2m→ Consider narrowing it using \x1b[1mallowedTypes\x1b[22m and \x1b[1mrestrictedTypes\x1b[22m or reviewing \x1b[1mschema references\x1b[22m to reduce complexity.\x1b[0m`
    );
  }
}
