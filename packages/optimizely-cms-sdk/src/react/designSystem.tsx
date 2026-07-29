/**
 * React UI for the design-system (Storybook-like) viewer. Framework-agnostic
 * logic lives in `../designSystem`; this file only renders it.
 */
import { getContentType } from '../model/contentTypeRegistry.js';
import type { AnyProperty } from '../model/properties.js';
import {
  buildIndividualQuery,
  buildSampleContent,
  getComponentContentTypes,
  getDisplayTemplatesFor,
} from '../designSystem/index.js';
import { OptimizelyComponent } from './server.js';

// Re-export the core so `@optimizely/cms-sdk/react/designSystem` stays a
// one-stop import for React apps.
export {
  buildIndividualQuery,
  buildSampleContent,
  getComponentContentTypes,
  getDisplayTemplatesFor,
  isDesignSystemEnabled,
} from '../designSystem/index.js';

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
  const components = getComponentContentTypes();

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
    return <OptimizelyComponent content={content as any} displaySettings={displaySettings} />;
  }

  const contentType = getContentType(contentTypeKey);
  if (!contentType) {
    return (
      <div style={styles.page}>
        <p>
          Unknown content type: <b>{contentTypeKey}</b>
        </p>
        <a style={styles.link} href="?">
          ← Back to catalog
        </a>
      </div>
    );
  }

  const properties = (contentType.properties ?? {}) as Record<string, AnyProperty>;
  const content = buildSampleContent(contentTypeKey, props);

  return (
    <div style={styles.page}>
      <a style={styles.link} href="?">
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
      <p>
        <a style={styles.link} href={buildIndividualQuery(contentTypeKey, props)}>
          Open standalone ↗
        </a>{' '}
        <span style={styles.muted}>
          renders only this component — edit the props in the URL
        </span>
      </p>

      <h3>Properties</h3>
      <PropsTable properties={properties} />

      <Variants contentTypeKey={contentTypeKey} />
    </div>
  );
}
