import { describe, expect, test, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { generateMockContent } from '../mockContent.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

const Author = contentType({
  key: 'Author',
  displayName: 'Author',
  baseType: '_component',
  properties: { Name: { type: 'string' } },
});

const Article = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    Title: { type: 'string', displayName: 'Headline' },
    Summary: { type: 'string', maxLength: 400 },
    Alignment: {
      type: 'string',
      enum: [
        { value: 'left', displayName: 'Left' },
        { value: 'right', displayName: 'Right' },
      ],
    },
    Body: { type: 'richText' },
    Cta: { type: 'link' },
    Cover: { type: 'contentReference', allowedTypes: ['_image'] },
    Attachment: { type: 'contentReference', allowedTypes: ['_page'] },
    Writer: { type: 'component', contentType: Author },
    Tags: { type: 'array', items: { type: 'string', displayName: 'Tag' } },
    Published: { type: 'dateTime' },
    Featured: { type: 'boolean' },
    Rank: { type: 'integer', minimum: 3 },
  },
});

beforeEach(() => {
  initContentTypeRegistry([Article, Author]);
});

describe('generateMockContent', () => {
  const content = () => generateMockContent(Article) as any;

  test('fills each property with a value of the shape Graph returns', () => {
    const mock = content();

    expect(mock.__typename).toBe('Article');
    expect(mock._metadata.types).toContain('Article');
    expect(mock.Title).toBe('Headline');
    expect(mock.Alignment).toBe('left');
    expect(mock.Body.json.children[0].children[0].text).toContain('Body');
    expect(mock.Cta).toMatchObject({ target: '_self', url: { default: '/example' } });
    expect(mock.Published).toBe('2024-01-01T12:00:00Z');
    expect(mock.Featured).toBe(true);
    expect(mock.Rank).toBe(3);
  });

  test('a long string reads as body copy, a short one names itself', () => {
    expect(content().Summary.length).toBeGreaterThan(120);
    expect(content().Title.length).toBeLessThan(30);
  });

  test('only media references point at an image', () => {
    expect(content().Cover.url.default).toMatch(/^data:image\/svg\+xml/);
    expect(content().Attachment.url.default).toBe('/example');
  });

  test('nested components and arrays are filled too', () => {
    expect(content().Writer.Name).toBe('Name');
    expect(content().Tags).toEqual(['Tag', 'Tag']);
  });

  test('the same type always generates the same content', () => {
    expect(content()).toEqual(content());
  });

  test('a self-referencing type stops instead of recursing forever', () => {
    const Node: any = contentType({
      key: 'Node',
      displayName: 'Node',
      baseType: '_component',
      properties: { Label: { type: 'string' } },
    });
    Node.properties.Child = { type: 'component', contentType: Node };
    initContentTypeRegistry([Node]);

    const mock = generateMockContent(Node) as any;

    expect(mock.Child.Child.Child.Child).toBeNull();
  });
});

describe('composition holders', () => {
  const Section = contentType({
    key: 'Hero',
    displayName: 'Hero',
    baseType: '_section',
    properties: {},
  });

  const Experience = contentType({
    key: 'Landing',
    displayName: 'Landing',
    baseType: '_experience',
    properties: {},
  });

  test('a section renders with an empty composition rather than crashing', () => {
    expect((generateMockContent(Section) as any).nodes).toEqual([]);
  });

  test('an experience carries the composition field Graph gives it', () => {
    const composition = (generateMockContent(Experience) as any).composition;

    expect(composition.nodes).toEqual([]);
    expect(composition.__typename).toBe('CompositionStructureNode');
  });
});

describe('with faker', () => {
  const Copy = contentType({
    key: 'Copy',
    displayName: 'Copy',
    baseType: '_component',
    properties: {
      Headline: { type: 'string' },
      Body: { type: 'string', maxLength: 400 },
      AuthorName: { type: 'string' },
      ContactEmail: { type: 'string' },
      Website: { type: 'string' },
      Rank: { type: 'integer', maximum: 50 },
      Published: { type: 'dateTime' },
    },
  });

  const content = () => generateMockContent(Copy, { mockData: faker }) as any;

  test('fills text from what the property is called', () => {
    const mock = content();

    expect(mock.ContactEmail).toMatch(/@/);
    expect(mock.Website).toMatch(/^https?:\/\//);
    expect(mock.AuthorName).toMatch(/\w+ \w+/);
    expect(mock.Body.length).toBeGreaterThan(50);
    // Nothing is the property's own name any more.
    expect(mock.Headline).not.toBe('Headline');
  });

  test('stays the same across reloads, so a preview does not reshuffle', () => {
    expect(content()).toEqual(content());
  });

  test('two content types do not get identical copy', () => {
    const Other = contentType({
      key: 'Other',
      displayName: 'Other',
      baseType: '_component',
      properties: { Headline: { type: 'string' } },
    });

    expect((generateMockContent(Other, { mockData: faker }) as any).Headline).not.toBe(
      content().Headline,
    );
  });

  test('without faker the properties still name themselves', () => {
    expect((generateMockContent(Copy) as any).Headline).toBe('Headline');
  });
});

describe('developer-supplied mock data', () => {
  const Hero = contentType({
    key: 'Hero',
    displayName: 'Hero',
    baseType: '_component',
    properties: { Headline: { type: 'string' }, Kicker: { type: 'string' } },
  });

  test('predefined data replaces the generated field, and only that field', () => {
    const mock = generateMockContent(Hero, {
      mockData: { Hero: { Headline: 'Set it. Sweat it.' } },
    }) as any;

    expect(mock.Headline).toBe('Set it. Sweat it.');
    expect(mock.Kicker).toBe('Kicker');
    expect(mock._metadata.key).toBe('mock-Hero');
  });

  test('a content type with no entry is generated as usual', () => {
    const mock = generateMockContent(Hero, { mockData: { Other: { Headline: 'x' } } });

    expect((mock as any).Headline).toBe('Headline');
  });

  test('a factory sees what the schema produced and can build on it', () => {
    const mock = generateMockContent(Hero, {
      mockData: (contentType, generated) => ({
        ...generated,
        Headline: `From ${contentType.key}`,
      }),
    }) as any;

    expect(mock.Headline).toBe('From Hero');
    expect(mock.Kicker).toBe('Kicker');
  });

  test('a factory returning nothing falls back to the generated content', () => {
    const mock = generateMockContent(Hero, { mockData: () => undefined }) as any;

    expect(mock.Headline).toBe('Headline');
  });
});
