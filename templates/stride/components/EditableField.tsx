import { getContext } from '@optimizely/cms-sdk/react/server';
import type { ReactNode } from 'react';

type Value = unknown | null | undefined;

type EditableFieldProps = {
  field: Value | Value[];
  children: ReactNode;
};

export default function EditableField({ field: value, children }: EditableFieldProps) {
  const context = getContext();
  const editMode = false; // context?.mode === 'edit'; // Do not evaluate edit mode since we do not highligt fields yet.

  if (!editMode && !hasValue(value)) return null;
  return children;
}

function hasValue(value: Value | Value[]): boolean {
  if (Array.isArray(value)) return value.some(hasValue);
  return value != null;
}

