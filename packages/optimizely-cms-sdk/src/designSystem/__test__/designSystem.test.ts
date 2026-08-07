import { describe, it, expect, beforeEach } from 'vitest';
import {
  contentType,
  displayTemplate,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '../../index.js';
import {
  buildIndividualQuery,
  buildSampleContent,
  buildSectionPreviews,
  getCatalogContentTypes,
  getDisplayTemplatesFor,
  getNodeTypeTemplates,
  isDesignSystemEnabled,
  styleVariants,
  DESIGN_SYSTEM_SLOT,
} from '../index.js';

const Nested = contentType({
  key: 'NestedElement',
  baseType: '_component',
  displayName: 'Nested',
  properties: {
    label: { type: 'string', displayName: 'Label' },
  },
});

const Sample = contentType({
  key: 'SampleElement',
  baseType: '_component',
  displayName: 'Sample',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    level: {
      type: 'string',
      enum: [
        { value: 'h2', displayName: 'H2' },
        { value: 'h3', displayName: 'H3' },
      ],
    },
    published: { type: 'boolean' },
    count: { type: 'integer', minimum: 5 },
    body: { type: 'richText', editorSettings: { preset: 'minimal' } },
    link: { type: 'url' },
    tags: { type: 'array', items: { type: 'string' } },
    child: { type: 'component', contentType: Nested },
    teasers: { type: 'array', items: { type: 'content', allowedTypes: [Nested] } },
    refs: { type: 'array', items: { type: 'contentReference', allowedTypes: [] } },
    image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

describe('buildSampleContent', () => {
  beforeEach(() => {
    initContentTypeRegistry([Sample, Nested]);
  });

  it('stamps typename and metadata', () => {
    const c = buildSampleContent('SampleElement');
    expect(c.__typename).toBe('SampleElement');
    expect(c._metadata).toEqual({
      key: 'sample-SampleElement',
      types: ['SampleElement'],
      displayName: 'Sample',
    });
  });

  it('generates type-appropriate placeholders', () => {
    const c = buildSampleContent('SampleElement');
    // copy that reads like a real title, not the field name
    expect(c.title).toBe('Build content-driven experiences');
    expect(c.published).toBe(true);
    expect(c.count).toBe(5); // minimum
    expect((c.body as any).json.children[0].type).toBe('paragraph');
    expect(c.link).toEqual({ default: '#' });
    expect(c.tags).toEqual(['Sample tags']);
  });

  it('matches sample copy to the field, falling back to a named sample', () => {
    const Copy = contentType({
      key: 'CopyElement',
      baseType: '_component',
      displayName: 'Copy',
      properties: {
        label: { type: 'string', displayName: 'Label' },
        alternativeText: { type: 'string', displayName: 'Alt text' },
        eyebrow: { type: 'string' },
        sku: { type: 'string', displayName: 'SKU' },
      },
    });
    initContentTypeRegistry([Copy]);

    const c = buildSampleContent('CopyElement');
    expect(c.label).toBe('Learn more'); // a button captioned "Label" looks broken
    expect(c.alternativeText).toBe('A person sketching a layout on paper');
    expect(c.eyebrow).toBe('Composable by design');
    expect(c.sku).toBe('Sample sku'); // no match → still says which field it is
  });

  it('prefers the first enum value', () => {
    const c = buildSampleContent('SampleElement');
    expect(c.level).toBe('h2');
  });

  it('recurses into nested component properties', () => {
    const c = buildSampleContent('SampleElement');
    expect((c.child as any).__typename).toBe('NestedElement');
    expect((c.child as any).label).toBe('Learn more');
  });

  it('builds sample items for array-of-content', () => {
    const c = buildSampleContent('SampleElement');
    expect(Array.isArray(c.teasers)).toBe(true);
    expect((c.teasers as any[])[0].__typename).toBe('NestedElement');
  });

  it('closes a content area with a slot so the empty space is visible', () => {
    const c = buildSampleContent('SampleElement');
    const teasers = c.teasers as any[];
    expect(teasers).toHaveLength(2);
    expect(teasers[1].__typename).toBe(DESIGN_SYSTEM_SLOT);
    // arrays of plain values are not areas and get no slot
    expect(c.tags).toEqual(['Sample tags']);
    expect(c.refs).toEqual([]);
  });

  it('never puts null in arrays (renderable-safe)', () => {
    const c = buildSampleContent('SampleElement');
    // contentReference has no meaningful placeholder → empty array, not [null]
    expect(c.refs).toEqual([]);
  });

  it('lets overrides win over placeholders', () => {
    const c = buildSampleContent('SampleElement', { title: 'Real title' });
    expect(c.title).toBe('Real title');
  });

  it('gives image references an inline placeholder, other refs none', () => {
    const c = buildSampleContent('SampleElement');
    expect((c.image as any).url.default).toMatch(/^data:image\/svg\+xml/);
    expect(c.refs).toEqual([]); // allowedTypes: [] → not an image
  });

  it('coerces a flat contentReference url string', () => {
    const c = buildSampleContent('SampleElement', { image: 'https://x.test/a.jpg' });
    expect(c.image).toEqual({ url: { default: 'https://x.test/a.jpg' } });
  });

  it('coerces flat string overrides to the property shape', () => {
    const c = buildSampleContent('SampleElement', {
      link: 'https://example.com', // url → { default }
      published: 'false', // boolean
      count: '9', // integer
    });
    expect(c.link).toEqual({ default: 'https://example.com' });
    expect(c.published).toBe(false);
    expect(c.count).toBe(9);
  });

  it('passes typed (non-string) overrides through untouched', () => {
    const c = buildSampleContent('SampleElement', { link: { default: 'x' } });
    expect(c.link).toEqual({ default: 'x' });
  });

  it('returns just metadata for unknown keys', () => {
    const c = buildSampleContent('DoesNotExist');
    expect(c).toEqual({
      __typename: 'DoesNotExist',
      _metadata: {
        key: 'sample-DoesNotExist',
        types: ['DoesNotExist'],
        displayName: 'DoesNotExist',
      },
    });
  });
});

const Section = contentType({
  key: 'MySection',
  baseType: '_section',
  displayName: 'My Section',
});

const Page = contentType({
  key: 'MyPage',
  baseType: '_page',
  displayName: 'My Page',
  properties: { heading: { type: 'string', displayName: 'Heading' } },
});

const Experience = contentType({
  key: 'MyExperience',
  baseType: '_experience',
  displayName: 'My Experience',
  mayContainTypes: ['*'],
});

/** Flattens a composition tree into a list, deepest-last order not guaranteed. */
function flattenNodes(node: any): any[] {
  return [node, ...(node.nodes ?? []).flatMap(flattenNodes)];
}

describe('sample compositions', () => {
  beforeEach(() => {
    initContentTypeRegistry([Sample, Nested, Section, Page, Experience]);
    initDisplayTemplateRegistry([]);
  });

  it('gives an experience a composition rooted in a registered section', () => {
    const c = buildSampleContent('MyExperience') as any;
    expect(c.composition.nodes).toHaveLength(1);
    expect(c.composition.nodes[0].type).toBe('MySection');
    expect(c.composition.nodes[0].nodeType).toBe('section');
  });

  it('falls back to the built-in blank section when none is registered', () => {
    initContentTypeRegistry([Sample, Experience]);
    const c = buildSampleContent('MyExperience') as any;
    expect(c.composition.nodes[0].type).toBe('BlankSection');
  });

  it('gives a section renderable nodes', () => {
    const c = buildSampleContent('MySection') as any;
    expect(c.key).toBe('sample-MySection');
    expect(c.nodes[0].nodeType).toBe('row');
  });

  it('leaves every column empty so only the layout shows', () => {
    const nodes = flattenNodes(
      (buildSampleContent('MyExperience') as any).composition,
    );
    const columns = nodes.filter(n => n.nodeType === 'column');
    expect(columns).toHaveLength(2);

    const components = nodes.filter(n => n.nodeType === 'component');
    const slots = components.filter(n => n.component._slotKind === 'area');
    const captions = components.filter(n => n.component._slotKind === 'caption');
    // a slot per column, and no sample component competing with the layout
    expect(slots).toHaveLength(2);
    expect(components.filter(n => n.type !== DESIGN_SYSTEM_SLOT)).toHaveLength(0);
    expect(slots[0].component._slotLabel).toBeTruthy();
    // one caption per row plus one per column, so the structure is readable
    expect(captions.map(n => [n.component._slotNode, n.component._slotLabel])).toEqual([
      ['row', 'Row'],
      ['column', 'Column 1'],
      ['column', 'Column 2'],
    ]);
  });

  it('resolves base-type allowedTypes to a real component', () => {
    const WithArea = contentType({
      key: 'WithArea',
      baseType: '_page',
      displayName: 'With area',
      properties: {
        // the common authoring shape: base types, not content type objects
        main: { type: 'array', items: { type: 'content', allowedTypes: ['_component'] } },
      },
    });
    initContentTypeRegistry([Sample, WithArea]);

    const main = (buildSampleContent('WithArea') as any).main;
    expect(main[0].__typename).toBe('SampleElement');
    expect(main[1].__typename).toBe(DESIGN_SYSTEM_SLOT);
  });

  it('leaves pages to their own properties', () => {
    const c = buildSampleContent('MyPage') as any;
    expect(c.composition).toBeUndefined();
    expect(c.nodes).toBeUndefined();
    expect(c.heading).toBe('Build content-driven experiences');
  });
});

const RowStyles = displayTemplate({
  key: 'RowStyles',
  isDefault: true,
  displayName: 'Row styles',
  nodeType: 'row',
  settings: {
    verticalSpacing: {
      editor: 'select',
      displayName: 'Vertical spacing',
      sortOrder: 1,
      choices: {
        // out of order on purpose: the CMS lists choices by sortOrder
        large: { displayName: 'Large', sortOrder: 2 },
        small: { displayName: 'Small', sortOrder: 1 },
      },
    },
  },
});

const ColumnStyles = displayTemplate({
  key: 'ColumnStyles',
  isDefault: true,
  displayName: 'Column styles',
  nodeType: 'column',
  settings: {
    align: {
      editor: 'select',
      displayName: 'Align',
      sortOrder: 1,
      choices: {
        left: { displayName: 'Left', sortOrder: 1 },
        center: { displayName: 'Center', sortOrder: 2 },
      },
    },
  },
});

/** A settings-less template is still a style: it names a wrapper variant. */
const ColumnCard = displayTemplate({
  key: 'ColumnCard',
  isDefault: false,
  displayName: 'Card',
  nodeType: 'column',
  settings: {},
});

const SectionStyles = displayTemplate({
  key: 'SectionStyles',
  isDefault: true,
  displayName: 'Section styles',
  baseType: '_section',
  settings: {
    width: {
      editor: 'select',
      displayName: 'Width',
      sortOrder: 1,
      choices: {
        default: { displayName: 'Default', sortOrder: 1 },
        full: { displayName: 'Full', sortOrder: 2 },
      },
    },
  },
});

describe('layout styles', () => {
  beforeEach(() => {
    initContentTypeRegistry([Sample, Section, Experience]);
    initDisplayTemplateRegistry([RowStyles, ColumnStyles, ColumnCard, SectionStyles]);
  });

  it('lists node-type templates, optionally filtered', () => {
    expect(getNodeTypeTemplates().map(t => t.key)).toEqual([
      'RowStyles',
      'ColumnStyles',
      'ColumnCard',
    ]);
    expect(getNodeTypeTemplates('column').map(t => t.key)).toEqual([
      'ColumnStyles',
      'ColumnCard',
    ]);
    // baseType templates are not layout styles
    expect(getNodeTypeTemplates().map(t => t.key)).not.toContain('SectionStyles');
  });

  it('turns settings into one variant per choice, in sortOrder', () => {
    expect(styleVariants(getNodeTypeTemplates('row'))).toEqual([
      {
        label: 'Vertical spacing: Small',
        templateKey: 'RowStyles',
        settings: [{ key: 'verticalSpacing', value: 'small' }],
      },
      {
        label: 'Vertical spacing: Large',
        templateKey: 'RowStyles',
        settings: [{ key: 'verticalSpacing', value: 'large' }],
      },
    ]);
  });

  it('treats a settings-less template as a style of its own', () => {
    expect(styleVariants(getNodeTypeTemplates('column')).at(-1)).toEqual({
      label: 'Card',
      templateKey: 'ColumnCard',
      settings: null,
    });
  });

  it('yields one unstyled variant when nothing is registered', () => {
    expect(styleVariants([])).toEqual([{ label: '', templateKey: null, settings: null }]);
  });

  it('applies the templates to a sample composition', () => {
    const composition = (buildSampleContent('MyExperience') as any).composition;
    const nodes = flattenNodes(composition);

    // one section per section-style choice
    const sections = nodes.filter(n => n.nodeType === 'section');
    expect(sections.map(n => n.displaySettings)).toEqual([
      [{ key: 'width', value: 'default' }],
      [{ key: 'width', value: 'full' }],
    ]);
    expect(sections.every(n => n.displayTemplateKey === 'SectionStyles')).toBe(true);

    // the first section demos every row style; the rest stay at one row
    const rowsPerSection = sections.map(n => n.nodes.length);
    expect(rowsPerSection).toEqual([2, 1]);

    const rows = nodes.filter(n => n.nodeType === 'row');
    expect(rows[0].displaySettings).toEqual([{ key: 'verticalSpacing', value: 'small' }]);
    expect(rows[1].displaySettings).toEqual([{ key: 'verticalSpacing', value: 'large' }]);

    // one column per column style, each carrying its own template key
    // (nodes[0] is the row caption, which is a component node)
    const columns = rows[0].nodes.filter((n: any) => n.nodeType === 'column');
    expect(columns.map((c: any) => c.displayTemplateKey)).toEqual([
      'ColumnStyles',
      'ColumnStyles',
      'ColumnCard',
    ]);
  });

  it('captions each row and column with the style applied to it', () => {
    const nodes = flattenNodes((buildSampleContent('MyExperience') as any).composition);
    const labels = nodes
      .filter(n => n.component?._slotKind === 'caption')
      .map(n => n.component._slotLabel);

    expect(labels.slice(0, 3)).toEqual([
      'Row · Vertical spacing: Small',
      'Column 1 · Align: Left',
      'Column 2 · Align: Center',
    ]);
    // the settings-less template names itself
    expect(labels).toContain('Column 3 · Card');
  });

  it('puts the row caption in the row, not in a column', () => {
    const rows = flattenNodes(
      (buildSampleContent('MyExperience') as any).composition,
    ).filter(n => n.nodeType === 'row');

    expect(rows[0].nodes[0].component._slotNode).toBe('row');
    // every column then leads with its own caption, so the columns line up
    for (const column of rows[0].nodes.slice(1))
      expect(column.nodes[0].component._slotNode).toBe('column');
  });

  it('captions each section preview with its style', () => {
    expect(buildSectionPreviews('MyExperience').map(p => [p.label, p.rows])).toEqual([
      ['Width: Default', 2],
      ['Width: Full', 1],
    ]);
  });

  it('has nothing to split when there is one section', () => {
    initDisplayTemplateRegistry([RowStyles, ColumnStyles]);
    expect(buildSectionPreviews('MyExperience')).toEqual([]);
  });

  it('keeps node keys unique across sections', () => {
    const nodes = flattenNodes((buildSampleContent('MyExperience') as any).composition);
    const keys = nodes.map(n => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('getCatalogContentTypes', () => {
  it('groups by base type and drops empty groups', () => {
    initContentTypeRegistry([Sample, Section, Page, Experience]);
    expect(
      getCatalogContentTypes().map(g => [g.baseType, g.contentTypes.map(t => t.key)]),
    ).toEqual([
      ['_component', ['SampleElement']],
      ['_section', ['MySection']],
      ['_page', ['MyPage']],
      ['_experience', ['MyExperience']],
    ]);
  });

  it('omits base types with nothing registered', () => {
    initContentTypeRegistry([Sample]);
    expect(getCatalogContentTypes().map(g => g.baseType)).toEqual(['_component']);
  });
});

describe('buildIndividualQuery', () => {
  beforeEach(() => {
    initContentTypeRegistry([Sample, Nested]);
  });

  it('flattens simple props into query params', () => {
    const q = new URLSearchParams(buildIndividualQuery('SampleElement'));
    expect(q.has('individual')).toBe(true);
    expect(q.get('key')).toBe('SampleElement');
    expect(q.get('title')).toBe('Build content-driven experiences');
    expect(q.get('published')).toBe('true');
    expect(q.get('count')).toBe('5');
    expect(q.get('link')).toBe('#'); // url object flattened to its default
  });

  it('bakes in overrides and skips structured values', () => {
    const q = new URLSearchParams(
      buildIndividualQuery('SampleElement', {
        title: 'Real title',
        link: 'https://example.com',
      }),
    );
    expect(q.get('title')).toBe('Real title');
    expect(q.get('link')).toBe('https://example.com');
    // the inline SVG placeholder would bloat the URL
    expect(q.has('image')).toBe(false);
    // richText / arrays / nested components are not URL-friendly
    expect(q.has('body')).toBe(false);
    expect(q.has('teasers')).toBe(false);
    expect(q.has('child')).toBe(false);
  });

  it('round-trips back through buildSampleContent', () => {
    const q = new URLSearchParams(
      buildIndividualQuery('SampleElement', { link: 'https://example.com' }),
    );
    const flat = Object.fromEntries(q.entries());
    delete flat.individual;
    delete flat.key;
    const c = buildSampleContent('SampleElement', flat);
    expect(c.link).toEqual({ default: 'https://example.com' });
    expect(c.published).toBe(true);
    expect(c.count).toBe(5);
  });
});

describe('getDisplayTemplatesFor', () => {
  beforeEach(() => {
    initContentTypeRegistry([Sample]);
    initDisplayTemplateRegistry([
      displayTemplate({
        key: 'ByContentType',
        isDefault: false,
        displayName: 'By content type',
        contentType: 'SampleElement',
        settings: {},
      }),
      displayTemplate({
        key: 'ByBaseType',
        isDefault: false,
        displayName: 'By base type',
        baseType: '_component',
        settings: {},
      }),
      displayTemplate({
        key: 'OtherContentType',
        isDefault: false,
        displayName: 'Other',
        contentType: 'SomethingElse',
        settings: {},
      }),
    ]);
  });

  it('matches by contentType and by baseType, excluding others', () => {
    const keys = getDisplayTemplatesFor('SampleElement').map(t => t.key);
    expect(keys).toContain('ByContentType');
    expect(keys).toContain('ByBaseType'); // Sample.baseType === '_component'
    expect(keys).not.toContain('OtherContentType');
  });
});

describe('isDesignSystemEnabled', () => {
  const prev = { ...process.env };

  it('is on outside production', () => {
    process.env.NODE_ENV = 'development';
    expect(isDesignSystemEnabled()).toBe(true);
    Object.assign(process.env, prev);
  });

  it('is off in production without the flag', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.OPTIMIZELY_DESIGN_SYSTEM;
    expect(isDesignSystemEnabled()).toBe(false);
    Object.assign(process.env, prev);
  });

  it('is on in production with the flag', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPTIMIZELY_DESIGN_SYSTEM = 'true';
    expect(isDesignSystemEnabled()).toBe(true);
    Object.assign(process.env, prev);
  });
});
