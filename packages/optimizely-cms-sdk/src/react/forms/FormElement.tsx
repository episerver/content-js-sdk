'use client';

import { ReactNode } from 'react';
import { useFormRules } from './FormRulesContext.js';
import { getElementId } from './getElementId.js';

type FormElementProps = {
  content: Record<string, unknown>;
  children: ReactNode;
};

export function FormElement({ content, children }: FormElementProps) {
  const { isElementVisible } = useFormRules();
  const elementId = getElementId(content);

  if (!elementId || !isElementVisible(elementId)) return null;

  return children;
}
