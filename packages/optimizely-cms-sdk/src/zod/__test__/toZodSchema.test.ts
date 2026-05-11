import { describe, it, expect, beforeAll } from 'vitest';
import { toZodSchema } from '../toZodSchema.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

describe('toZodSchema', () => {
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
      expect(schema.safeParse({ ...validBase, publishDate: '2024-01-01T00:00:00Z' }).success).toBe(true);
    });

    it('should allow null for any property', () => {
      const ct = contentType({
        key: 'NullTest',
        baseType: '_component',
        displayName: 'Null Test',
        properties: { title: { type: 'string' }, count: { type: 'integer' } },
      });
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
        properties: { image: { type: 'contentReference' } },
      });
      const schema = toZodSchema(ct);
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
        properties: { area: { type: 'content' } },
      });
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
      const result = schema.safeParse({ ...validBase, visible: 'yes' });
      expect(result.success).toBe(true);
      // hidden property should not be required or validated
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

      const schema = toZodSchema(HeroCT);
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

      const schema = toZodSchema(PageCT);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct, { strict: true });
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
      const schema = toZodSchema(ct);
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

  describe('circular component references', () => {
    it('should handle self-referencing content type', () => {
      const TreeNodeCT: any = {
        key: 'TreeNode',
        baseType: '_component' as const,
        displayName: 'Tree Node',
        properties: {
          label: { type: 'string' as const },
        },
      };
      TreeNodeCT.properties.child = { type: 'component', contentType: TreeNodeCT };
      const ct = contentType(TreeNodeCT);

      const schema = toZodSchema(ct);
      const result = schema.safeParse({
        ...validBase,
        label: 'Root',
        child: { label: 'Child', child: null },
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
      const schema = toZodSchema(ct);
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
      const schema = toZodSchema(ct);
      expect(schema.safeParse({ ...validBase, file: 'base64data' }).success).toBe(true);
    });
  });
});
