import { contentType } from 'optimizely-cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: 'page',
  properties: {
    headline: {
      type: 'string',
    },
    thumbnail: {
      type: 'contentReference',
      allowedTypes: ['Image'],
    },
    body: {
      type: 'richText',
    },
  },
});
