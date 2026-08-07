/**
 * React UI for the design-system (Storybook-like) viewer. Framework-agnostic
 * logic lives in `../designSystem`; this file only renders it.
 */
import type { ReactNode } from 'react';
import { getContentType } from '../model/contentTypeRegistry.js';
import type { AnyProperty } from '../model/properties.js';
import type { DisplayTemplate } from '../model/displayTemplates.js';
import {
  buildIndividualQuery,
  buildSampleContent,
  buildSectionPreviews,
  getCatalogContentTypes,
  getDisplayTemplatesFor,
  getNodeTypeTemplates,
} from '../designSystem/index.js';
import { OptimizelyComponent } from './server.js';

// Re-export the core so `@optimizely/cms-sdk/react/designSystem` stays a
// one-stop import for React apps.
export {
  buildIndividualQuery,
  buildSampleContent,
  buildSectionPreviews,
  captionContent,
  getCatalogContentTypes,
  getComponentContentTypes,
  getDisplayTemplatesFor,
  getNodeTypeTemplates,
  isDesignSystemEnabled,
  styleVariants,
  DESIGN_SYSTEM_SLOT,
  slotContent,
} from '../designSystem/index.js';
export type {
  CatalogGroup,
  LayoutStyleVariant,
  SectionPreview,
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
  navGroup: {
    margin: '0.9rem 0 0.3rem',
    padding: '0 1.25rem',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: c.muted,
    fontWeight: 700,
  },
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
  // Vertical room only — horizontal padding would fake a container the section
  // does not have. Padding, not margin, so the first row's own margin (which
  // carries its caption) cannot collapse out of the stage.
  stageBare: { padding: '0.75rem 0 1.5rem' },
  stageInnerBare: { background: c.panel },
  stageHead: {
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'center',
    padding: '0.6rem 1rem',
    borderTop: `1px solid ${c.border}`,
    borderBottom: `1px solid ${c.border}`,
    background: c.bg,
    fontSize: '0.85rem',
  },
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
  grid: {
    display: 'grid',
    gap: '0.75rem',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.4rem',
    alignItems: 'flex-start',
    padding: '0.9rem 1rem',
    border: `1px solid ${c.border}`,
    borderRadius: 10,
    background: c.panel,
    color: c.text,
    textDecoration: 'none',
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
.ods-tile{transition:border-color .12s,box-shadow .12s}
.ods-tile:hover{border-color:${c.accent};box-shadow:0 1px 4px rgba(11,92,255,.12);text-decoration:none}
.ods-tile strong{font-size:.95rem}
.ods tbody tr:last-child td{border-bottom:0}

/* Structure outlines. The section, row and column elements belong to the app,
   so they carry no markers of ours — but each contains a caption chip, and
   \`:has()\` reaches the parent from it. \`outline\` rather than \`border\` so
   nothing shifts, and the column keeps whatever flex sizing the app gave it. */
.ods-stage *:has(> [data-ods-caption="column"]){outline:1px dotted #b9c2cd;outline-offset:4px}
/* Margin, not padding: the label needs room above the row without altering the
   row's own spacing, which is the thing the preview is demonstrating. */
.ods-stage *:has(> [data-ods-caption="row"]){position:relative;outline:1px dashed #8f9bab;
  outline-offset:8px;margin-top:2.75rem}
.ods-stage *:has(> * > [data-ods-caption="row"]){outline:1px dashed #d3dae2;outline-offset:-1px}
/* Out of flow, so the row label never eats a column's width. */
.ods-stage [data-ods-caption="row"]{position:absolute;top:-2.1rem;left:0}
.ods-stage [data-ods-caption]{z-index:1}
@media (max-width:760px){
  .ods-shell{flex-direction:column}
  .ods-sidebar{width:auto;height:auto;max-height:45vh;position:static;border-right:0;
    border-bottom:1px solid ${c.border}}
  .ods-main{padding:1.25rem}
}
`;

function Shell({ activeKey, children }: { activeKey?: string; children: ReactNode }) {
  const groups = getCatalogContentTypes();
  const total = groups.reduce((n, g) => n + g.contentTypes.length, 0);

  return (
    <div className="ods ods-shell" style={styles.shell}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <aside className="ods-sidebar" style={styles.sidebar}>
        <div style={styles.brand}>
          <h1 style={styles.brandTitle}>Design System</h1>
          <p style={styles.muted}>{total} content types</p>
        </div>
        <nav className="ods-nav">
          {groups.map(group => (
            <div key={group.baseType}>
              <p style={styles.navGroup}>{group.label}</p>
              <ul style={styles.navList}>
                {group.contentTypes.map(ct => (
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
            </div>
          ))}
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

/**
 * Template × setting × choices. When `hrefFor` is given each choice becomes a
 * link that re-renders the preview with that setting applied, so the styles a
 * type offers can be tried rather than just read.
 */
function TemplateTable({
  templates,
  hrefFor,
  active,
}: {
  templates: DisplayTemplate[];
  hrefFor?: (settingKey: string, choiceKey: string) => string;
  active?: Record<string, string | boolean>;
}) {
  return (
    <div style={styles.card}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Template</th>
            <th style={styles.th}>Applies to</th>
            <th style={styles.th}>Setting</th>
            <th style={styles.th}>Choices</th>
          </tr>
        </thead>
        <tbody>
          {templates.flatMap(dt => {
            const d = dt as any;
            const target = d.nodeType ?? d.baseType ?? d.contentType ?? '—';
            const settings = Object.entries(dt.settings ?? {});
            if (settings.length === 0)
              return [
                <tr key={dt.key}>
                  <td style={styles.td}>{dt.displayName ?? dt.key}</td>
                  <td style={styles.td}>
                    <code style={styles.code}>{target}</code>
                  </td>
                  <td style={styles.td}>—</td>
                  <td style={styles.td}>—</td>
                </tr>,
              ];
            return settings.map(([sKey, setting]: [string, any], i) => {
              const choices = Object.keys(setting.choices ?? {});
              return (
                <tr key={`${dt.key}:${sKey}`}>
                  <td style={styles.td}>{i === 0 ? (dt.displayName ?? dt.key) : ''}</td>
                  <td style={styles.td}>
                    {i === 0 ?
                      <code style={styles.code}>{target}</code>
                    : ''}
                  </td>
                  <td style={styles.td}>
                    <code style={styles.code}>{sKey}</code>
                  </td>
                  <td style={styles.td}>
                    {choices.length === 0 ?
                      '—'
                    : choices.map((choice, n) => (
                        <span key={choice}>
                          {n > 0 ? ', ' : ''}
                          {hrefFor ?
                            <a
                              style={
                                active?.[sKey] === choice ?
                                  { ...styles.link, textDecoration: 'underline' }
                                : styles.link
                              }
                              href={hrefFor(sKey, choice)}
                            >
                              {choice}
                            </a>
                          : choice}
                        </span>
                      ))
                    }
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

function Variants({
  contentTypeKey,
  displaySettings,
}: {
  contentTypeKey: string;
  displaySettings?: Record<string, string | boolean>;
}) {
  const templates = getDisplayTemplatesFor(contentTypeKey);
  if (templates.length === 0) return null;

  // ponytail: the link carries only the key and the settings — prop overrides
  // from the URL are dropped. Thread them through if that becomes annoying.
  const hrefFor = (settingKey: string, choiceKey: string) =>
    `?key=${encodeURIComponent(contentTypeKey)}&displaySettings=` +
    encodeURIComponent(JSON.stringify({ ...displaySettings, [settingKey]: choiceKey }));

  return (
    <>
      <h2 style={styles.sectionTitle}>Display templates</h2>
      <p style={styles.muted}>Pick a choice to render the preview with it applied.</p>
      <TemplateTable
        templates={templates}
        hrefFor={hrefFor}
        active={displaySettings}
      />
    </>
  );
}

/**
 * Row and column styles. They belong to the composition, not to the previewed
 * type, so they can't be switched from here — the preview renders one row per
 * choice instead.
 */
function LayoutStyles() {
  const templates = getNodeTypeTemplates();
  if (templates.length === 0) return null;

  return (
    <>
      <h2 style={styles.sectionTitle}>Layout styles</h2>
      <p style={styles.muted}>
        Styles rows and columns can take. The preview above renders one row per
        choice, with the style named in the empty column.
      </p>
      <TemplateTable templates={templates} />
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
 * Storybook-like viewer. Without `contentTypeKey`, renders the catalog of every
 * previewable content type — components, sections, pages and experiences. With
 * a key, renders that type in isolation (using sample data + optional
 * overrides) plus its prop schema and display-template variants.
 *
 * Pages and experiences get a generated composition, and every fillable area —
 * content area, content list, empty column — renders a dashed slot so it is
 * obvious where components go.
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
    const groups = getCatalogContentTypes();
    return (
      <Shell>
        <h1 style={styles.h1}>Catalog</h1>
        <p style={styles.muted}>
          Pick a content type to preview it with sample data and inspect its
          properties.
        </p>
        <div style={{ marginTop: '1.5rem' }}>
          {groups.length === 0 ?
            <div style={styles.empty}>
              No previewable content types registered. Register at least one{' '}
              <code style={styles.code}>_component</code>,{' '}
              <code style={styles.code}>_section</code>,{' '}
              <code style={styles.code}>_page</code> or{' '}
              <code style={styles.code}>_experience</code> type.
            </div>
          : groups.map(group => (
              <div key={group.baseType}>
                <h2 style={styles.sectionTitle}>{group.label}</h2>
                <div style={styles.grid}>
                  {group.contentTypes.map(ct => (
                    <a
                      key={ct.key}
                      className="ods-tile"
                      style={styles.tile}
                      href={`?key=${encodeURIComponent(ct.key)}`}
                    >
                      <strong>{ct.displayName ?? ct.key}</strong>
                      <span style={styles.pill}>{ct.key}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))
          }
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
  const baseType = (contentType as any).baseType as string | undefined;

  // Pages, sections and experiences bring their own containers and spacing;
  // the stage padding would misrepresent how they actually look.
  const fullWidth = baseType !== '_component';

  // An experience with several section styles reads as an unlabelled wall when
  // stacked in one stage, so each section gets its own captioned card.
  const sectionPreviews = buildSectionPreviews(contentTypeKey, props);

  return (
    <Shell activeKey={contentTypeKey}>
      <h1 style={styles.h1}>{contentType.displayName ?? contentTypeKey}</h1>
      <p style={styles.muted}>
        <span style={styles.pill}>{contentTypeKey}</span>
        {baseType ? <span style={styles.pill}> {baseType}</span> : null}
        {description ? ` — ${description}` : null}
      </p>

      <h2 style={styles.sectionTitle}>Preview</h2>
      {sectionPreviews.length > 0 ?
        <p style={styles.muted}>
          One card per section style. Rows and columns are captioned inside the
          section they belong to.
        </p>
      : null}
      <div style={styles.card}>
        {sectionPreviews.length > 0 ?
          sectionPreviews.map((preview, i) => (
            <div key={preview.label + i}>
              <div style={styles.stageHead}>
                <strong>Section</strong>
                <span style={styles.pill}>{preview.label}</span>
                <span style={styles.muted}>
                  {preview.rows} row{preview.rows === 1 ? '' : 's'}
                </span>
              </div>
              <div className="ods-stage" style={styles.stageBare}>
                <div style={styles.stageInnerBare}>
                  <OptimizelyComponent
                    content={preview.content as any}
                    displaySettings={displaySettings}
                  />
                </div>
              </div>
            </div>
          ))
        : <div className="ods-stage" style={fullWidth ? styles.stageBare : styles.stage}>
            <div style={fullWidth ? styles.stageInnerBare : styles.stageInner}>
              <OptimizelyComponent
                content={content as any}
                displaySettings={displaySettings}
              />
            </div>
          </div>
        }
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

      <Variants contentTypeKey={contentTypeKey} displaySettings={displaySettings} />

      {/* Only composed types render rows and columns. */}
      {baseType === '_section' || baseType === '_experience' ? <LayoutStyles /> : null}
    </Shell>
  );
}
