import { test } from 'vitest';
import { contentType, contract } from '../index.js';

test('contract cannot have baseType field', () => {
  contract({
    key: 'test',
    displayName: 'Test',
    // @ts-expect-error - baseType is never allowed on contracts
    baseType: '_page',
  });
});

test('nested arrays are prevented', () => {
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      nested: {
        type: 'array',
        items: {
          // @ts-expect-error - nested arrays not allowed, inner type cannot be 'array'
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  });
});

test('component property requires contentType field', () => {
  const Hero = contentType({
    key: 'hero',
    displayName: 'Hero',
    baseType: '_component',
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      hero: {
        type: 'component',
        contentType: Hero,
      },
    },
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - contentType field is required for component properties
      hero: {
        type: 'component',
      },
    },
  });
});

test('compositionBehaviors allowed on component type', () => {
  contentType({
    key: 'component',
    displayName: 'Component',
    baseType: '_component',
    compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  });
});

test('content/contentReference require allowedTypes or restrictedTypes', () => {
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - contentReference requires either allowedTypes or restrictedTypes
      ref: { type: 'contentReference' },
    },
  });

  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      // @ts-expect-error - content requires either allowedTypes or restrictedTypes
      area: { type: 'content' },
    },
  });

  // Valid with allowedTypes
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      ref: { type: 'contentReference', allowedTypes: ['*'] },
    },
  });

  // Valid with restrictedTypes
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      area: { type: 'content', restrictedTypes: [] },
    },
  });

  // Valid with both
  contentType({
    key: 'page',
    displayName: 'Page',
    baseType: '_page',
    properties: {
      ref: {
        type: 'contentReference',
        allowedTypes: ['_component'],
        restrictedTypes: ['other'],
      },
    },
  });
});
