import { contentType } from 'optimizely-cms-sdk';

export const ContentType = contentType({
  key: 'SmallFeatureGrid',
  displayName: 'Small feature grid',
  baseType: 'component',
  properties: {
    features: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['Article', 'SmallFeature'],
      },
    },
  },
});
