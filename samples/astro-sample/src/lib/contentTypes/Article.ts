import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article page',
  baseType: '_page',
  properties: {
    heading: {
      displayName: 'The Headline',
      type: 'string',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    body: {
      displayName: 'Body',
      type: 'richText',
    },
  },
});
