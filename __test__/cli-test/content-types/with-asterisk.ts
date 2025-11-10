import { contentType } from '@optimizely/cms-sdk';

export const contentTypeWithRegexProperty = contentType({
  key: 'CT_with_asterisk',
  baseType: '_page',
  displayName: 'CT_with_asterisk',
  properties: {},
  mayContainTypes: ['*'],
});
