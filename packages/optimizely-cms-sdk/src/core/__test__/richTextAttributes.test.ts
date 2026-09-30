import { beforeEach, describe, expect, test } from 'vitest';
import { configureAdapter } from '../../context/config.js';
import { MemoryAdapter } from '../context/memoryAdapter.js';
import {
  getMarkTag,
  getRichTextElement,
  getRichTextTree,
  splitAttributes,
  toStyleString,
} from '../richText/attributes.js';

describe('getRichTextTree', () => {
  const document = {
    type: 'richText' as const,
    children: [{ type: 'paragraph', children: [{ text: 'a &amp; b', bold: true }] }],
  };

  test('builds the tree from the document or its JSON string, decoding entities', () => {
    const expected = [
      {
        type: 'element',
        elementType: 'paragraph',
        children: [{ type: 'text', content: 'a & b', marks: ['bold'] }],
      },
    ];

    expect(getRichTextTree(document)).toMatchObject(expected);
    expect(getRichTextTree(JSON.stringify(document))).toMatchObject(expected);
  });

  test('entity decoding can be turned off', () => {
    expect(getRichTextTree(document, { decodeHtmlEntities: false })).toMatchObject([
      { children: [{ content: 'a &amp; b' }] },
    ]);
  });
});

describe('splitAttributes', () => {
  test('CSS keys move to camelCased styles, the rest stay attributes', () => {
    expect(splitAttributes({ 'font-size': '14px', class: 'lead', id: 'x' })).toEqual({
      attributes: { class: 'lead', id: 'x' },
      style: { fontSize: '14px' },
    });
  });

  test('dual-purpose keys are attributes only on the elements that take them', () => {
    expect(splitAttributes({ width: '100' }, 'img')).toEqual({
      attributes: { width: '100' },
      style: {},
    });
    expect(splitAttributes({ width: '100px' }, 'div')).toEqual({
      attributes: {},
      style: { width: '100px' },
    });
  });

  test('old shorthand keys resolve to their text- property', () => {
    expect(splitAttributes({ decoration: 'underline' }).style).toEqual({
      textDecoration: 'underline',
    });
  });

  test('a style string is parsed, and later CSS keys override it', () => {
    expect(splitAttributes({ style: 'color: red; margin: 0', color: 'blue' }).style).toEqual({
      color: 'blue',
      margin: '0',
    });
  });
});

describe('getRichTextElement', () => {
  const element = (elementType: string, attributes: Record<string, unknown> = {}) =>
    getRichTextElement({ type: 'element', elementType, attributes });

  test('the tag comes from the element type, case-insensitively', () => {
    expect(element('Heading-One', { 'text-align': 'center' })).toEqual({
      tag: 'h1',
      selfClosing: false,
      attributes: {},
      style: { textAlign: 'center' },
    });
  });

  test('an unknown element type renders as a span', () => {
    expect(element('mystery').tag).toBe('span');
  });

  test('void elements are reported as self-closing', () => {
    expect(['image', 'br', 'wbr', 'input'].map(type => element(type).selfClosing)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  test('an image keeps its source and dimension attributes', () => {
    expect(element('image', { src: '/a.png', alt: 'A', width: '100' }).attributes).toMatchObject({
      src: '/a.png',
      alt: 'A',
      width: '100',
    });
  });

  describe('in preview', () => {
    beforeEach(() => {
      const adapter = new MemoryAdapter();
      adapter.set('previewToken', 'token');
      configureAdapter(adapter);
    });

    test('an image source gets the preview token', () => {
      expect(element('image', { src: '/a.png' }).attributes.src).toBe('/a.png?preview_token=token');
    });

    test('an image without a source gets none', () => {
      expect(element('image', { alt: 'A' }).attributes).not.toHaveProperty('src');
    });
  });
});

describe('getMarkTag', () => {
  test('known marks map to their tag case-insensitively, unknown ones to span', () => {
    expect(['bold', 'Italic', 'glow'].map(getMarkTag)).toEqual(['strong', 'em', 'span']);
  });
});

describe('toStyleString', () => {
  test('styles are written as kebab-cased declarations', () => {
    expect(toStyleString({ fontSize: '14px', color: 'red' })).toBe('font-size: 14px; color: red');
  });

  test('an empty style gives no string', () => {
    expect(toStyleString({})).toBeUndefined();
  });
});
