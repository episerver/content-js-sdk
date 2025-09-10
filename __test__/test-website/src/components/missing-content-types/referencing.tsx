import { contentType } from '@episerver/cms-sdk';

// This content type IS synced to the CMS.
export const ct4 = contentType({
  baseType: '_page',
  displayName:
    'test_c4: Refer to a content type that is not synced to graph (missing in the CMS)',
  key: 'test_c4_refs_missing',

  properties: {
    p1: {
      type: 'content',
      allowedTypes: ['_component'],
    },
  },
});

// This content type IS synced to the CMS.
export const ct5 = contentType({
  baseType: '_page',
  displayName:
    'test_c5: Refer to a content type that is not in the app registry (forgot to call "initContentTypeRegistry")',
  key: 'test_c5_refs_missing',

  properties: {
    p1: {
      type: 'content',
      allowedTypes: ['_component'],
    },
  },
});
