import { describe, expect, test } from 'vitest';
import { createFragment, createSingleContentQuery, createMultipleContentQuery } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

describe('createFragment() simple cases', () => {
  test('works for scalar properties', async () => {
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        str: { type: 'string' },
        bin: { type: 'binary' },
        boo: { type: 'boolean' },
        flo: { type: 'float' },
        int: { type: 'integer' },
        dat: { type: 'dateTime' },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ct1__str:str ct1__bin:bin ct1__boo:boo ct1__flo:flo ct1__int:int ct1__dat:dat ..._IContent }",
      ]
    `);
  });

  test('works for arrays of scalar properties', async () => {
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        str: { type: 'array', items: { type: 'string' } },
        bin: { type: 'array', items: { type: 'binary' } },
        boo: { type: 'array', items: { type: 'boolean' } },
        flo: { type: 'array', items: { type: 'float' } },
        int: { type: 'array', items: { type: 'integer' } },
        dat: { type: 'array', items: { type: 'dateTime' } },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ct1__str:str ct1__bin:bin ct1__boo:boo ct1__flo:flo ct1__int:int ct1__dat:dat ..._IContent }",
      ]
    `);
  });

  test('works for compound properties', async () => {
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        lin: { type: 'link' },
        ric: { type: 'richText' },
        lin2: { type: 'array', items: { type: 'link' } },
        ric2: { type: 'array', items: { type: 'richText' } },
      },
    });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ct1__lin:lin { text title target url { ...ContentUrl }} ct1__ric:ric { html, json } ct1__lin2:lin2 { text title target url { ...ContentUrl }} ct1__ric2:ric2 { html, json } ..._IContent }",
      ]
    `);
  });

  test('correct syntax with content types without properties', async () => {
    const ct1 = contentType({ key: 'ct1', displayName: 'CT1', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() with `content` properties. Explicit reference via `allowedTypes`', () => {
  test('one level', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    initContentTypeRegistry([r1, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 } ..._IContent }",
      ]
    `);
  });

  test('two levels', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({
      key: 'r2',
      displayName: 'R2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: [r2] } },
    });
    initContentTypeRegistry([r1, r2, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r2 on r2 { __typename r2__p1:p1 { __typename ...r1 } ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r2 } ..._IContent }",
      ]
    `);
  });

  test('repeated reference', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const ct1 = contentType({
      key: 'r2',
      displayName: 'R2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    const ct2 = contentType({
      key: 'ct2',
      displayName: 'CT2',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: [r1] },
        pct1: { type: 'content', allowedTypes: [ct1] },
      },
    });
    initContentTypeRegistry([r1, ct1, ct2]);
    const result = await createFragment('ct2');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r2 on r2 { __typename r2__p1:p1 { __typename ...r1 } ..._IContent }",
        "fragment ct2 on ct2 { __typename ct2__p1:p1 { __typename ...r1 } ct2__pct1:pct1 { __typename ...r2 } ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() with `content` properties. Base types', () => {
  test('one level', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });
    initContentTypeRegistry([r1, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 } ..._IContent }",
      ]
    `);
  });

  test('two levels', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({
      key: 'r2',
      displayName: 'R2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });
    initContentTypeRegistry([r1, r2, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r2 on r2 { __typename r2__p1:p1 { __typename ...r1 ...r2 } ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 ...r2 } ..._IContent }",
      ]
    `);
  });

  test('resolve correctly when `allowedTypes` is a base type', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', displayName: 'R2', baseType: '_component' });
    const r3 = contentType({ key: 'r3', displayName: 'R3', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['_component'],
        },
      },
    });

    initContentTypeRegistry([r1, r2, r3, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r2 on r2 { __typename ..._IContent }",
        "fragment r3 on r3 { __typename ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 ...r2 ...r3 } ..._IContent }",
      ]
    `);
  });

  test('repeated reference', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({
      key: 'r2',
      displayName: 'R2',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: [r1] } },
    });
    const ct2 = contentType({
      key: 'ct2',
      displayName: 'CT2',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: [r1] },
        p2: { type: 'content', allowedTypes: ['_component'] },
      },
    });
    initContentTypeRegistry([r1, r2, ct2]);
    const result = await createFragment('ct2');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r2 on r2 { __typename r2__p1:p1 { __typename ...r1 } ..._IContent }",
        "fragment ct2 on ct2 { __typename ct2__p1:p1 { __typename ...r1 } ct2__p2:p2 { __typename ...r1 ...r2 } ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() with `content` properties. Allowed and restricted types', () => {
  test('only restricted', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', displayName: 'R2', baseType: '_component' });
    const r3 = contentType({ key: 'r3', displayName: 'R3', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          restrictedTypes: [r2],
        },
      },
    });

    initContentTypeRegistry([r1, r2, r3, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r3 on r3 { __typename ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 ...r3 ...ct1 } ..._IContent }",
      ]
    `);
  });

  test('allowed and restricted', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', displayName: 'R2', baseType: '_component' });
    const r3 = contentType({ key: 'r3', displayName: 'R3', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['_component'],
          restrictedTypes: [r2],
        },
      },
    });

    initContentTypeRegistry([r1, r2, r3, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r3 on r3 { __typename ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 ...r3 } ..._IContent }",
      ]
    `);
  });

  test('wildcard allowedTypes', async () => {
    const r1 = contentType({ key: 'r1', displayName: 'R1', baseType: '_component' });
    const r2 = contentType({ key: 'r2', displayName: 'R2', baseType: '_component' });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['*'],
        },
      },
    });

    initContentTypeRegistry([r1, r2, ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename ..._IContent }",
        "fragment r2 on r2 { __typename ..._IContent }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename ...r1 ...r2 ...ct1 } ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() with self references', () => {
  test('explicit self-reference', async () => {
    const r1 = contentType({
      key: 'r1',
      displayName: 'R1',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: ['_self'] } },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename r1__p1:p1 { __typename ...r1 } ..._IContent }",
      ]
    `);
  });

  test('without any limitations', async () => {
    const r1 = contentType({
      key: 'r1',
      displayName: 'R1',
      baseType: '_component',
      properties: { p1: { type: 'content', restrictedTypes: [] } },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename r1__p1:p1 { __typename ...r1 } ..._IContent }",
      ]
    `);
  });

  test('with allowed (its own base type)', async () => {
    const r1 = contentType({
      key: 'r1',
      displayName: 'R1',
      baseType: '_component',
      properties: { p1: { type: 'content', allowedTypes: ['_component'] } },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename r1__p1:p1 { __typename ...r1 } ..._IContent }",
      ]
    `);
  });

  test('with allowed (its own base type)', async () => {
    const r2 = contentType({ key: 'r2', displayName: 'R2', baseType: '_component' });
    const r1 = contentType({
      key: 'r1',
      displayName: 'R1',
      baseType: '_component',
      properties: {
        p1: {
          type: 'content',
          allowedTypes: ['_component'],
          restrictedTypes: [r2],
        },
      },
    });

    initContentTypeRegistry([r1]);
    const result = await createFragment('r1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment r1 on r1 { __typename r1__p1:p1 { __typename ...r1 } ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() empty objects', () => {
  test('properties with indexType', async () => {
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: { type: 'string', indexingType: 'disabled' },
        p2: { type: 'string', indexingType: 'queryable' },
        p3: { type: 'string', indexingType: 'searchable' },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ct1__p2:p2 ct1__p3:p3 ..._IContent }",
      ]
    `);
  });

  test('only with disabled indexType', async () => {
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: { type: 'string', indexingType: 'disabled' },
        p2: { type: 'string', indexingType: 'disabled' },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ..._IContent }",
      ]
    `);
  });

  test('correct syntax when referring to an empty set', async () => {
    // In this test, there is one content type "ct1" that has a `content` property, with allowed types = "_component"
    // But there is no content type with base type '_component'.
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: ['_component'] },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');

    // Make sure that the query is correct. The `p1 {}` part should have something between the curly braces
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { __typename } ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() with component properties', () => {
  test('simple case', async () => {
    const ctBlock = contentType({
      key: 'ctBlock',
      displayName: 'CTBlock',
      baseType: '_component',
      properties: {
        p1: { type: 'string' },
      },
    });
    const ct1 = contentType({
      key: 'ct1',
      displayName: 'CT1',
      baseType: '_page',
      properties: {
        p1: { type: 'component', contentType: ctBlock },
      },
    });
    initContentTypeRegistry([ct1, ctBlock]);
    const result = await createFragment('ct1');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ctBlockProperty on ctBlockProperty { __typename ctBlockProperty__p1:p1 }",
        "fragment ct1 on ct1 { __typename ct1__p1:p1 { ...ctBlockProperty } ..._IContent }",
      ]
    `);
  });
});

describe('createFragment() with string key references', () => {
  test('string key in allowedTypes resolves to correct fragment', async () => {
    const ctA = contentType({
      key: 'ctA',
      displayName: 'CT A',
      baseType: '_component',
      properties: { title: { type: 'string' } },
    });
    const ctB = contentType({
      key: 'ctB',
      displayName: 'CT B',
      baseType: '_page',
      properties: {
        ref: { type: 'content', allowedTypes: ['ctA'] },
      },
    });

    initContentTypeRegistry([ctA, ctB]);
    const result = await createFragment('ctB');
    const ctBFragment = result.fragments.find((f: string) =>
      f.startsWith('fragment ctB '),
    );
    expect(ctBFragment).toContain('...ctA');
    const ctAFragment = result.fragments.find((f: string) =>
      f.startsWith('fragment ctA '),
    );
    expect(ctAFragment).toBeDefined();
  });

  test('circular references using string keys', async () => {
    const ctA = contentType({
      key: 'ctA',
      displayName: 'CT A',
      baseType: '_component',
      properties: {
        refB: { type: 'content', allowedTypes: ['ctB'] },
      },
    });
    const ctB = contentType({
      key: 'ctB',
      displayName: 'CT B',
      baseType: '_component',
      properties: {
        refA: { type: 'content', allowedTypes: ['ctA'] },
      },
    });

    initContentTypeRegistry([ctA, ctB]);
    const result = await createFragment('ctA');
    const ctAFragment = result.fragments.find((f: string) =>
      f.startsWith('fragment ctA '),
    );
    const ctBFragment = result.fragments.find((f: string) =>
      f.startsWith('fragment ctB '),
    );
    expect(ctAFragment).toContain('...ctB');
    expect(ctBFragment).toContain('...ctA');
  });

  test('mix of ContentType objects and string keys', async () => {
    const ctA = contentType({
      key: 'ctA',
      displayName: 'CT A',
      baseType: '_component',
      properties: { title: { type: 'string' } },
    });
    const ctB = contentType({
      key: 'ctB',
      displayName: 'CT B',
      baseType: '_component',
      properties: { title: { type: 'string' } },
    });
    const ctC = contentType({
      key: 'ctC',
      displayName: 'CT C',
      baseType: '_page',
      properties: {
        ref: { type: 'content', allowedTypes: [ctA, 'ctB'] },
      },
    });

    initContentTypeRegistry([ctA, ctB, ctC]);
    const result = await createFragment('ctC');
    const ctCFragment = result.fragments.find((f: string) =>
      f.startsWith('fragment ctC '),
    );
    expect(ctCFragment).toContain('...ctA');
    expect(ctCFragment).toContain('...ctB');
  });
});

describe('deterministic query output', () => {
  test('single content query produces identical strings on repeated calls', () => {
    const ct1 = contentType({ key: 'DetTest', displayName: 'DetTest', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const query1 = createSingleContentQuery('DetTest', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-key' });
    const query2 = createSingleContentQuery('DetTest', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-key' });

    expect(query1).toBe(query2);
  });

  test('multiple content query produces identical strings on repeated calls', () => {
    const ct1 = contentType({ key: 'DetTest2', displayName: 'DetTest2', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const query1 = createMultipleContentQuery('DetTest2', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-path' });
    const query2 = createMultipleContentQuery('DetTest2', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-path' });

    expect(query1).toBe(query2);
  });

  test('single content query uses scalar variables, not complex inputs', () => {
    const ct1 = contentType({ key: 'ScalarTest', displayName: 'ScalarTest', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const query = createSingleContentQuery('ScalarTest', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-key' });

    expect(query).toContain('$key: String');
    expect(query).not.toContain('_ContentWhereInput');
    expect(query).not.toContain('VariationInput');
  });

  test('multiple content query uses scalar variables, not complex inputs', () => {
    const ct1 = contentType({ key: 'ScalarTest2', displayName: 'ScalarTest2', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const query = createMultipleContentQuery('ScalarTest2', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-path' });

    expect(query).toContain('$path: String');
    expect(query).toContain('$pathNoSlash: String');
    expect(query).not.toContain('_ContentWhereInput');
    expect(query).not.toContain('VariationInput');
  });

  test('preview query inlines variation: { include: ALL }', () => {
    const ct1 = contentType({ key: 'PreviewTest', displayName: 'PreviewTest', baseType: '_page' });
    initContentTypeRegistry([ct1]);

    const query = createSingleContentQuery('PreviewTest', { damEnabled: false, maxFragmentThreshold: 100, expandContracts: true, filterShape: 'by-key', variationMode: 'all' });

    expect(query).toContain('variation: { include: ALL }');
    expect(query).toContain('$key: String');
    expect(query).toContain('$metadataLocale: String');
    expect(query).toContain('$version: String');
  });
});
