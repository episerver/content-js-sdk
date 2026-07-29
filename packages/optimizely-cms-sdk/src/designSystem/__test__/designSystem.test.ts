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
  getDisplayTemplatesFor,
  isDesignSystemEnabled,
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
    expect(c._metadata).toEqual({ types: ['SampleElement'] });
  });

  it('generates type-appropriate placeholders', () => {
    const c = buildSampleContent('SampleElement');
    expect(c.title).toBe('Title'); // displayName fallback
    expect(c.published).toBe(true);
    expect(c.count).toBe(5); // minimum
    expect((c.body as any).json.children[0].type).toBe('paragraph');
    expect(c.link).toEqual({ default: '#' });
    expect(c.tags).toEqual(['Sample tags']);
  });

  it('prefers the first enum value', () => {
    const c = buildSampleContent('SampleElement');
    expect(c.level).toBe('h2');
  });

  it('recurses into nested component properties', () => {
    const c = buildSampleContent('SampleElement');
    expect((c.child as any).__typename).toBe('NestedElement');
    expect((c.child as any).label).toBe('Label');
  });

  it('builds sample items for array-of-content', () => {
    const c = buildSampleContent('SampleElement');
    expect(Array.isArray(c.teasers)).toBe(true);
    expect((c.teasers as any[])[0].__typename).toBe('NestedElement');
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
      _metadata: { types: ['DoesNotExist'] },
    });
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
    expect(q.get('title')).toBe('Title');
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
