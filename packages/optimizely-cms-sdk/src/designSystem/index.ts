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
import type {
  DisplaySettingsType,
  ExperienceComponentNode,
  ExperienceNode,
  ExperienceStructureNode,
} from '../infer.js';
import { BlankSectionContentType } from '../model/internalContentTypes.js';
import { captionContent, slotContent } from './slot.js';

export { captionContent, DESIGN_SYSTEM_SLOT, slotContent } from './slot.js';
export type { DesignSystemSlot, SlotKind } from './slot.js';

/** A fixed sample date so generated content is deterministic. */
const SAMPLE_DATE = '2026-01-01T00:00:00.000Z';

// ponytail: depth cap 3, deepen if real nested-component previews need it
const MAX_DEPTH = 3;

/** Self-contained grey placeholder for image references (no network needed). */
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    // Small intrinsic size so an unconstrained <img> doesn't blow out the layout.
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 800 600">` +
      `<rect width="800" height="600" fill="#e3e6ea"/>` +
      `<path d="M0 470l230-190 150 125 130-105 290 240z" fill="#c8ced6"/>` +
      `<circle cx="600" cy="150" r="60" fill="#c8ced6"/>` +
      `<text x="400" y="560" font-family="sans-serif" font-size="28" fill="#5f6b7a" ` +
      `text-anchor="middle">Sample image</text></svg>`,
  );

/** All registered content types that are `_component`. */
export function getComponentContentTypes(): AnyContentType[] {
  return getContentTypeByBaseType('_component');
}

/** Base types the viewer can preview, in the order they appear in the catalog. */
const CATALOG_BASE_TYPES = [
  { baseType: '_component', label: 'Components' },
  { baseType: '_section', label: 'Sections' },
  { baseType: '_page', label: 'Pages' },
  { baseType: '_experience', label: 'Experiences' },
] as const;

/** A catalog section: one base type and the registered content types under it. */
export type CatalogGroup = {
  baseType: string;
  label: string;
  contentTypes: AnyContentType[];
};

/**
 * The full catalog, grouped by base type. Empty groups are dropped, so an app
 * with no experiences simply doesn't get an Experiences heading.
 */
export function getCatalogContentTypes(): CatalogGroup[] {
  return CATALOG_BASE_TYPES.map(({ baseType, label }) => ({
    baseType,
    label,
    contentTypes: getContentTypeByBaseType(baseType),
  })).filter(group => group.contentTypes.length > 0);
}

/**
 * Picks a content type to stand in for an `allowedTypes` list. Entries can be
 * content types, bare content type keys, base types (`'_component'`) or `'*'` —
 * the base-type form is the common one, and resolving it is what lets a content
 * area preview with a real component rather than only a slot.
 */
function resolveAllowedKey(allowed: unknown[] | undefined): string | undefined {
  for (const t of allowed ?? []) {
    if (t && typeof t === 'object' && 'key' in t) return (t as { key: string }).key;
    if (typeof t !== 'string') continue;

    if (t === '*') {
      const first = getComponentContentTypes()[0];
      if (first) return first.key;
    } else if (t.startsWith('_')) {
      const first = getContentTypeByBaseType(t)[0];
      if (first) return first.key;
    } else if (getContentType(t)) {
      return t;
    }
  }
}

/**
 * Readable stand-in copy, matched on property name. A button captioned "Label"
 * or a heading reading "Heading" makes the preview look broken, so common field
 * names get text that behaves like the real thing — right length, right tone.
 *
 * ponytail: first match wins, so order is the priority. Falls back to
 * `Sample <field>`, which still says which property it came from.
 */
const SAMPLE_TEXT: [RegExp, string][] = [
  [/^(label|cta|button|linktext|buttontext)/i, 'Learn more'],
  [/(heading|title|headline)/i, 'Build content-driven experiences'],
  [/(subtitle|tagline|eyebrow|kicker|intro|lead|preamble)/i, 'Composable by design'],
  [/(alt|caption)/i, 'A person sketching a layout on paper'],
  [/(author|byline|person|fullname|^name)/i, 'Alex Doe'],
  [/(email)/i, 'someone@example.com'],
  [
    /(body|text|description|summary|excerpt|content)/i,
    'Short sample copy that shows how a real block of text sits in this component.',
  ],
];

/** Sentence used wherever a longer sample paragraph is needed. */
const SAMPLE_PARAGRAPH =
  'Short sample copy that shows how a real block of text sits in this component. ' +
  'Replace it with content from the CMS.';

function sampleText(name: string, displayName?: string): string {
  const match = SAMPLE_TEXT.find(([re]) => re.test(name) || re.test(displayName ?? ''));
  return match ? match[1] : `Sample ${(displayName ?? name).toLowerCase()}`;
}

/** Generate a placeholder value for a single property definition. */
function sampleForProperty(name: string, prop: AnyProperty, depth: number): unknown {
  const p = prop as any;
  const firstEnum = p.enum?.[0]?.value;

  switch (prop.type) {
    case 'string':
      return firstEnum ?? sampleText(name, prop.displayName);
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
          children: [{ type: 'paragraph', children: [{ text: SAMPLE_PARAGRAPH }] }],
        },
      };
    case 'url':
    case 'link':
      return { default: '#' };
    case 'contentReference': {
      // Only images have a meaningful stand-in. Inline SVG keeps the preview
      // self-contained — no network request, works offline.
      const allowed: unknown[] = p.allowedTypes ?? [];
      const isImage = allowed.some(
        (t: any) => t === '_image' || t?.baseType === '_image',
      );
      return isImage ? { url: { default: PLACEHOLDER_IMAGE } } : null;
    }
    case 'array': {
      // An array of content/component is a content area. Emit one filled item
      // plus a slot, so the preview shows both what it looks like populated and
      // that more can be added — the empty case is invisible otherwise.
      const isArea = p.items?.type === 'content' || p.items?.type === 'component';
      if (depth >= MAX_DEPTH) return isArea ? [slotContent('Add a component')] : [];
      const item = sampleForProperty(name, p.items, depth + 1);
      // Never emit a null item — components often map arrays straight into
      // OptimizelyComponent, which throws on null content.
      if (isArea) return item == null ? [slotContent('Add a component')] : [item, slotContent('Add a component')];
      return item == null ? [] : [item];
    }
    case 'component': {
      const nestedKey = p.contentType?.key;
      if (!nestedKey || depth >= MAX_DEPTH) return slotContent();
      return buildSampleContent(nestedKey, undefined, depth + 1);
    }
    case 'content': {
      // Inline content: build a sample of the first allowed content type.
      const inlineKey = resolveAllowedKey(p.allowedTypes);
      if (!inlineKey || depth >= MAX_DEPTH) return slotContent();
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
    case 'contentReference':
      // `?image=https://…` → the shape components read (`image.url.default`).
      return { url: { default: value } };
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

// --- Layout styles ---
// Sections, rows and columns get their look from display templates, so a
// composition with no template applied previews a layout no editor would ever
// see. Sample compositions apply the registered templates and walk their
// choices, making the available layouts visible in the preview itself.

/** One choice of one display-template setting, ready to put on a node. */
export type LayoutStyleVariant = {
  /** Human-readable `Setting: Choice`, or `''` for the unstyled variant. */
  label: string;
  templateKey: string | null;
  settings: DisplaySettingsType[] | null;
};

// ponytail: cap the demo grid — a template with many choices would otherwise
// stretch the preview into a scroll marathon. Raise if a real app needs more.
const MAX_STYLE_VARIANTS = 4;

/** Sorts `[key, { sortOrder }]` entries the way the CMS editor lists them. */
function bySortOrder(a: [string, any], b: [string, any]) {
  return (a[1].sortOrder ?? 0) - (b[1].sortOrder ?? 0);
}

/**
 * Display templates for structure nodes — the layout style palette. A node type
 * can have several (a default with settings plus named ones like `ColumnCard`).
 *
 * @param nodeType Restrict to one node type (`row`, `column`); omit for all.
 */
export function getNodeTypeTemplates(nodeType?: string): DisplayTemplate[] {
  return getAllDisplayTemplates().filter(dt => {
    const nt = (dt as any).nodeType;
    return nt && (!nodeType || nt === nodeType);
  });
}

/**
 * Every style a set of templates offers: one variant per (setting, choice)
 * pair, plus one per settings-less template — those are still a style, they
 * just select a named variant of the wrapper instead of a value.
 *
 * Always returns at least one variant (unstyled) so callers can map over it.
 */
export function styleVariants(templates: DisplayTemplate[]): LayoutStyleVariant[] {
  const variants = templates.flatMap((dt): LayoutStyleVariant[] => {
    const settings = (Object.entries((dt as any).settings ?? {}) as [string, any][]).sort(
      bySortOrder,
    );

    if (settings.length === 0)
      return [{ label: dt.displayName ?? dt.key, templateKey: dt.key, settings: null }];

    return settings.flatMap(([settingKey, setting]) =>
      (Object.entries(setting.choices ?? {}) as [string, any][])
        .sort(bySortOrder)
        .map(([choiceKey, choice]) => ({
          label: `${setting.displayName ?? settingKey}: ${choice.displayName ?? choiceKey}`,
          templateKey: dt.key,
          settings: [{ key: settingKey, value: choiceKey }],
        })),
    );
  });

  return variants.length > 0 ?
      variants.slice(0, MAX_STYLE_VARIANTS)
    : [{ label: '', templateKey: null, settings: null }];
}

// --- Composition samples ---
// Pages and experiences render a node tree rather than plain properties, so
// they need a stand-in composition before they can be previewed at all. Keys are
// fixed strings rather than generated, so the markup stays deterministic.

function structureNode(
  nodeType: string,
  key: string,
  nodes: ExperienceNode[],
  type: string | null = null,
  variant?: LayoutStyleVariant,
): ExperienceStructureNode {
  return {
    __typename: 'CompositionStructureNode',
    type,
    key,
    nodeType,
    layoutType: nodeType,
    // The style is the interesting thing about a generated node, and the viewer
    // reads this back to caption each section preview.
    displayName: variant?.label || `Sample ${nodeType}`,
    displayTemplateKey: variant?.templateKey ?? null,
    displaySettings: variant?.settings ?? null,
    nodes,
  };
}

function componentNode(
  key: string,
  content: Record<string, unknown>,
): ExperienceComponentNode {
  return {
    __typename: 'CompositionComponentNode',
    type: content.__typename as string,
    key,
    nodeType: 'component',
    layoutType: null,
    displayName: content.__typename as string,
    displayTemplateKey: null,
    displaySettings: null,
    component: content as { __typename: string },
  };
}

/**
 * Columns of one row, each an empty slot. The preview is about the layout the
 * styles produce, so the columns stay empty — a sample component in one of them
 * would be read as part of the layout. One column per column style, so the
 * styles are visible side by side.
 */
function sampleColumns(prefix: string): ExperienceNode[] {
  const colVariants = styleVariants(getNodeTypeTemplates('column'));
  // Always at least two columns — one column alone shows no layout.
  const columns = colVariants.length > 1 ? colVariants : [colVariants[0], colVariants[0]];

  return columns.map((colVariant, i) => {
    // Rows and columns are the app's own divs, so the only way to say which is
    // which is a caption rendered inside them. Every column leads with its own
    // caption and nothing else, so the columns line up.
    const captions = [
      caption(`${prefix}-caption-${i}`, 'column', `Column ${i + 1}`, colVariant),
    ];

    const body = [componentNode(`${prefix}-slot-${i}`, slotContent('Drop components here'))];

    return structureNode(
      'column',
      `${prefix}-column-${i}`,
      [...captions, ...body],
      null,
      colVariant,
    );
  });
}

/** Caption node naming a structure node and the style applied to it. */
function caption(
  key: string,
  nodeType: string,
  name: string,
  variant: LayoutStyleVariant,
): ExperienceComponentNode {
  return componentNode(
    key,
    captionContent(variant.label ? `${name} · ${variant.label}` : name, nodeType),
  );
}

/** One row per row style, each with its columns. */
function sampleRows(prefix = 'sample', maxRows = Infinity): ExperienceNode[] {
  return styleVariants(getNodeTypeTemplates('row'))
    .slice(0, maxRows)
    .map((rowVariant, r) => {
      const rowPrefix = `${prefix}-row-${r}`;
      return structureNode(
        'row',
        rowPrefix,
        [
          // Sits inside the row, beside the columns — the viewer floats it out
          // of flow so it labels the row without taking a column's width.
          caption(`${rowPrefix}-caption`, 'row', 'Row', rowVariant),
          ...sampleColumns(rowPrefix),
        ],
        null,
        rowVariant,
      );
    });
}

/**
 * Root composition for an `_experience`: one section per section style. The
 * top-level nodes must be sections — `OptimizelyComposition` renders anything
 * that isn't a component node by its `type`, so a bare row resolves to nothing.
 */
function sampleComposition(): ExperienceStructureNode {
  const sectionKey =
    getContentTypeByBaseType('_section')[0]?.key ?? BlankSectionContentType.key;

  const sections = styleVariants(getDisplayTemplatesFor(sectionKey)).map(
    (variant, s) =>
      structureNode(
        'section',
        `sample-section-${s}`,
        // Repeating the row/column matrix in every section would square the
        // preview; only the first section carries the full set.
        sampleRows(`sample-s${s}`, s === 0 ? Infinity : 1),
        sectionKey,
        variant,
      ),
  );

  return structureNode('root', 'sample-composition', sections);
}

/** Fields a base type contributes on top of its declared properties. */
function sampleForBaseType(
  key: string,
  baseType: string | undefined,
  depth: number,
): Record<string, unknown> {
  switch (baseType) {
    case '_experience':
      return { composition: sampleComposition() };
    case '_section':
      return { key: `sample-${key}`, nodes: sampleRows() };
    default:
      return {};
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
    _metadata: {
      key: `sample-${key}`,
      types: [key],
      displayName: contentType?.displayName ?? key,
    },
    ...sampleForBaseType(key, (contentType as AnyContentType | undefined)?.baseType, depth),
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

/** One captioned preview of an experience, holding a single section. */
export type SectionPreview = {
  /** Caption for the card — the section style it demonstrates. */
  label: string;
  /** Rows in this section; the first one demos every row style. */
  rows: number;
  content: Record<string, unknown>;
};

/**
 * Splits a sample experience into one renderable content per section, so the
 * viewer can caption each section style instead of stacking them into an
 * unlabelled wall. Returns `[]` when there is nothing to split — a single
 * section, or a type with no composition — and the caller should just render
 * {@linkcode buildSampleContent}.
 *
 * @param key Content type key of an `_experience`.
 * @param overrides Optional field values, as for {@linkcode buildSampleContent}.
 */
export function buildSectionPreviews(
  key: string,
  overrides?: Record<string, unknown>,
): SectionPreview[] {
  const content = buildSampleContent(key, overrides);
  const composition = content.composition as ExperienceStructureNode | undefined;
  const sections = composition?.nodes ?? [];
  if (!composition || sections.length < 2) return [];

  return sections.map(section => ({
    label: (section as ExperienceStructureNode).displayName ?? 'Section',
    rows: ((section as ExperienceStructureNode).nodes ?? []).length,
    content: { ...content, composition: { ...composition, nodes: [section] } },
  }));
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
    } else if (prop.type === 'contentReference') {
      const url = (value as any)?.url?.default;
      // Skip the inline SVG placeholder — it would bloat the URL.
      if (typeof url === 'string' && !url.startsWith('data:')) params.set(name, url);
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
