import { contentType } from 'optimizely-cms-sdk';

export const ContentType = contentType({
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
    body: {
      type: 'richText',
    },
  },
});
