import { contentType } from '@optimizely/cms-sdk';

export const SmallFeatureContentType = contentType({
  key: 'SmallFeature',
  baseType: '_component',
  displayName: 'Small feature',
  properties: {
    heading: {
      type: 'string',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    body: {
      type: 'richText',
    },
  },
});
