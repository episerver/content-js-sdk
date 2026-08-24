'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type DependencyRule = {
  TargetElement: string | null;
  SatisfiedAction: string | null;
  ConditionCombination: string | null;
  Conditions: Array<{
    DependsOnField: string | null;
    ComparisonOperator: string | null;
    ComparisonValue: string | null;
  }> | null;
};

type FormRulesContextType = {
  rules: DependencyRule[];
  fieldValues: Map<string, unknown>;
  setFieldValue: (fieldId: string, value: unknown) => void;
  isElementVisible: (elementId: string) => boolean;
};

const FormRulesContext = createContext<FormRulesContextType | undefined>(undefined);

type FormRulesProviderProps = {
  children: ReactNode;
  rules?: DependencyRule[];
};

export function FormRulesProvider({ children, rules = [] }: FormRulesProviderProps) {
  const [fieldValues, setFieldValuesMap] = useState(new Map<string, unknown>());

  const setFieldValue = useCallback((fieldId: string, value: unknown) => {
    setFieldValuesMap(prev => new Map(prev).set(fieldId, value));
  }, []);

  const evaluateCondition = (
    condition: { DependsOnField: string | null; ComparisonOperator: string | null; ComparisonValue: string | null },
    values: Map<string, unknown>,
  ): boolean => {
    if (!condition.DependsOnField || !condition.ComparisonValue || !condition.ComparisonOperator) return false;

    const fieldValue = values.get(condition.DependsOnField);
    const compareValue = condition.ComparisonValue;

    switch (condition.ComparisonOperator) {
      case 'Equals':
        return fieldValue === compareValue;
      case 'NotEquals':
        return fieldValue !== compareValue;
      case 'Contains':
        return String(fieldValue).includes(compareValue);
      case 'NotContains':
        return !String(fieldValue).includes(compareValue);
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

  const isElementVisible = (elementId: string): boolean => {
    const applicableRules = rules.filter(r => r.TargetElement === elementId);
    if (applicableRules.length === 0) return true;

    const allHide = applicableRules.filter(r => r.SatisfiedAction === 'Hide');
    const allShow = applicableRules.filter(r => r.SatisfiedAction === 'Show');

    if (allHide.length > 0 && allHide.some(isSatisfied)) return false;
    if (allShow.length > 0 && !allShow.some(isSatisfied)) return false;

    return true;
  };

  return (
    <FormRulesContext.Provider value={{ rules, fieldValues, setFieldValue, isElementVisible }}>
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
};

export function useFormRules() {
  return useContext(FormRulesContext) ?? NO_RULES;
}
