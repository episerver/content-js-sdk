import { describe, expect, test } from 'vitest';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

describe('createFragment() creates types for base types', () => {
  const ctImage = contentType({
    key: 'ctImage',
    baseType: '_image',
    properties: { p1: { type: 'string' } },
  });
  const ctVideo = contentType({
    key: 'ctVideo',
    baseType: '_video',
    properties: { p1: { type: 'boolean' } },
  });
  const ctMedia = contentType({
    key: 'ctMedia',
    baseType: '_media',
    properties: { p1: { type: 'float' } },
  });

  test('should not create extra fragments when referred explicitly', async () => {
    const ctPage = contentType({
      key: 'ctPage',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: [ctImage, ctVideo, ctMedia] },
      },
    });

    initContentTypeRegistry([ctImage, ctVideo, ctMedia, ctPage]);

    const result = await createFragment('ctPage');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ctImage on ctImage { __typename ctImage__p1:p1 ..._IContent }",
        "fragment ctVideo on ctVideo { __typename ctVideo__p1:p1 ..._IContent }",
        "fragment ctMedia on ctMedia { __typename ctMedia__p1:p1 ..._IContent }",
        "fragment ctPage on ctPage { __typename ctPage__p1:p1 { __typename ...ctImage ...ctVideo ...ctMedia } ..._IContent }",
      ]
    `);
  });

  test('should create base types when referred by base type', async () => {
    const ctPage = contentType({
      key: 'ctPage',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: ['_image', '_video', '_media'] },
      },
    });

    initContentTypeRegistry([ctImage, ctVideo, ctMedia, ctPage]);

    const result = await createFragment('ctPage');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ctImage on ctImage { __typename ctImage__p1:p1 ..._IContent }",
        "fragment _image on _Image { __typename ..._IContent }",
        "fragment ctVideo on ctVideo { __typename ctVideo__p1:p1 ..._IContent }",
        "fragment _video on _Video { __typename ..._IContent }",
        "fragment ctMedia on ctMedia { __typename ctMedia__p1:p1 ..._IContent }",
        "fragment _media on _Media { __typename ..._IContent }",
        "fragment ctPage on ctPage { __typename ctPage__p1:p1 { __typename ...ctImage ..._image ...ctVideo ..._video ...ctMedia ..._media } ..._IContent }",
      ]
    `);
  });
});
