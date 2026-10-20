import { describe, expect, test } from 'vitest';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

const ctImage = contentType({
  key: 'ctImage',
  displayName: 'CT Image',
  baseType: '_image',
  properties: { AltText: { type: 'string' } },
});

const ctArticle = contentType({
  key: 'ctArticle',
  displayName: 'CT Article',
  baseType: '_page',
  properties: { title: { type: 'string' } },
});

/** The fragment of the type under test, which is always the last one. */
const rootFragment = (fragments: string[]) => fragments.at(-1)!;

describe('contentReference resolves its item', () => {
  test('a reference to a media type fetches the referenced content', async () => {
    const ctPage = contentType({
      key: 'ctPage',
      displayName: 'CT Page',
      baseType: '_page',
      properties: { hero: { type: 'contentReference', allowedTypes: [ctImage] } },
    });
    initContentTypeRegistry([ctImage, ctArticle, ctPage]);

    const { fragments } = createFragment('ctPage');

    expect(rootFragment(fragments)).toContain(
      'hero { key url { ...ContentUrl } item { __typename ...ctImage } }',
    );
    // Alt text and the image dimensions come along with the page.
    expect(fragments).toContain(
      'fragment ctImage on ctImage { __typename ctImage__AltText:AltText ..._IContent ctImage__assetMetadata:_assetMetadata { fileSize mimeType url } ctImage__imageMetadata:_imageMetadata { width height } }',
    );
  });

  test('a reference by media base type fetches that base type', async () => {
    const ctPage = contentType({
      key: 'ctPage',
      displayName: 'CT Page',
      baseType: '_page',
      properties: { hero: { type: 'contentReference', allowedTypes: ['_image'] } },
    });
    initContentTypeRegistry([ctImage, ctArticle, ctPage]);

    const { fragments } = createFragment('ctPage');

    expect(rootFragment(fragments)).toContain(
      'hero { key url { ...ContentUrl } item { __typename ...ctImage ..._image } }',
    );
  });

  test('a reference to a page keeps key and url only', async () => {
    const ctPage = contentType({
      key: 'ctPage',
      displayName: 'CT Page',
      baseType: '_page',
      properties: { related: { type: 'contentReference', allowedTypes: [ctArticle] } },
    });
    initContentTypeRegistry([ctImage, ctArticle, ctPage]);

    const { fragments } = createFragment('ctPage');

    expect(rootFragment(fragments)).toContain('related { key url { ...ContentUrl } }');
  });

  test('an array of references resolves each item', async () => {
    const ctPage = contentType({
      key: 'ctPage',
      displayName: 'CT Page',
      baseType: '_page',
      properties: {
        gallery: {
          type: 'array',
          items: { type: 'contentReference', allowedTypes: [ctImage] },
        },
      },
    });
    initContentTypeRegistry([ctImage, ctArticle, ctPage]);

    const { fragments } = createFragment('ctPage');

    expect(rootFragment(fragments)).toContain(
      'gallery { key url { ...ContentUrl } item { __typename ...ctImage } }',
    );
  });
});
