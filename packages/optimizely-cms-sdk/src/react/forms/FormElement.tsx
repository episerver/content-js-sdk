'use client';

import { ReactNode } from 'react';
import { useFormRules } from './FormRulesContext.js';
import { getElementId } from './getElementId.js';

type FormElementProps = {
  content: Record<string, unknown>;
  children: ReactNode;
};

/**
 * Hides its children while a dependency rule targeting this element is hiding it.
 *
 * An element with no id cannot be the target of a rule, so it always renders —
 * hiding it instead would silently blank out any field rendered outside a
 * composition.
 */
export function FormElement({ content, children }: FormElementProps) {
  const { isElementVisible } = useFormRules();
  const elementId = getElementId(content);

  if (elementId && !isElementVisible(elementId)) return null;

  return children;
}
