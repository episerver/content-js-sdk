import { describe, it, expect } from 'vitest';
import { validateContentAreaConstraints } from '../utils/mapping.js';
import { contentType } from '@optimizely/cms-sdk';

describe('validateContentAreaConstraints', () => {
  it('should return errors for content properties without any type constraints', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          mainContent: { type: 'content' } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('PageType');
    expect(errors[0]).toContain('mainContent');
    expect(errors[0]).toContain('missing type constraints');
  });

  it('should return errors for empty allowedTypes or restrictedTypes', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          mainContent: {
            type: 'content',
            restrictedTypes: [],
          },
          image: {
            type: 'contentReference',
            allowedTypes: [],
            restrictedTypes: [],
          },
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('mainContent');
    expect(errors[0]).toContain('empty type constraints');
    expect(errors[0]).toContain('"restrictedTypes"');
    expect(errors[1]).toContain('"allowedTypes" and "restrictedTypes"');
  });

  it('should return an error for an empty list even when contentType is set', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          image: {
            type: 'contentReference',
            contentType: 'ImageType',
            allowedTypes: [],
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('empty type constraints');
  });

  it('should return no errors when allowedTypes is set', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          mainContent: {
            type: 'content',
            allowedTypes: ['_component'],
          },
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(0);
  });

  it('should return no errors when restrictedTypes is set', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          mainContent: {
            type: 'content',
            restrictedTypes: ['Banner'],
          },
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(0);
  });

  it('should detect unconstrained array items of type content', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          sections: {
            type: 'array',
            items: { type: 'content' },
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('sections');
    expect(errors[0]).toContain('missing type constraints');
  });

  it('should return no errors for content types without properties', () => {
    const types = [
      contentType({
        key: 'EmptyType',
        baseType: '_page',
        displayName: 'Empty',
        properties: {},
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(0);
  });

  it('should return no errors for empty content types array', () => {
    const { errors } = validateContentAreaConstraints([]);
    expect(errors).toHaveLength(0);
  });

  it('should detect multiple violations across multiple content types', () => {
    const types = [
      contentType({
        key: 'PageA',
        baseType: '_page',
        displayName: 'Page A',
        properties: {
          area1: { type: 'content' } as any,
        },
      }),
      contentType({
        key: 'PageB',
        baseType: '_page',
        displayName: 'Page B',
        properties: {
          area2: { type: 'content', restrictedTypes: [] },
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('PageA');
    expect(errors[1]).toContain('PageB');
  });

  it('should not report non-content property types', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          title: { type: 'string' },
          body: { type: 'richText' },
          image: { type: 'contentReference', allowedTypes: ['_image'] },
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(0);
  });

  it('should error for an unconstrained contentReference', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          image: { type: 'contentReference' } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('image');
    expect(errors[0]).toContain('missing type constraints');
  });

  it('should return no errors when only contentType is set', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          image: { type: 'contentReference', contentType: 'ImageType' } as any,
          area: { type: 'content', contentType: 'Banner' } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(0);
  });

  it('should error when contentType is combined with allowedTypes or restrictedTypes', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          image: {
            type: 'contentReference',
            contentType: 'ImageType',
            allowedTypes: ['_image'],
          } as any,
          area: {
            type: 'content',
            contentType: 'Banner',
            restrictedTypes: ['Hero'],
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('image');
    expect(errors[0]).toContain('conflicting type constraints');
    expect(errors[1]).toContain('area');
  });

  it('should error for array items combining contentType with allowedTypes', () => {
    const types = [
      contentType({
        key: 'PageType',
        baseType: '_page',
        displayName: 'Page',
        properties: {
          sections: {
            type: 'array',
            items: {
              type: 'content',
              contentType: 'Banner',
              allowedTypes: ['Hero'],
            },
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('sections');
    expect(errors[0]).toContain('conflicting type constraints');
  });
});
