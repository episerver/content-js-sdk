import { describe, expect, test } from 'vitest';
import {
  createFragment,
  createSingleContentQuery,
  createMultipleContentQuery,
} from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

describe('createFragment() with damEnabled for contentReference properties', () => {
  test('damEnabled = false should not include ContentReferenceItem fragment', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    initContentTypeRegistry([ct1]);

    // DAM disabled
    const result = await createFragment('ct1', new Set(), '', true, false);

    // Should not include ContentReferenceItem fragments
    expect(result.some((line) => line.includes('PublicImageAsset'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('PublicVideoAsset'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('PublicRawFileAsset'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      false,
    );

    // Should only include key and url (no ...ContentReferenceItem)
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename image { key url { ...ContentUrl } } ..._IContent }",
      ]
    `);
  });

  test('damEnabled = true should include ContentReferenceItem fragment', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    initContentTypeRegistry([ct1]);

    // DAM enabled
    const result = await createFragment('ct1', new Set(), '', true, true);

    // Should include all ContentReferenceItem fragments
    expect(result.some((line) => line.includes('PublicImageAsset'))).toBe(true);
    expect(result.some((line) => line.includes('PublicVideoAsset'))).toBe(true);
    expect(result.some((line) => line.includes('PublicRawFileAsset'))).toBe(
      true,
    );
    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      true,
    );

    expect(result).toMatchInlineSnapshot(`
      [
        "fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }",
        "fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }",
        "fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }",
        "fragment ContentReferenceItem on ContentReference { item { __typename ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }",
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename image { key url { ...ContentUrl } ...ContentReferenceItem } ..._IContent }",
      ]
    `);
  });

  test('damEnabled = false with array of contentReference', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        images: { type: 'array', items: { type: 'contentReference' } },
      },
    });
    initContentTypeRegistry([ct1]);

    // DAM disabled
    const result = await createFragment('ct1', new Set(), '', true, false);

    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      false,
    );
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename images { key url { ...ContentUrl } } ..._IContent }",
      ]
    `);
  });

  test('damEnabled = true with array of contentReference', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        images: { type: 'array', items: { type: 'contentReference' } },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1', new Set(), '', true, true);

    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      true,
    );
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }",
        "fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }",
        "fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }",
        "fragment ContentReferenceItem on ContentReference { item { __typename ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }",
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename images { key url { ...ContentUrl } ...ContentReferenceItem } ..._IContent }",
      ]
    `);
  });

  test('damEnabled with nested component containing contentReference', async () => {
    const ctBlock = contentType({
      key: 'ctBlock',
      baseType: '_component',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        block: { type: 'component', contentType: ctBlock },
      },
    });
    initContentTypeRegistry([ct1, ctBlock]);

    // Test with damEnabled = false
    const resultDisabled = await createFragment(
      'ct1',
      new Set(),
      '',
      true,
      false,
    );
    expect(
      resultDisabled.some((line) => line.includes('ContentReferenceItem')),
    ).toBe(false);

    // Test with damEnabled = true
    const resultEnabled = await createFragment(
      'ct1',
      new Set(),
      '',
      true,
      true,
    );
    expect(
      resultEnabled.some((line) => line.includes('ContentReferenceItem')),
    ).toBe(true);
    expect(resultEnabled).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }",
        "fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }",
        "fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }",
        "fragment ContentReferenceItem on ContentReference { item { __typename ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }",
        "fragment ctBlockProperty on ctBlockProperty { __typename image { key url { ...ContentUrl } ...ContentReferenceItem } }",
        "fragment ct1 on ct1 { __typename ct1__block:block { ...ctBlockProperty } ..._IContent }",
      ]
    `);
  });

  test('damEnabled with content property containing contentReference', async () => {
    const ctRef = contentType({
      key: 'ctRef',
      baseType: '_component',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        content: { type: 'content', allowedTypes: [ctRef] },
      },
    });
    initContentTypeRegistry([ct1, ctRef]);

    // Test with damEnabled = true
    const result = await createFragment('ct1', new Set(), '', true, true);
    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      true,
    );
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment PublicImageAsset on cmp_PublicImageAsset { Url Title AltText Description MimeType Height Width Renditions { Id Name Url Width Height } FocalPoint { X Y } Tags { Guid Name } }",
        "fragment PublicVideoAsset on cmp_PublicVideoAsset { Url Title AltText Description MimeType Renditions { Id Name Url Width Height } Tags { Guid Name } }",
        "fragment PublicRawFileAsset on cmp_PublicRawFileAsset { Url Title Description MimeType Tags { Guid Name } }",
        "fragment ContentReferenceItem on ContentReference { item { __typename ...PublicImageAsset ...PublicVideoAsset ...PublicRawFileAsset } }",
        "fragment ctRef on ctRef { __typename image { key url { ...ContentUrl } ...ContentReferenceItem } ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__content:content { __typename ...ctRef } ..._IContent }",
      ]
    `);
  });

  test('damEnabled = true but NO contentReference properties should NOT include DAM fragments', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        title: { type: 'string' },
        description: { type: 'richText' },
        link: { type: 'url' },
      },
    });
    initContentTypeRegistry([ct1]);

    // DAM enabled but no contentReference properties
    const result = await createFragment('ct1', new Set(), '', true, true);

    // Should NOT include DAM fragments
    expect(result.some((line) => line.includes('PublicImageAsset'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('PublicVideoAsset'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('PublicRawFileAsset'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      false,
    );

    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ct1__title:title ct1__description:description { html, json } ct1__link:link { ...ContentUrl } ..._IContent }",
      ]
    `);
  });

  test('damEnabled = true with nested content without contentReference should NOT include DAM fragments', async () => {
    const ctBlock = contentType({
      key: 'ctBlock',
      baseType: '_component',
      properties: {
        text: { type: 'string' },
      },
    });
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        block: { type: 'component', contentType: ctBlock },
      },
    });
    initContentTypeRegistry([ct1, ctBlock]);

    const result = await createFragment('ct1', new Set(), '', true, true);

    // Should NOT include DAM fragments since no contentReference anywhere
    expect(result.some((line) => line.includes('ContentReferenceItem'))).toBe(
      false,
    );
    expect(result.some((line) => line.includes('PublicImageAsset'))).toBe(
      false,
    );
  });
});

describe('createSingleContentQuery() with damEnabled', () => {
  test('createSingleContentQuery: damEnabled = false should not include DAM fragments', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    initContentTypeRegistry([ct1]);

    const query = await createSingleContentQuery('ct1', false);

    expect(query.includes('PublicImageAsset')).toBe(false);
    expect(query.includes('ContentReferenceItem')).toBe(false);
    expect(query).toContain('image { key url { ...ContentUrl } }');
  });

  test('createSingleContentQuery: damEnabled = true should include DAM fragments', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    initContentTypeRegistry([ct1]);

    const query = await createSingleContentQuery('ct1', true);

    expect(query.includes('PublicImageAsset')).toBe(true);
    expect(query.includes('PublicVideoAsset')).toBe(true);
    expect(query.includes('PublicRawFileAsset')).toBe(true);
    expect(query.includes('ContentReferenceItem')).toBe(true);
    expect(query).toContain(
      'image { key url { ...ContentUrl } ...ContentReferenceItem }',
    );
  });
});

describe('createMultipleContentQuery() with damEnabled', () => {
  test('createMultipleContentQuery: damEnabled = false should not include DAM fragments', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    initContentTypeRegistry([ct1]);

    const query = await createMultipleContentQuery('ct1', false);

    expect(query.includes('PublicImageAsset')).toBe(false);
    expect(query.includes('ContentReferenceItem')).toBe(false);
  });

  test('createMultipleContentQuery: damEnabled = true should include DAM fragments', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        image: { type: 'contentReference' },
      },
    });
    initContentTypeRegistry([ct1]);

    const query = await createMultipleContentQuery('ct1', true);

    expect(query.includes('PublicImageAsset')).toBe(true);
    expect(query.includes('PublicVideoAsset')).toBe(true);
    expect(query.includes('PublicRawFileAsset')).toBe(true);
    expect(query.includes('ContentReferenceItem')).toBe(true);
  });
});
