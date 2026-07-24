import { AnyProperty } from '../model/properties.js';
import { DEFAULT_MAX_FRAGMENT_THRESHOLD } from '../graph/constants.js';
import { GraphFragmentThresholdError } from '../graph/error.js';

function arePropertyConstraintsMissing(property: AnyProperty): boolean {
  return (
    property.type === 'content' &&
    !(
      ('allowedTypes' in property && property.allowedTypes?.length) ||
      ('restrictedTypes' in property && property.restrictedTypes?.length)
    )
  );
}

function areItemConstraintsMissing(property: AnyProperty): boolean {
  return (
    property.type === 'array' &&
    !(
      ('allowedTypes' in property.items && property.items.allowedTypes?.length) ||
      ('restrictedTypes' in property.items && property.items.restrictedTypes?.length)
    )
  );
}

/**
 * Throws if a content property has no type constraints and generated fragments exceed the threshold.
 */
export function checkTypeConstraintIssues(
  rootName: string,
  property: AnyProperty,
  result: {
    fields: string[];
    extraFragments: string[];
  },
  maxFragmentThreshold: number = DEFAULT_MAX_FRAGMENT_THRESHOLD,
): void {
  if (
    (arePropertyConstraintsMissing(property) || areItemConstraintsMissing(property)) &&
    result.extraFragments.length > maxFragmentThreshold
  ) {
    throw new GraphFragmentThresholdError(
      rootName,
      result.extraFragments.length,
      maxFragmentThreshold,
    );
  }
}
