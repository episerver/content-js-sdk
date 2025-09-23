// The content types in this file ARE NOT synced to the CMS
import { contentType } from '@optimizely/cms-sdk';
import { notInRegistry } from './not-included-in-registry';

export const notSynced = contentType({
  key: 'not_synced_to_cms',
  baseType: '_component',
  displayName: 'Not synced to the CMS',
  properties: {
    p1: { type: 'string' },
  },
});

export const ct4 = contentType({
  baseType: '_page',
  displayName:
    'test_c4: SHOULD NOT BE SYNCED. Refer to a content type that is not synced to graph (missing in the CMS)',
  key: 'test_c4_refs_missing',

  properties: {
    p1: {
      type: 'content',
      allowedTypes: [notSynced],
    },
  },
});

export const ct5 = contentType({
  baseType: '_page',
  displayName:
    'test_c5: SHOULD NOT BE SYNCED. Refer to a content type that is not in the app registry (forgot to call "initContentTypeRegistry")',
  key: 'test_c5_refs_missing',

  properties: {
    p1: {
      type: 'content',
      allowedTypes: [notInRegistry],
    },
  },
});
