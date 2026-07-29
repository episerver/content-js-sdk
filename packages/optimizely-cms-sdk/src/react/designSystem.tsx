/**
 * React UI for the design-system (Storybook-like) viewer. Framework-agnostic
 * logic lives in `../designSystem`; this file only renders it.
 */
import type { ReactNode } from 'react';
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

// --- Presentation ---
// ponytail: inline styles + one <style> tag for hover/responsive, because the
// SDK can't assume the host app ships Tailwind or any CSS pipeline.

const c = {
  bg: '#f6f7f9',
  panel: '#ffffff',
  border: '#e3e6ea',
  text: '#14181d',
  muted: '#5f6b7a',
  accent: '#0b5cff',
  accentSoft: '#eef3ff',
  code: '#f1f3f5',
};

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: c.text,
    background: c.bg,
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    borderRight: `1px solid ${c.border}`,
    background: c.panel,
    padding: '1.25rem 0',
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
    overflowY: 'auto' as const,
  },
  brand: {
    padding: '0 1.25rem 1rem',
    borderBottom: `1px solid ${c.border}`,
    marginBottom: '0.75rem',
  },
  brandTitle: { margin: 0, fontSize: '1rem', letterSpacing: '-0.01em' },
  navList: { listStyle: 'none', margin: 0, padding: '0 0.5rem' },
  main: { flex: 1, minWidth: 0, padding: '2rem 2.5rem' },
  h1: { margin: '0 0 0.25rem', fontSize: '1.75rem', letterSpacing: '-0.02em' },
  muted: { color: c.muted, fontSize: '0.9rem', margin: 0 },
  pill: {
    display: 'inline-block',
    background: c.code,
    borderRadius: 999,
    padding: '0.15rem 0.6rem',
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    color: c.muted,
  },
  sectionTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: c.muted,
    margin: '2rem 0 0.6rem',
    fontWeight: 600,
  },
  card: {
    border: `1px solid ${c.border}`,
    borderRadius: 10,
    background: c.panel,
    overflow: 'hidden',
  },
  stage: {
    padding: '2rem',
    background: `repeating-conic-gradient(${c.bg} 0% 25%, ${c.panel} 0% 50%) 50%/16px 16px`,
  },
  stageInner: { background: c.panel, borderRadius: 8, padding: '1.5rem' },
  cardFoot: {
    borderTop: `1px solid ${c.border}`,
    padding: '0.6rem 1rem',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    fontSize: '0.85rem',
    background: c.panel,
  },
  link: { color: c.accent, textDecoration: 'none', fontWeight: 600 },
  table: { borderCollapse: 'collapse' as const, width: '100%', fontSize: '0.9rem' },
  th: {
    textAlign: 'left' as const,
    padding: '0.6rem 1rem',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: c.muted,
    borderBottom: `1px solid ${c.border}`,
    background: c.bg,
  },
  td: { padding: '0.6rem 1rem', borderBottom: `1px solid ${c.border}`, verticalAlign: 'top' as const },
  code: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    background: c.code,
    borderRadius: 4,
    padding: '0.1rem 0.35rem',
    fontSize: '0.85em',
  },
  empty: {
    border: `1px dashed ${c.border}`,
    borderRadius: 10,
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    color: c.muted,
    background: c.panel,
  },
};

/** Hover/active states and small-screen collapse — not expressible inline. */
const CSS = `
/* The viewer owns the whole viewport; cancel host body chrome so it reaches
   the screen edges regardless of the app's global stylesheet. */
html:has(.ods-shell),body:has(.ods-shell){margin:0;padding:0;height:100%;background:${c.bg}}
.ods-shell,.ods-shell *{box-sizing:border-box}
.ods-nav a{display:block;padding:.4rem .75rem;border-radius:6px;color:${c.text};
  text-decoration:none;font-size:.875rem;line-height:1.3}
.ods-nav a:hover{background:${c.bg}}
.ods-nav a[aria-current="page"]{background:${c.accentSoft};color:${c.accent};font-weight:600}
.ods-nav small{display:block;color:${c.muted};font-size:.7rem;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.ods-nav a[aria-current="page"] small{color:${c.accent};opacity:.75}
.ods a:hover{text-decoration:underline}
.ods tbody tr:last-child td{border-bottom:0}
@media (max-width:760px){
  .ods-shell{flex-direction:column}
  .ods-sidebar{width:auto;height:auto;max-height:45vh;position:static;border-right:0;
    border-bottom:1px solid ${c.border}}
  .ods-main{padding:1.25rem}
}
`;

function Shell({ activeKey, children }: { activeKey?: string; children: ReactNode }) {
  const components = getComponentContentTypes();

  return (
    <div className="ods ods-shell" style={styles.shell}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <aside className="ods-sidebar" style={styles.sidebar}>
        <div style={styles.brand}>
          <h1 style={styles.brandTitle}>Design System</h1>
          <p style={styles.muted}>{components.length} components</p>
        </div>
        <nav className="ods-nav">
          <ul style={styles.navList}>
            {components.map(ct => (
              <li key={ct.key}>
                <a
                  href={`?key=${encodeURIComponent(ct.key)}`}
                  aria-current={ct.key === activeKey ? 'page' : undefined}
                >
                  {ct.displayName ?? ct.key}
                  <small>{ct.key}</small>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="ods-main" style={styles.main}>
        {children}
      </main>
    </div>
  );
}

function PropsTable({ properties }: { properties: Record<string, AnyProperty> }) {
  const entries = Object.entries(properties);
  if (entries.length === 0)
    return <div style={styles.empty}>This component has no properties.</div>;

  return (
    <div style={styles.card}>
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
                  <code style={styles.code}>{name}</code>
                </td>
                <td style={styles.td}>
                  <span style={styles.pill}>{prop.type}</span>
                </td>
                <td style={styles.td}>{prop.isRequired ? 'Yes' : '—'}</td>
                <td style={styles.td}>{prop.description ?? prop.displayName ?? '—'}</td>
                <td style={styles.td}>{choices ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Variants({ contentTypeKey }: { contentTypeKey: string }) {
  const templates = getDisplayTemplatesFor(contentTypeKey);
  if (templates.length === 0) return null;

  return (
    <>
      <h2 style={styles.sectionTitle}>Display templates</h2>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Template</th>
              <th style={styles.th}>Setting</th>
              <th style={styles.th}>Choices</th>
            </tr>
          </thead>
          <tbody>
            {templates.flatMap(dt => {
              const settings = Object.entries(dt.settings ?? {});
              if (settings.length === 0)
                return [
                  <tr key={dt.key}>
                    <td style={styles.td}>{dt.displayName ?? dt.key}</td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}>—</td>
                  </tr>,
                ];
              return settings.map(([sKey, setting]: [string, any], i) => (
                <tr key={`${dt.key}:${sKey}`}>
                  <td style={styles.td}>{i === 0 ? (dt.displayName ?? dt.key) : ''}</td>
                  <td style={styles.td}>
                    <code style={styles.code}>{sKey}</code>
                  </td>
                  <td style={styles.td}>
                    {Object.keys(setting.choices ?? {}).join(', ') || '—'}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
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
  // Bare render: just the component, no page chrome.
  if (contentTypeKey && individual) {
    const content = buildSampleContent(contentTypeKey, props);
    return (
      <OptimizelyComponent content={content as any} displaySettings={displaySettings} />
    );
  }

  if (!contentTypeKey) {
    return (
      <Shell>
        <h1 style={styles.h1}>Components</h1>
        <p style={styles.muted}>
          Pick a component to preview it with sample data and inspect its properties.
        </p>
        <div style={{ marginTop: '1.5rem' }}>
          {getComponentContentTypes().length === 0 ?
            <div style={styles.empty}>
              No <code style={styles.code}>_component</code> content types registered.
            </div>
          : <div style={styles.empty}>Select a component from the sidebar.</div>}
        </div>
      </Shell>
    );
  }

  const contentType = getContentType(contentTypeKey);
  if (!contentType) {
    return (
      <Shell>
        <h1 style={styles.h1}>Not found</h1>
        <p style={styles.muted}>
          No content type registered with key{' '}
          <code style={styles.code}>{contentTypeKey}</code>.
        </p>
      </Shell>
    );
  }

  const properties = (contentType.properties ?? {}) as Record<string, AnyProperty>;
  const content = buildSampleContent(contentTypeKey, props);
  const description = (contentType as any).description;

  return (
    <Shell activeKey={contentTypeKey}>
      <h1 style={styles.h1}>{contentType.displayName ?? contentTypeKey}</h1>
      <p style={styles.muted}>
        <span style={styles.pill}>{contentTypeKey}</span>
        {description ? ` — ${description}` : null}
      </p>

      <h2 style={styles.sectionTitle}>Preview</h2>
      <div style={styles.card}>
        <div style={styles.stage}>
          <div style={styles.stageInner}>
            <OptimizelyComponent
              content={content as any}
              displaySettings={displaySettings}
            />
          </div>
        </div>
        <div style={styles.cardFoot}>
          <a style={styles.link} href={buildIndividualQuery(contentTypeKey, props)}>
            Open standalone ↗
          </a>
          <span style={styles.muted}>
            renders only this component — edit the props in the URL
          </span>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Properties</h2>
      <PropsTable properties={properties} />

      <Variants contentTypeKey={contentTypeKey} />
    </Shell>
  );
}
