import {
  getContentType,
  getContentTypeByBaseType,
} from '../model/contentTypeRegistry.js';
import { getAllDisplayTemplates } from '../model/displayTemplateRegistry.js';
import type { DisplayTemplate } from '../model/displayTemplates.js';
import type { AnyProperty } from '../model/properties.js';
import { OptimizelyComponent } from './server.js';

/** A fixed sample date so generated content is deterministic. */
const SAMPLE_DATE = '2026-01-01T00:00:00.000Z';

// ponytail: depth cap 3, deepen if real nested-component previews need it
const MAX_DEPTH = 3;

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
 * Whether the design-system route should be reachable. Always on outside
 * production; in production requires `OPTIMIZELY_DESIGN_SYSTEM=true`.
 */
export function isDesignSystemEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.OPTIMIZELY_DESIGN_SYSTEM === 'true'
  );
}

// --- Presentation (inline styles, matching the SDK's FallbackComponent approach) ---

const styles = {
  page: { fontFamily: 'system-ui, sans-serif', padding: '2rem', color: '#111' },
  list: { listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' },
  link: { color: '#0b5cff', textDecoration: 'none', fontWeight: 600 },
  muted: { color: '#666', fontSize: '0.9rem' },
  frame: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '1.5rem',
    margin: '1rem 0',
    background: '#fff',
  },
  table: { borderCollapse: 'collapse' as const, width: '100%', marginTop: '0.5rem' },
  th: {
    textAlign: 'left' as const,
    borderBottom: '2px solid #ddd',
    padding: '0.4rem 0.6rem',
    fontSize: '0.85rem',
  },
  td: { borderBottom: '1px solid #eee', padding: '0.4rem 0.6rem', fontSize: '0.9rem' },
};

function Catalog() {
  const components = getContentTypeByBaseType('_component');

  return (
    <div style={styles.page}>
      <h1>Design System</h1>
      <p style={styles.muted}>{components.length} component(s)</p>
      {components.length === 0 ?
        <p>No components registered.</p>
      : <ul style={styles.list}>
          {components.map(c => (
            <li key={c.key}>
              <a style={styles.link} href={`?key=${encodeURIComponent(c.key)}`}>
                {c.displayName ?? c.key}
              </a>{' '}
              <span style={styles.muted}>{c.key}</span>
              {(c as any).description ?
                <div style={styles.muted}>{(c as any).description}</div>
              : null}
            </li>
          ))}
        </ul>
      }
    </div>
  );
}

function PropsTable({ properties }: { properties: Record<string, AnyProperty> }) {
  const entries = Object.entries(properties);
  if (entries.length === 0) return <p style={styles.muted}>No properties.</p>;

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Type</th>
          <th style={styles.th}>Required</th>
          <th style={styles.th}>Description</th>
          <th style={styles.th}>Choices</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([name, prop]) => {
          const p = prop as any;
          const choices = p.enum?.map((e: any) => e.value).join(', ');
          return (
            <tr key={name}>
              <td style={styles.td}>
                <code>{name}</code>
              </td>
              <td style={styles.td}>{prop.type}</td>
              <td style={styles.td}>{prop.isRequired ? 'yes' : ''}</td>
              <td style={styles.td}>{prop.description ?? prop.displayName ?? ''}</td>
              <td style={styles.td}>{choices ?? ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
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

function Variants({ contentTypeKey }: { contentTypeKey: string }) {
  const templates = getDisplayTemplatesFor(contentTypeKey);
  if (templates.length === 0) return null;

  return (
    <>
      <h3>Display template variants</h3>
      {templates.map(dt => (
        <div key={dt.key}>
          <strong>{dt.displayName ?? dt.key}</strong>
          <ul>
            {Object.entries(dt.settings ?? {}).map(([sKey, setting]: [string, any]) => (
              <li key={sKey}>
                <code>{sKey}</code>: {Object.keys(setting.choices ?? {}).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Props for the {@linkcode DesignSystem} component. */
export type DesignSystemProps = {
  /** Content type key to inspect. When omitted, shows the component catalog. */
  contentTypeKey?: string;
  /** Field values that override generated sample data. */
  props?: Record<string, unknown>;
  /** Display-template settings passed to the rendered component. */
  displaySettings?: Record<string, string | boolean>;
  /** Render only the component (no catalog chrome, props panel, or frame). */
  individual?: boolean;
};

/**
 * Storybook-like viewer. Without `contentTypeKey`, renders a catalog of all
 * registered `_component` content types. With a key, renders that component in
 * isolation (using sample data + optional overrides) plus its prop schema and
 * display-template variants.
 */
export async function DesignSystem({
  contentTypeKey,
  props,
  displaySettings,
  individual,
}: DesignSystemProps) {
  if (!contentTypeKey) return <Catalog />;

  // Bare render: just the component, no page chrome.
  if (individual) {
    const content = buildSampleContent(contentTypeKey, props);
    return (
      <OptimizelyComponent content={content as any} displaySettings={displaySettings} />
    );
  }

  const contentType = getContentType(contentTypeKey);
  if (!contentType) {
    return (
      <div style={styles.page}>
        <p>
          Unknown content type: <b>{contentTypeKey}</b>
        </p>
        <a style={styles.link} href='?'>
          ← Back to catalog
        </a>
      </div>
    );
  }

  const properties = (contentType.properties ?? {}) as Record<string, AnyProperty>;
  const content = buildSampleContent(contentTypeKey, props);

  return (
    <div style={styles.page}>
      <a style={styles.link} href='?'>
        ← Back to catalog
      </a>
      <h1>{contentType.displayName ?? contentTypeKey}</h1>
      {(contentType as any).description ?
        <p style={styles.muted}>{(contentType as any).description}</p>
      : null}

      <h3>Preview</h3>
      <div style={styles.frame}>
        <OptimizelyComponent content={content as any} displaySettings={displaySettings} />
      </div>

      <h3>Properties</h3>
      <PropsTable properties={properties} />

      <Variants contentTypeKey={contentTypeKey} />
    </div>
  );
}
