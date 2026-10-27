import { describe, expect, test } from 'vitest';
import { getPreviewUtils } from '../server.js';
import type { InferredContentReference } from '../../infer.js';

const asset = (defaultUrl: string | null, itemUrl: string | null): InferredContentReference => ({
  key: 'asset-0',
  url: { type: null, default: defaultUrl, hierarchical: null, internal: null, graph: null, base: null },
  item: {
    __typename: 'cmp_PublicImageAsset',
    Url: itemUrl,
    Title: 'Test Image',
    AltText: 'Test alt text',
    Description: 'Test description',
    Renditions: [],
    FocalPoint: null,
    Tags: [],
    Height: null,
    Width: null,
    MimeType: 'image/jpeg',
  },
});

const page = { __typename: 'TestPage' };
const editPage = { __typename: 'TestPage', __context: { edit: true, preview_token: 'token-123' } };
const tokenPage = { ...editPage, __context: { ...editPage.__context, usePreviewToken: true } };

describe('getPreviewUtils().src', () => {
  test.each([
    ['prefers url.default over item.Url', asset('https://example.com/default.jpg', 'https://example.com/item.jpg'), 'https://example.com/default.jpg'],
    ['uses url.default when item.Url is null', asset('https://example.com/default.jpg', null), 'https://example.com/default.jpg'],
    ['falls back to item.Url when url.default is null', asset(null, 'https://example.com/item.jpg'), 'https://example.com/item.jpg'],
    ['returns a string URL as-is', 'https://example.com/image.jpg', 'https://example.com/image.jpg'],
  ])('%s', (_, input, expected) => {
    expect(getPreviewUtils(page).src(input)).toBe(expected);
  });

  test.each([
    ['an asset URL', asset('https://example.com/default.jpg', null), 'https://example.com/default.jpg?preview_token=token-123'],
    ['a string URL', 'https://example.com/image.jpg', 'https://example.com/image.jpg?preview_token=token-123'],
    ['a URL with a query', 'https://example.com/image.jpg?width=500', 'https://example.com/image.jpg?width=500&preview_token=token-123'],
  ])('appends the preview token to %s when the preview opted in', (_, input, expected) => {
    expect(getPreviewUtils(tokenPage).src(input)).toBe(expected);
  });

  test('leaves the preview token off in preview mode unless opted in', () => {
    expect(getPreviewUtils(editPage).src('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['an asset without a URL', asset(null, null)],
  ])('returns undefined for %s', (_, input) => {
    expect(getPreviewUtils(editPage).src(input)).toBeUndefined();
  });
});

describe('getPreviewUtils().pa', () => {
  test('marks a property as editable in edit mode', () => {
    expect(getPreviewUtils(editPage).pa('Heading')).toEqual({ 'data-epi-edit': 'Heading' });
  });

  test('marks a node as a selectable block in edit mode', () => {
    expect(getPreviewUtils(editPage).pa({ key: 'block-1' })).toEqual({ 'data-epi-block-id': 'block-1' });
  });

  test('adds nothing without a property', () => {
    expect(getPreviewUtils(editPage).pa()).toEqual({});
  });

  test('adds nothing outside edit mode', () => {
    const { pa } = getPreviewUtils({ __typename: 'TestPage', __context: { edit: false, preview_token: 'token-123' } });

    expect(pa('Heading')).toEqual({});
    expect(pa({ key: 'block-1' })).toEqual({});
  });
});
