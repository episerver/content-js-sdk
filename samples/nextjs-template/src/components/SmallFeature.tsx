import { contentType } from 'optimizely-cms-sdk';

export const SmallFeatureContentType = contentType({
  key: 'SmallFeature',
  baseType: 'component',
  displayName: 'Small feature',
  properties: {
    heading: {
      type: 'string',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['Image'],
    },
    media: {
      type: 'content',
      allowedTypes: ['Image', 'Media', 'Video'],
    },
    body: {
      type: 'richText',
    },
  },
});
