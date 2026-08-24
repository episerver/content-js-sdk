'use client';

import { ReactNode } from 'react';
import { useFormRules } from './FormRulesContext.js';
import { getElementId } from './getElementId.js';

type FormElementProps = {
  content: Record<string, unknown> & { __context?: { edit?: boolean } };
  children: ReactNode;
};

/**
 * Hides its children while a dependency rule targeting this element is hiding it.
 *
 * An element with no id cannot be the target of a rule, so it always renders —
 * hiding it instead would silently blank out any field rendered outside a
 * composition.
 *
 * While editing, a hidden field is rendered anyway. A dependency rule describes
 * what a visitor sees, and an editor still has to be able to find and select the
 * field to change it. Returning nothing left an empty, selectable block in the
 * CMS with no indication of what it was.
 */
export function FormElement({ content, children }: FormElementProps) {
  const { isElementVisible } = useFormRules();
  const elementId = getElementId(content);

  if (content.__context?.edit) return children;
  if (elementId && !isElementVisible(elementId)) return null;

  return children;
}
