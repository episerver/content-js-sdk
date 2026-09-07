import { contentType } from '@optimizely/cms-sdk';
import { SmallFeatureContentType } from './SmallFeature';

export const SmallFeatureGridContentType = contentType({
  key: 'SmallFeatureGrid',
  displayName: 'Small feature grid',
  baseType: '_component',
  properties: {
    smallFeatures: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [SmallFeatureContentType],
      },
    },
  },
});
