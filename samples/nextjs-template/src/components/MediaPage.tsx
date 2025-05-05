import { contentType } from 'optimizely-cms-sdk';

export const MyMediaPageContentType = contentType({
  baseType: 'page',
  key: 'myMediaPage',
  properties: {
    media: {
      type: 'content',
      allowedTypes: ['Image', 'Media', 'Video'],
    },
  },
});
