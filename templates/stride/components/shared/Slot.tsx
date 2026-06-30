'use client';

import { cloneElement, Fragment, isValidElement, type ReactNode } from 'react';

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

function mergeAttributes(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
) {
  const merged: Record<string, unknown> = { ...slotProps, ...childProps };

  if (slotProps.className || childProps.className) {
    merged.className = [slotProps.className, childProps.className]
      .filter(Boolean)
      .join(' ');
  }

  if (slotProps.style || childProps.style) {
    merged.style = {
      ...(slotProps.style as object),
      ...(childProps.style as object),
    };
  }

  return merged;
}

export function Slot({ children, ...attributes }: SlotProps) {
  if (!isValidElement(children)) {
    return null;
  }

  if (children.type === Fragment) {
    return (
      <div {...attributes}>
        {(children.props as Record<string, unknown>).children as ReactNode}
      </div>
    );
  }

  const { children: grandChildren, ...childProps } = children.props as Record<
    string,
    unknown
  >;

  const merged = mergeAttributes(attributes, childProps);

  return cloneElement(children, merged, grandChildren as ReactNode);
}
