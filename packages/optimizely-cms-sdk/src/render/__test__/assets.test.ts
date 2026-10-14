import { describe, expect, test } from 'vitest';
import { damAssets, getAlt, getDamAssetType, getSrcset, isDamAsset } from '../assets.js';
import type { InferredContentReference } from '../../infer.js';

const assetBase = 'https://assets.local-cms.com/0a2f4b27/cmp_73d48db0';

const renditions = [
  { Id: 'thumb', Name: 'Thumbnail', Url: `${assetBase}_thumbnail_100x100.jpg`, Width: 100, Height: 100 },
  { Id: 'small', Name: 'Small', Url: `${assetBase}_small_256x256.jpg`, Width: 256, Height: 256 },
  { Id: 'medium', Name: 'Medium', Url: `${assetBase}_medium_512x512.jpg`, Width: 512, Height: 512 },
  { Id: 'medium2', Name: 'Medium 2', Url: `${assetBase}_medium_512x341.jpg`, Width: 512, Height: 341 },
  { Id: 'large', Name: 'Large', Url: `${assetBase}_large_1920x1920.jpg`, Width: 1920, Height: 1920 },
];

const imageAsset = (item: Record<string, unknown> = {}): InferredContentReference => ({
  key: 'asset-0',
  url: { type: null, default: `${assetBase}.jpg`, hierarchical: null, internal: null, graph: null, base: null },
  item: {
    __typename: 'cmp_PublicImageAsset',
    Url: `${assetBase}.jpg`,
    Title: 'Touring bike',
    AltText: 'A touring motorcycle',
    Description: 'A motorcycle',
    Renditions: renditions,
    FocalPoint: { X: 0.5, Y: 0.5 },
    Tags: [],
    Height: 1080,
    Width: 1920,
    MimeType: 'image/jpeg',
    ...item,
  } as InferredContentReference['item'],
});

const assetOfType = (__typename: string) => ({ ...imageAsset(), item: { __typename } }) as InferredContentReference;

const page = { __typename: 'TestPage' };
const previewPage = { __typename: 'TestPage', __context: { edit: true, preview_token: 'token-123' } };

describe('getSrcset', () => {
  test('lists each rendition width once, keeping the first rendition of a width', () => {
    expect(getSrcset(page, imageAsset())).toBe(
      [
        `${assetBase}_thumbnail_100x100.jpg 100w`,
        `${assetBase}_small_256x256.jpg 256w`,
        `${assetBase}_medium_512x512.jpg 512w`,
        `${assetBase}_large_1920x1920.jpg 1920w`,
      ].join(', '),
    );
  });

  test('appends the preview token from the content to every rendition', () => {
    const entries = getSrcset(previewPage, imageAsset())!.split(', ');

    expect(entries).toHaveLength(4);
    expect(entries.every(it => it.includes('.jpg?preview_token=token-123 '))).toBe(true);
  });

  test('skips renditions without a url or width', () => {
    const asset = imageAsset({
      Renditions: [
        { Id: 'a', Name: 'A', Url: null, Width: 100, Height: 100 },
        { Id: 'b', Name: 'B', Url: `${assetBase}_b.jpg`, Width: null, Height: 100 },
        { Id: 'c', Name: 'C', Url: `${assetBase}_c.jpg`, Width: 300, Height: 100 },
      ],
    });

    expect(getSrcset(page, asset)).toBe(`${assetBase}_c.jpg 300w`);
  });

  test.each([
    ['a null reference', null],
    ['an undefined reference', undefined],
    ['an asset without renditions', imageAsset({ Renditions: [] })],
    ['a non-image asset', assetOfType('cmp_PublicRawFileAsset')],
  ])('returns undefined for %s', (_, asset) => {
    expect(getSrcset(page, asset)).toBeUndefined();
  });
});

describe('getAlt', () => {
  test('returns the asset alt text', () => {
    expect(getAlt(imageAsset(), 'Fallback')).toBe('A touring motorcycle');
  });

  test.each([
    ['the alt text is empty', imageAsset({ AltText: '' })],
    ['the alt text is null', imageAsset({ AltText: null })],
    ['there is no asset', null],
  ])('uses the fallback when %s', (_, asset) => {
    expect(getAlt(asset, 'Fallback')).toBe('Fallback');
  });

  test('defaults to an empty string, marking the image decorative', () => {
    expect(getAlt(null)).toBe('');
  });
});

describe('asset type checks', () => {
  test.each([
    ['cmp_PublicImageAsset', 'image', true],
    ['cmp_PublicVideoAsset', 'video', true],
    ['cmp_PublicRawFileAsset', 'file', true],
    ['SomethingElse', 'unknown', false],
  ])('%s is reported as %s', (typename, expectedType, expectedIsAsset) => {
    const asset = assetOfType(typename);

    expect(getDamAssetType(asset)).toBe(expectedType);
    expect(isDamAsset(asset)).toBe(expectedIsAsset);
  });

  test('a missing reference is no asset', () => {
    expect(getDamAssetType(null)).toBe('unknown');
    expect(isDamAsset(undefined)).toBe(false);
  });
});

describe('damAssets', () => {
  test('scopes getSrcset to the content preview token', () => {
    const { getSrcset: scopedGetSrcset } = damAssets(previewPage);

    expect(scopedGetSrcset(imageAsset())).toBe(getSrcset(previewPage, imageAsset()));
    expect(scopedGetSrcset(imageAsset())).toContain('preview_token=token-123');
  });
});
