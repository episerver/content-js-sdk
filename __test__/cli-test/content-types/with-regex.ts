import { contentType } from '@episerver/cms-sdk';

export const contentTypeWithRegex = contentType({
  key: 'CT_with_regex',
  baseType: '_page',
  displayName: 'CT_with_regex',
  properties: {
    p1: {
      type: 'string',
    },
  },
});
