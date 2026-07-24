import { describe, it, expect } from 'vitest';
import { validateContentAreaConstraints } from '../utils/mapping.js';
import { contentType } from '@optimizely/cms-sdk';

describe('validateContentAreaConstraints', () => {
  it('should return warnings for content properties without allowedTypes or restrictedTypes', () => {
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
        },
      }),
    ];

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('PageType');
    expect(warnings[0]).toContain('mainContent');
  });

  it('should return no warnings when allowedTypes is set', () => {
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

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(0);
  });

  it('should return no warnings when restrictedTypes is set', () => {
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

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(0);
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
            items: {
              type: 'content',
              restrictedTypes: [],
            },
          },
        },
      }),
    ];

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('sections');
  });

  it('should return no warnings for content types without properties', () => {
    const types = [
      contentType({
        key: 'EmptyType',
        baseType: '_page',
        displayName: 'Empty',
        properties: {},
      }),
    ];

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(0);
  });

  it('should return no warnings for empty content types array', () => {
    const { warnings } = validateContentAreaConstraints([]);
    expect(warnings).toHaveLength(0);
  });

  it('should detect multiple violations across multiple content types', () => {
    const types = [
      contentType({
        key: 'PageA',
        baseType: '_page',
        displayName: 'Page A',
        properties: {
          area1: {
            type: 'content',
            restrictedTypes: [],
          },
        },
      }),
      contentType({
        key: 'PageB',
        baseType: '_page',
        displayName: 'Page B',
        properties: {
          area2: {
            type: 'content',
            restrictedTypes: [],
          },
        },
      }),
    ];

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain('PageA');
    expect(warnings[1]).toContain('PageB');
  });

  it('should not warn for non-content property types', () => {
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

    const { warnings } = validateContentAreaConstraints(types);
    expect(warnings).toHaveLength(0);
  });
});
