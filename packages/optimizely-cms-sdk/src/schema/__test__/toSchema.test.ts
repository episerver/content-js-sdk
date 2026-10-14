import { describe, it, expect, test } from 'vitest';
import { toSchema, SchemaValidationError } from '../toSchema.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

describe('toSchema', () => {
  const validBase = {
    _id: 'id-1',
    _metadata: {
      key: 'key-1',
      locale: 'en',
      fallbackForLocale: 'en',
      version: '1',
      displayName: 'Test',
      url: { type: null, default: null, hierarchical: null, internal: null, graph: null, base: null },
      types: ['TestType'],
      published: '2024-01-01',
      status: 'published',
      created: '2024-01-01',
      lastModified: '2024-01-01',
      sortOrder: 0,
      variation: '',
    },
    __typename: 'TestType',
  };

  describe('scalar properties', () => {
    it('should validate string property', () => {
      const ct = contentType({
        key: 'StringTest',
        baseType: '_component',
        displayName: 'String Test',
        properties: { title: { type: 'string' } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({ ...validBase, title: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should validate boolean property', () => {
      const ct = contentType({
        key: 'BoolTest',
        baseType: '_component',
        displayName: 'Bool Test',
        properties: { active: { type: 'boolean' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, active: true }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, active: 'yes' }).success).toBe(false);
    });

    it('should validate integer property', () => {
      const ct = contentType({
        key: 'IntTest',
        baseType: '_component',
        displayName: 'Int Test',
        properties: { count: { type: 'integer' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, count: 42 }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, count: 3.14 }).success).toBe(false);
    });

    it('should validate float property', () => {
      const ct = contentType({
        key: 'FloatTest',
        baseType: '_component',
        displayName: 'Float Test',
        properties: { rating: { type: 'float' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, rating: 3.14 }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, rating: 'abc' }).success).toBe(false);
    });

    it('should validate dateTime property as string', () => {
      const ct = contentType({
        key: 'DateTest',
        baseType: '_component',
        displayName: 'Date Test',
        properties: { publishDate: { type: 'dateTime' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, publishDate: '2024-01-01T00:00:00Z' }).success).toBe(true);
    });

    it('should allow null for any property', () => {
      const ct = contentType({
        key: 'NullTest',
        baseType: '_component',
        displayName: 'Null Test',
        properties: { title: { type: 'string' }, count: { type: 'integer' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, title: null, count: null }).success).toBe(true);
    });
  });

  describe('complex properties', () => {
    it('should validate richText property', () => {
      const ct = contentType({
        key: 'RichTextTest',
        baseType: '_component',
        displayName: 'RichText Test',
        properties: { body: { type: 'richText' } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        body: {
          html: '<p>Hello</p>',
          json: { type: 'richText', children: [{ type: 'paragraph' }] },
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate url property', () => {
      const ct = contentType({
        key: 'UrlTest',
        baseType: '_component',
        displayName: 'Url Test',
        properties: { link: { type: 'url' } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        link: { type: 'default', default: '/page', hierarchical: null, internal: null, graph: null, base: null },
      });
      expect(result.success).toBe(true);
    });

    it('should validate link property', () => {
      const ct = contentType({
        key: 'LinkTest',
        baseType: '_component',
        displayName: 'Link Test',
        properties: { cta: { type: 'link' } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        cta: {
          text: 'Click me',
          title: 'CTA',
          target: '_blank',
          url: { type: null, default: '/page', hierarchical: null, internal: null, graph: null, base: null },
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate contentReference property', () => {
      const ct = contentType({
        key: 'RefTest',
        baseType: '_component',
        displayName: 'Ref Test',
        properties: { image: { type: 'contentReference', allowedTypes: ['*'] } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        image: {
          url: { type: null, default: '/img.png', hierarchical: null, internal: null, graph: null, base: null },
          item: null,
          key: 'img-key',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate content property', () => {
      const ct = contentType({
        key: 'ContentTest',
        baseType: '_component',
        displayName: 'Content Test',
        properties: { area: { type: 'content', allowedTypes: ['*'] } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        area: { __typename: 'HeroBlock', __viewname: 'default' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('array properties', () => {
    it('should validate array of strings', () => {
      const ct = contentType({
        key: 'ArrayStringTest',
        baseType: '_component',
        displayName: 'Array String Test',
        properties: {
          tags: { type: 'array', items: { type: 'string' } },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, tags: ['a', 'b', 'c'] }).success).toBe(true);
    });

    it('should enforce minItems and maxItems', () => {
      const ct = contentType({
        key: 'ArrayMinMaxTest',
        baseType: '_component',
        displayName: 'Array MinMax Test',
        properties: {
          items: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, items: ['a'] }).success).toBe(false);
      expect(schema.safeParse({ ...validBase, items: ['a', 'b'] }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, items: ['a', 'b', 'c', 'd', 'e', 'f'] }).success).toBe(false);
    });
  });

  describe('validation constraints', () => {
    it('should enforce string minLength and maxLength', () => {
      const ct = contentType({
        key: 'StrConstraintTest',
        baseType: '_component',
        displayName: 'String Constraint Test',
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 10 },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, name: 'ab' }).success).toBe(false);
      expect(schema.safeParse({ ...validBase, name: 'abc' }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, name: 'a'.repeat(11) }).success).toBe(false);
    });

    it('should enforce string pattern', () => {
      const ct = contentType({
        key: 'PatternTest',
        baseType: '_component',
        displayName: 'Pattern Test',
        properties: {
          code: { type: 'string', pattern: '^[A-Z]{3}$' },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, code: 'ABC' }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, code: 'abc' }).success).toBe(false);
    });

    it('should enforce integer minimum and maximum', () => {
      const ct = contentType({
        key: 'IntConstraintTest',
        baseType: '_component',
        displayName: 'Int Constraint Test',
        properties: {
          age: { type: 'integer', minimum: 0, maximum: 120 },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, age: -1 }).success).toBe(false);
      expect(schema.safeParse({ ...validBase, age: 25 }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, age: 121 }).success).toBe(false);
    });
  });

  describe('enum constraints', () => {
    it('should validate string enum', () => {
      const ct = contentType({
        key: 'StringEnumTest',
        baseType: '_component',
        displayName: 'String Enum Test',
        properties: {
          theme: {
            type: 'string',
            enum: [
              { value: 'light', displayName: 'Light' },
              { value: 'dark', displayName: 'Dark' },
            ],
          },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, theme: 'light' }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, theme: 'neon' }).success).toBe(false);
    });

    it('should validate integer enum', () => {
      const ct = contentType({
        key: 'IntEnumTest',
        baseType: '_component',
        displayName: 'Int Enum Test',
        properties: {
          priority: {
            type: 'integer',
            enum: [
              { value: 1, displayName: 'Low' },
              { value: 2, displayName: 'Medium' },
              { value: 3, displayName: 'High' },
            ],
          },
        },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, priority: 1 }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, priority: 99 }).success).toBe(false);
    });
  });

  describe('indexingType disabled', () => {
    it('should exclude properties with indexingType disabled', () => {
      const ct = contentType({
        key: 'IndexTest',
        baseType: '_component',
        displayName: 'Index Test',
        properties: {
          visible: { type: 'string' },
          hidden: { type: 'string', indexingType: 'disabled' },
        },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({ ...validBase, visible: 'yes' });
      expect(result.success).toBe(true);
      const result2 = schema.safeParse({ ...validBase, visible: 'yes', hidden: 123 });
      expect(result2.success).toBe(true);
    });
  });

  describe('component properties', () => {
    it('should validate nested component', () => {
      const ButtonCT = contentType({
        key: 'Button',
        baseType: '_component',
        displayName: 'Button',
        properties: { label: { type: 'string' } },
      });

      const HeroCT = contentType({
        key: 'Hero',
        baseType: '_component',
        displayName: 'Hero',
        properties: {
          title: { type: 'string' },
          cta: { type: 'component', contentType: ButtonCT },
        },
      });

      const schema = toSchema(HeroCT);
      const result = schema.safeParse({
        ...validBase,
        title: 'Welcome',
        cta: { label: 'Click me' },
      });
      expect(result.success).toBe(true);
    });

    it('should handle component with string key reference via registry', () => {
      const BannerCT = contentType({
        key: 'Banner',
        baseType: '_component',
        displayName: 'Banner',
        properties: { text: { type: 'string' } },
      });

      initContentTypeRegistry([BannerCT]);

      const PageCT = contentType({
        key: 'PageWithBanner',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          banner: { type: 'component', contentType: 'Banner' as any },
        },
      });

      const schema = toSchema(PageCT);
      const result = schema.safeParse({
        ...validBase,
        banner: { text: 'Hello' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('content type without properties', () => {
    it('should generate valid schema for content type with no properties', () => {
      const ct = contentType({
        key: 'EmptyType',
        baseType: '_component',
        displayName: 'Empty',
        properties: {},
      });
      const schema = toSchema(ct);
      const result = schema.safeParse(validBase);
      expect(result.success).toBe(true);
    });
  });

  describe('passthrough vs strict mode', () => {
    it('should accept extra fields in passthrough mode (default)', () => {
      const ct = contentType({
        key: 'PassthroughTest',
        baseType: '_component',
        displayName: 'Passthrough Test',
        properties: { title: { type: 'string' } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({ ...validBase, title: 'Hi', extraField: 'bonus' });
      expect(result.success).toBe(true);
    });

    it('should reject extra fields in strict mode', () => {
      const ct = contentType({
        key: 'StrictTest',
        baseType: '_component',
        displayName: 'Strict Test',
        properties: { title: { type: 'string' } },
      });
      const schema = toSchema(ct, { strict: true });
      const result = schema.safeParse({ ...validBase, title: 'Hi', extraField: 'bonus' });
      expect(result.success).toBe(false);
    });
  });

  describe('experience content type', () => {
    it('should include composition field for experience type', () => {
      const ct = contentType({
        key: 'ExpTest',
        baseType: '_experience',
        displayName: 'Experience Test',
        properties: { title: { type: 'string' } },
      });
      const schema = toSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        title: 'Test',
        composition: {
          __typename: 'CompositionStructureNode',
          type: null,
          key: 'root',
          layoutType: 'row',
          displayName: 'Root',
          displayTemplateKey: null,
          displaySettings: null,
          nodeType: 'row',
          nodes: [],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('binary and json properties', () => {
    it('should accept any value for json property', () => {
      const ct = contentType({
        key: 'JsonTest',
        baseType: '_component',
        displayName: 'Json Test',
        properties: { data: { type: 'json' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, data: { any: 'thing' } }).success).toBe(true);
      expect(schema.safeParse({ ...validBase, data: 42 }).success).toBe(true);
    });

    it('should accept any value for binary property', () => {
      const ct = contentType({
        key: 'BinaryTest',
        baseType: '_component',
        displayName: 'Binary Test',
        properties: { file: { type: 'binary' } },
      });
      const schema = toSchema(ct);
      expect(schema.safeParse({ ...validBase, file: 'base64data' }).success).toBe(true);
    });
  });

  describe('parse method', () => {
    it('should return data on valid input', () => {
      const ct = contentType({
        key: 'ParseTest',
        baseType: '_component',
        displayName: 'Parse Test',
        properties: { title: { type: 'string' } },
      });
      const schema = toSchema(ct);
      const data = { ...validBase, title: 'Hello' };
      expect(schema.parse(data)).toBe(data);
    });

    it('should throw SchemaValidationError on invalid input', () => {
      const ct = contentType({
        key: 'ParseFailTest',
        baseType: '_component',
        displayName: 'Parse Fail Test',
        properties: { count: { type: 'integer' } },
      });
      const schema = toSchema(ct);
      expect(() => schema.parse({ ...validBase, count: 'not a number' })).toThrow(SchemaValidationError);
    });

    test('the thrown error lists every failure and formats them into its message', () => {
      const ct = contentType({
        key: 'ParseErrorsTest',
        baseType: '_component',
        displayName: 'Parse Errors Test',
        properties: { count: { type: 'integer' } },
      });
      const data = { ...validBase, _id: 7, count: 'many' };

      const error = (() => {
        try {
          toSchema(ct).parse(data);
        } catch (caught) {
          return caught as SchemaValidationError;
        }
      })();

      expect(error?.name).toBe('SchemaValidationError');
      expect(error?.errors).toEqual(errorsOf(ct, data));
      expect(error?.message).toBe(
        'Validation failed with 2 error(s):\n' +
          '  [_id] Expected string, received number\n' +
          '  [count] Expected integer, received string',
      );
    });
  });

  /** The errors `safeParse` reports, or an empty list on success. */
  const errorsOf = (ct: Parameters<typeof toSchema>[0], data: unknown, strict = false) => {
    const result = toSchema(ct, { strict }).safeParse(data);
    return result.success ? [] : result.errors;
  };

  const withProperties = (key: string, properties: Record<string, unknown>) =>
    contentType({ key, baseType: '_component', displayName: key, properties: properties as never });

  describe('error reporting', () => {
    test('base fields are required, and a non-object stops at one error', () => {
      const ct = withProperties('BaseTest', {});

      expect(errorsOf(ct, null)).toEqual([
        { path: [], message: 'Expected object, received null', expected: 'object', received: 'null' },
      ]);
      expect(errorsOf(ct, { _metadata: null }).map(error => error.path)).toEqual([
        ['_id'],
        ['__typename'],
        ['_metadata'],
      ]);
    });

    test('scalar type mismatches name what was expected and received', () => {
      const ct = withProperties('ScalarErrors', {
        flag: { type: 'boolean' },
        count: { type: 'integer' },
        ratio: { type: 'float' },
        when: { type: 'dateTime' },
      });

      expect(errorsOf(ct, { ...validBase, flag: 'yes', count: 1.5, ratio: '0.5', when: 0 })).toEqual([
        { path: ['flag'], message: 'Expected boolean, received string', expected: 'boolean', received: 'string' },
        { path: ['count'], message: 'Expected integer, received float', expected: 'integer', received: 'float' },
        { path: ['ratio'], message: 'Expected number, received string', expected: 'number', received: 'string' },
        { path: ['when'], message: 'Expected dateTime string, received number', expected: 'string', received: 'number' },
      ]);
    });

    test('float enum, minimum and maximum are enforced', () => {
      const ct = withProperties('FloatConstraints', {
        weight: { type: 'float', enum: [{ value: 1.5, displayName: 'Light' }, { value: 3, displayName: 'Heavy' }] },
        ratio: { type: 'float', minimum: 0, maximum: 1 },
      });

      expect(errorsOf(ct, { ...validBase, weight: 1.5, ratio: 0.5 })).toEqual([]);
      expect(errorsOf(ct, { ...validBase, weight: 2.5, ratio: -0.1 }).map(error => error.message)).toEqual([
        'Value 2.5 is not in enum [1.5, 3]',
        'Value must be >= 0',
      ]);
      expect(errorsOf(ct, { ...validBase, ratio: 1.1 }).map(error => error.message)).toEqual(['Value must be <= 1']);
    });

    test('richText fields of the wrong type are reported at their own path', () => {
      const ct = withProperties('RichTextErrors', { body: { type: 'richText' } });

      expect(errorsOf(ct, { ...validBase, body: { html: 5, json: 'text' } })).toEqual([
        { path: ['body', 'html'], message: 'Expected string or null, received number', expected: 'string', received: 'number' },
        { path: ['body', 'json'], message: 'Expected object or null, received string', expected: 'object', received: 'string' },
      ]);
      expect(errorsOf(ct, { ...validBase, body: '<p>hi</p>' })[0].message).toBe(
        'Expected richText object, received string',
      );
    });

    test('url, link, contentReference and content must be objects', () => {
      const ct = withProperties('ObjectErrors', {
        address: { type: 'url' },
        cta: { type: 'link' },
        image: { type: 'contentReference', allowedTypes: ['*'] },
        area: { type: 'content', allowedTypes: ['*'] },
      });

      expect(
        errorsOf(ct, { ...validBase, address: '/page', cta: 1, image: 'img.png', area: true }).map(
          error => error.message,
        ),
      ).toEqual([
        'Expected url object, received string',
        'Expected link object, received number',
        'Expected contentReference object, received string',
        'Expected content object, received boolean',
      ]);
    });

    test('contentReference key and content __typename/__viewname must be strings when present', () => {
      const ct = withProperties('NestedStringErrors', {
        image: { type: 'contentReference', allowedTypes: ['*'] },
        area: { type: 'content', allowedTypes: ['*'] },
      });

      expect(
        errorsOf(ct, { ...validBase, image: { key: 5 }, area: { __typename: 1, __viewname: {} } }).map(
          error => error.path,
        ),
      ).toEqual([
        ['image', 'key'],
        ['area', '__typename'],
        ['area', '__viewname'],
      ]);
    });

    test('array items are validated at their index', () => {
      const ct = withProperties('ArrayItemErrors', { tags: { type: 'array', items: { type: 'string' } } });

      expect(errorsOf(ct, { ...validBase, tags: ['a', 5] })).toEqual([
        { path: ['tags', '1'], message: 'Expected string, received number', expected: 'string', received: 'number' },
      ]);
      expect(errorsOf(ct, { ...validBase, tags: 'a' })[0].message).toBe('Expected array, received string');
    });

    test('component values must be objects, and their properties are validated at a nested path', () => {
      const Button = withProperties('ErrorButton', { label: { type: 'string' } });
      const ct = withProperties('ComponentErrors', { cta: { type: 'component', contentType: Button } });

      expect(errorsOf(ct, { ...validBase, cta: 'Click' })[0].message).toBe(
        'Expected component object, received string',
      );
      expect(errorsOf(ct, { ...validBase, cta: { label: 5 } }).map(error => error.path)).toEqual([['cta', 'label']]);
    });

    test('a component referring to an unregistered type is not validated', () => {
      initContentTypeRegistry([]);
      const ct = withProperties('UnregisteredComponent', { cta: { type: 'component', contentType: 'Missing' } });

      expect(errorsOf(ct, { ...validBase, cta: 'anything' })).toEqual([]);
    });

    test('experience composition nodes are validated recursively', () => {
      const ct = contentType({ key: 'ExpErrors', baseType: '_experience', displayName: 'Exp' });

      const errors = errorsOf(ct, {
        ...validBase,
        composition: {
          __typename: 'CompositionStructureNode',
          key: 'root',
          nodeType: 'row',
          nodes: ['not a node', { __typename: 'CompositionStructureNode', nodeType: 'column' }],
        },
      });

      expect(errors).toEqual([
        {
          path: ['composition', 'nodes', '0'],
          message: 'Expected composition node, received string',
          expected: 'object',
          received: 'string',
        },
        { path: ['composition', 'nodes', '1', 'key'], message: 'Expected string', expected: 'string', received: 'undefined' },
      ]);
    });

    test('a section needs a key and validates its nodes; strict mode accepts both fields', () => {
      const ct = contentType({ key: 'SectionErrors', baseType: '_section', displayName: 'Section' });
      const node = { __typename: 'CompositionStructureNode', key: 'row', nodeType: 'row' };

      expect(errorsOf(ct, { ...validBase, key: 'section', nodes: [node] }, true)).toEqual([]);
      expect(errorsOf(ct, { ...validBase, nodes: [{ ...node, nodeType: 3 }] }).map(error => error.path)).toEqual([
        ['key'],
        ['nodes', '0', 'nodeType'],
      ]);
    });

    test('strict mode names each unexpected property but allows the SDK-added ones', () => {
      const ct = withProperties('StrictErrors', { title: { type: 'string' } });

      expect(
        errorsOf(ct, { ...validBase, title: 'Hi', __context: {}, __composition: {}, extra: 1 }, true),
      ).toEqual([{ path: ['extra'], message: 'Unexpected property in strict mode' }]);
    });
  });
});
