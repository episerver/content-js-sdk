'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type DependencyRule = {
  TargetElement: string | null;
  SatisfiedAction: string | null;
  ConditionCombination: string | null;
  AfterStep?: string | null;
  JumpToStep?: string | null;
  TargetStep?: string | null;
  Conditions: Array<{
    DependsOnField: string | null;
    ComparisonOperator: string | null;
    ComparisonValue: string | null;
  }> | null;
};

export type ElementId = string | string[];

type FormRulesContextType = {
  rules: DependencyRule[];
  fieldValues: Map<string, unknown>;
  setFieldValue: (fieldId: ElementId, value: unknown) => void;
  isElementVisible: (elementId: ElementId) => boolean;
  getJumpTarget: (afterStepKey: ElementId) => string | null;
  isStepVisible: (stepKey: ElementId) => boolean;
};

const toIds = (id: ElementId): string[] => (Array.isArray(id) ? id : [id]);

const FormRulesContext = createContext<FormRulesContextType | undefined>(undefined);

type FormRulesProviderProps = {
  children: ReactNode;
  rules?: DependencyRule[];
};

export function FormRulesProvider({ children, rules = [] }: FormRulesProviderProps) {
  const [fieldValues, setFieldValuesMap] = useState(new Map<string, unknown>());

  const setFieldValue = useCallback((fieldId: ElementId, value: unknown) => {
    const ids = toIds(fieldId);
    if (ids.length === 0) return;

    setFieldValuesMap(prev => {
      const next = new Map(prev);
      ids.forEach(id => next.set(id, value));
      return next;
    });
  }, []);

  const evaluateCondition = (
    condition: { DependsOnField: string | null; ComparisonOperator: string | null; ComparisonValue: string | null },
    values: Map<string, unknown>,
  ): boolean => {
    if (!condition.DependsOnField || !condition.ComparisonValue || !condition.ComparisonOperator) return false;

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
          const regex = new RegExp(compareValue);
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  const isSatisfied = (rule: DependencyRule): boolean => {
    const conditions = rule.Conditions ?? [];
    if (!Array.isArray(conditions) || conditions.length === 0) return true;

    const results = conditions.map(cond => evaluateCondition(cond, fieldValues));

    if (rule.ConditionCombination === 'All') {
      return results.every(r => r);
    }
    return results.some(r => r);
  };

  const findRulesFor = (
    id: ElementId,
    target: (rule: DependencyRule) => string | null | undefined,
  ): DependencyRule[] => {
    const ids = new Set(toIds(id));
    return rules.filter(rule => {
      const name = target(rule);
      return !!name && ids.has(name);
    });
  };

  const resolveVisibility = (applicableRules: DependencyRule[]): boolean => {
    if (applicableRules.length === 0) return true;

    const allHide = applicableRules.filter(r => r.SatisfiedAction === 'Hide' || r.SatisfiedAction === 'HideStep');
    const allShow = applicableRules.filter(r => r.SatisfiedAction === 'Show' || r.SatisfiedAction === 'ShowStep');

    if (allHide.length > 0 && allHide.some(isSatisfied)) return false;
    if (allShow.length > 0 && !allShow.some(isSatisfied)) return false;

    return true;
  };

  const isElementVisible = (elementId: ElementId): boolean =>
    resolveVisibility(findRulesFor(elementId, r => r.TargetElement));

  const getJumpTarget = (afterStepKey: ElementId): string | null =>
    findRulesFor(afterStepKey, r => r.AfterStep)
      .filter(r => r.JumpToStep && isSatisfied(r))
      .map(r => r.JumpToStep!)[0] ?? null;

  const isStepVisible = (stepKey: ElementId): boolean =>
    resolveVisibility(findRulesFor(stepKey, r => r.TargetStep));

  return (
    <FormRulesContext.Provider value={{ rules, fieldValues, setFieldValue, isElementVisible, getJumpTarget, isStepVisible }}>
      {children}
    </FormRulesContext.Provider>
  );
}

// Stable identity so consumers with `setFieldValue`/`isElementVisible` in effect
// deps don't re-run on every render when no provider is present.
const NO_RULES: FormRulesContextType = {
  rules: [],
  fieldValues: new Map(),
  setFieldValue: () => {},
  isElementVisible: () => true,
  getJumpTarget: () => null,
  isStepVisible: () => true,
};

export function useFormRules() {
  return useContext(FormRulesContext) ?? NO_RULES;
}
