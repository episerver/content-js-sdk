/**
 * Framework-agnostic core for the design-system (Storybook-like) viewer.
 *
 * Nothing here depends on React — it operates purely on the SDK's content-type
 * and display-template registries, so any renderer (React, Vue, Svelte, plain
 * HTML, an API) can build a component catalog on top of it. React-specific UI
 * lives in `../react/designSystem`.
 */
import {
  getContentType,
  getContentTypeByBaseType,
} from '../model/contentTypeRegistry.js';
import { getAllDisplayTemplates } from '../model/displayTemplateRegistry.js';
import type { DisplayTemplate } from '../model/displayTemplates.js';
import type { AnyContentType } from '../model/contentTypes.js';
import type { AnyProperty } from '../model/properties.js';

/** A fixed sample date so generated content is deterministic. */
const SAMPLE_DATE = '2026-01-01T00:00:00.000Z';

// ponytail: depth cap 3, deepen if real nested-component previews need it
const MAX_DEPTH = 3;

/** All registered content types that are `_component` (the catalog). */
export function getComponentContentTypes(): AnyContentType[] {
  return getContentTypeByBaseType('_component');
}

/** Generate a placeholder value for a single property definition. */
function sampleForProperty(name: string, prop: AnyProperty, depth: number): unknown {
  const p = prop as any;
  const firstEnum = p.enum?.[0]?.value;

  switch (prop.type) {
    case 'string':
      return firstEnum ?? prop.displayName ?? `Sample ${name}`;
    case 'boolean':
      return true;
    case 'integer':
    case 'float':
      return firstEnum ?? p.minimum ?? 1;
    case 'dateTime':
      return SAMPLE_DATE;
    case 'richText':
      return {
        json: {
          type: 'root',
          children: [{ type: 'paragraph', children: [{ text: 'Sample rich text.' }] }],
        },
      };
    case 'url':
    case 'link':
      return { default: '#' };
    case 'array': {
      if (depth >= MAX_DEPTH) return [];
      const item = sampleForProperty(name, p.items, depth + 1);
      // Never emit a null item — components often map arrays straight into
      // OptimizelyComponent, which throws on null content.
      return item == null ? [] : [item];
    }
    case 'component': {
      const nestedKey = p.contentType?.key;
      if (!nestedKey || depth >= MAX_DEPTH) return null;
      return buildSampleContent(nestedKey, undefined, depth + 1);
    }
    case 'content': {
      // Inline content: build a sample of the first allowed component type.
      const inlineKey = p.allowedTypes?.find((t: any) => t?.key)?.key;
      if (!inlineKey || depth >= MAX_DEPTH) return null;
      return buildSampleContent(inlineKey, undefined, depth + 1);
    }
    // contentReference / binary / json → no meaningful placeholder
    default:
      return null;
  }
}

/**
 * Coerces a string override into the shape a property expects. Non-string
 * values (already-typed JSON) pass through untouched. Lets flat query params
 * (e.g. `?link=https://…`) map onto typed properties.
 */
function coerceOverride(prop: AnyProperty | undefined, value: unknown): unknown {
  if (typeof value !== 'string' || !prop) return value;
  switch (prop.type) {
    case 'url':
    case 'link':
      return { default: value };
    case 'boolean':
      return value === 'true';
    case 'integer':
      return parseInt(value, 10);
    case 'float':
      return parseFloat(value);
    default:
      return value;
  }
}

/**
 * Builds a renderable `content` object for a content type from its registered
 * property definitions, so a component can be previewed without real CMS data.
 *
 * Each property gets a type-appropriate placeholder value; caller-supplied
 * `overrides` replace placeholders per field (e.g. real data from CMS/App/AI agent).
 * String overrides are coerced to the property's expected shape.
 *
 * @param key Content type key (same as the component name).
 * @param overrides Optional field values that win over generated placeholders.
 */
export function buildSampleContent(
  key: string,
  overrides?: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  const contentType = getContentType(key);
  const properties = (contentType?.properties ?? {}) as Record<string, AnyProperty>;

  const result: Record<string, unknown> = {
    __typename: key,
    _metadata: { types: [key] },
  };
  for (const [name, prop] of Object.entries(properties)) {
    result[name] = sampleForProperty(name, prop, depth);
  }
  if (overrides) {
    for (const [name, value] of Object.entries(overrides)) {
      result[name] = coerceOverride(properties[name], value);
    }
  }

  return result;
}

/**
 * Builds the query string for rendering a component on its own, with each
 * simple property as a flat param (e.g. `individual&key=ButtonElement&label=…`).
 *
 * Only values that survive a round-trip through {@linkcode coerceOverride} are
 * included — strings, numbers, booleans and `url`/`link` objects. Structured
 * values (rich text, arrays, nested components) are left out so the link stays
 * editable by hand; they fall back to generated samples on render.
 *
 * @param key Content type key.
 * @param overrides Optional field values to bake into the link.
 */
export function buildIndividualQuery(
  key: string,
  overrides?: Record<string, unknown>,
): string {
  const content = buildSampleContent(key, overrides);
  const params = new URLSearchParams();
  params.set('individual', '');
  params.set('key', key);

  const properties = (getContentType(key)?.properties ?? {}) as Record<
    string,
    AnyProperty
  >;
  for (const [name, prop] of Object.entries(properties)) {
    const value = content[name];
    if (prop.type === 'url' || prop.type === 'link') {
      const url = (value as any)?.default;
      if (typeof url === 'string') params.set(name, url);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      params.set(name, String(value));
    }
  }

  return `?${params.toString()}`;
}

/**
 * Finds display templates that apply to a content type. A template targets its
 * owner by exactly one of: `contentType` (this key), `baseType` (every type of
 * that base — the common case, since `contentType` is often empty), or
 * `nodeType` (structure nodes, ignored here).
 */
export function getDisplayTemplatesFor(key: string): DisplayTemplate[] {
  const baseType = (getContentType(key) as any)?.baseType;
  return getAllDisplayTemplates().filter(dt => {
    const d = dt as any;
    if (d.contentType) return d.contentType === key;
    if (d.baseType) return d.baseType === baseType;
    return false; // nodeType or untargeted → not component-specific
  });
}

/**
 * Whether the design-system route should be reachable. Always on outside
 * production; in production requires `OPTIMIZELY_DESIGN_SYSTEM=true`.
 */
export function isDesignSystemEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.OPTIMIZELY_DESIGN_SYSTEM === 'true'
  );
}
