/**
 * Evaluation of Optimizely Forms dependency rules: the conditions under which an
 * element or a step is shown or hidden, and where a step jumps to.
 *
 * Pure functions over a rule set and the form's current values.
 *
 * @module
 */

import { toArray } from '../../util/general.js';

export type DependencyCondition = {
  DependsOnField: string | null;
  ComparisonOperator: string | null;
  ComparisonValue: string | null;
};

export type DependencyRule = {
  TargetElement: string | null;
  SatisfiedAction: string | null;
  ConditionCombination: string | null;
  AfterStep?: string | null;
  JumpToStep?: string | null;
  TargetStep?: string | null;
  Conditions: DependencyCondition[] | null;
};

/** One identifier, or every identifier an element is known by. */
export type ElementId = string | string[];

export function evaluateCondition(
  condition: DependencyCondition,
  values: Map<string, unknown>,
): boolean {
  if (!condition.DependsOnField || !condition.ComparisonValue || !condition.ComparisonOperator)
    return false;

  const fieldValue = values.get(condition.DependsOnField);
  const compareValue = condition.ComparisonValue;
  const operator = condition.ComparisonOperator;

  switch (operator) {
    case 'Equals':
      return fieldValue === compareValue;
    case 'NotEquals':
      return fieldValue !== compareValue;
    case 'Contains':
      return String(fieldValue).includes(compareValue);
    case 'NotContains':
      return !String(fieldValue).includes(compareValue);
    case 'StartsWith':
      return String(fieldValue).startsWith(compareValue);
    case 'EndsWith':
      return String(fieldValue).endsWith(compareValue);
    case 'MatchRegularExpression':
      try {
        return new RegExp(compareValue).test(String(fieldValue));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/** A rule with no conditions is always satisfied. */
export function isRuleSatisfied(rule: DependencyRule, values: Map<string, unknown>): boolean {
  const conditions = rule.Conditions;
  // Rules arrive untyped from the CMS, so anything but a non-empty array counts as none
  if (!Array.isArray(conditions) || conditions.length === 0) return true;

  const results = conditions.map(condition => evaluateCondition(condition, values));

  return rule.ConditionCombination === 'All' ?
      results.every(Boolean)
    : results.some(Boolean);
}

/** The rules whose `target` field names any of `id`. */
const findRulesFor = (
  rules: DependencyRule[],
  id: ElementId,
  target: (rule: DependencyRule) => string | null | undefined,
): DependencyRule[] => {
  const ids = new Set(toArray(id));
  return rules.filter(rule => {
    const name = target(rule);
    return !!name && ids.has(name);
  });
};

/** A satisfied Hide wins over everything; a Show that is not satisfied hides. */
const resolveVisibility = (
  applicableRules: DependencyRule[],
  values: Map<string, unknown>,
): boolean => {
  const satisfied = (rule: DependencyRule) => isRuleSatisfied(rule, values);
  const hideRules = applicableRules.filter(
    rule => rule.SatisfiedAction === 'Hide' || rule.SatisfiedAction === 'HideStep',
  );
  const showRules = applicableRules.filter(
    rule => rule.SatisfiedAction === 'Show' || rule.SatisfiedAction === 'ShowStep',
  );

  return !hideRules.some(satisfied) && (showRules.length === 0 || showRules.some(satisfied));
};

/** Decides whether an element is visible under the current values. Untargeted elements are. */
export const isElementVisible = (
  rules: DependencyRule[],
  values: Map<string, unknown>,
  elementId: ElementId,
): boolean => resolveVisibility(findRulesFor(rules, elementId, rule => rule.TargetElement), values);

/** Decides whether a step is visible under the current values. Untargeted steps are. */
export const isStepVisible = (
  rules: DependencyRule[],
  values: Map<string, unknown>,
  stepId: ElementId,
): boolean => resolveVisibility(findRulesFor(rules, stepId, rule => rule.TargetStep), values);

/** The key of the step a satisfied rule jumps to after `stepId`, or `null` to carry on in order. */
export const getJumpTarget = (
  rules: DependencyRule[],
  values: Map<string, unknown>,
  stepId: ElementId,
): string | null =>
  findRulesFor(rules, stepId, rule => rule.AfterStep).find(
    rule => rule.JumpToStep && isRuleSatisfied(rule, values),
  )?.JumpToStep ?? null;
