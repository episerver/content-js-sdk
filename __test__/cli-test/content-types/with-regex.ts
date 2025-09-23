import { contentType } from '@optimizely/cms-sdk';

export const contentTypeWithRegexProperty = contentType({
  key: 'CT_with_regex_property',
  baseType: '_page',
  displayName: 'CT_with_regex',
  properties: {
    p1: {
      type: 'string',
      pattern: '\\d\\d\\d\\d-\\d\\d-\\d\\d',
    },
  },
});
