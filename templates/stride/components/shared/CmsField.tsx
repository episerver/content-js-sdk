import type { ReactElement } from 'react';
import { Slot } from './Slot';
import { getContext } from '@optimizely/cms-sdk/react/server';

type FieldAccessor<T> = (content: T) => unknown;

function getFieldPath<T>(accessor: FieldAccessor<T>): string {
  const segments: string[] = [];

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop === 'string') {
        segments.push(prop);
      }
      return new Proxy({}, handler);
    },
  };

  accessor(new Proxy({}, handler) as T);

  return segments.join('.');
}

type CmsFieldProps<T> = {
  /** The content instance to read the field value from. */
  content: T;
  /** Accessor that selects the field on the content, e.g. `c => c.title`. */
  field: FieldAccessor<T>;
  /** When `true`, renders children even if the field value is `null` or `undefined`. Defaults to `false`. */
  alwaysRender?: boolean;
  /** When `true`, checks the current CMS context and annotates the field with live preview attributes. Defaults to `true`. */
  editable?: boolean;
  children: ReactElement;
};

/**
 * Conditionally renders its children based on a content field's value.
 *
 * - Renders nothing if the field is empty, unless `alwaysRender` is `true` or in edit mode.
 * - In edit mode, annotates children with live preview attributes so the CMS editor can target the field.
 *
 * @example
 * ```tsx
 * <CmsField content={page} field={c => c.title}>
 *   <Heading>{page.title}</Heading>
 * </CmsField>
 * ```
 */
export function CmsField<T>({
  content,
  field,
  alwaysRender,
  editable = true,
  children,
}: CmsFieldProps<T>) {
  const value = field(content);
  const editMode = editable && getContext()?.mode === 'edit';

  if (value == null && !editMode && !alwaysRender) {
    return null;
  }

  if (!editMode) {
    return <>{children}</>;
  }

  const fieldPath = getFieldPath(field);

  return <Slot data-epi-edit={fieldPath}>{children}</Slot>;
}

type CmsFieldsProps<T> = {
  /** Accessor that selects the field on the content, e.g. `c => c.title`. */
  field: FieldAccessor<T>;
  /** When `true`, renders children even if the field value is `null` or `undefined`. Defaults to `false`. */
  alwaysRender?: boolean;
  children: ReactElement;
};

/**
 * Creates a `CmsField` component with `content` and `editable` pre-bound.
 *
 * Useful when rendering many fields from the same content to avoid repeating shared props.
 *
 * @param content - The content instance to bind.
 * @param options.editable - When `true`, annotates fields with live preview attributes in edit mode. Defaults to `true`.
 * @returns A React component equivalent to `CmsField` with `content` and `editable` already set.
 *
 * @example
 * ```tsx
 * const CmsField = bindCmsField(page);
 *
 * <CmsField field={m => m.title}>
 *   <Heading>{page.title}</Heading>
 * </CmsField>
 *
 * <CmsField field={m => m.body}>
 *   <RichText value={page.body} />
 * </CmsField>
 * ```
 */
export function bindCmsField<T>(
  content: T,
  { editable = true }: { editable?: boolean } = {},
) {
  function BoundCmsField({ field, alwaysRender, children }: CmsFieldsProps<T>) {
    return (
      <CmsField
        content={content}
        field={field}
        editable={editable}
        alwaysRender={alwaysRender}
      >
        {children}
      </CmsField>
    );
  }
  return BoundCmsField;
}
