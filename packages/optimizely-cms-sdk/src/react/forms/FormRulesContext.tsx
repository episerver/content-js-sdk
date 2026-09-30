'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import {
  getJumpTarget,
  isElementVisible,
  isStepVisible,
  type DependencyRule,
  type ElementId,
} from '../../core/forms/rules.js';
import { toArray } from '../../util/general.js';

export type { DependencyRule, ElementId };

type FormRulesContextType = {
  rules: DependencyRule[];
  fieldValues: Map<string, unknown>;
  setFieldValue: (fieldId: ElementId, value: unknown) => void;
  isElementVisible: (elementId: ElementId) => boolean;
  getJumpTarget: (afterStepKey: ElementId) => string | null;
  isStepVisible: (stepKey: ElementId) => boolean;
};

const FormRulesContext = createContext<FormRulesContextType | undefined>(undefined);

type FormRulesProviderProps = {
  children: ReactNode;
  rules?: DependencyRule[];
};

// A stable default, so the memoised context value survives a render without rules
const NO_RULES_ARRAY: DependencyRule[] = [];

export function FormRulesProvider({ children, rules = NO_RULES_ARRAY }: FormRulesProviderProps) {
  const [fieldValues, setFieldValuesMap] = useState(() => new Map<string, unknown>());

  const setFieldValue = useCallback((fieldId: ElementId, value: unknown) => {
    const ids = toArray(fieldId);
    if (ids.length === 0) return;

    // Unchanged values would otherwise publish a new Map on every field mount.
    setFieldValuesMap(prev => {
      if (ids.every(id => prev.get(id) === value)) return prev;

      const next = new Map(prev);
      ids.forEach(id => next.set(id, value));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      rules,
      fieldValues,
      setFieldValue,
      isElementVisible: (elementId: ElementId) =>
        isElementVisible(rules, fieldValues, elementId),
      getJumpTarget: (afterStepKey: ElementId) =>
        getJumpTarget(rules, fieldValues, afterStepKey),
      isStepVisible: (stepKey: ElementId) => isStepVisible(rules, fieldValues, stepKey),
    }),
    [rules, fieldValues, setFieldValue],
  );

  return <FormRulesContext.Provider value={value}>{children}</FormRulesContext.Provider>;
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
