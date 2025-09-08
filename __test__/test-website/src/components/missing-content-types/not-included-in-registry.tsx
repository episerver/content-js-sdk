import { contentType } from '@episerver/cms-sdk';

// This content type IS synced to the CMS but is not included in the Registry (via initContentType)
export const notInRegistry = contentType({
  baseType: '_component',
  key: 'test_c6',
  displayName:
    "test_c6: This content type is not added in the 'initContentTypeRegistry')",
  properties: {
    p1: { type: 'string' },
  },
});
