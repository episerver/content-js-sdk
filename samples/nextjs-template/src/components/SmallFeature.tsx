//type=component

import { contentType } from 'optimizely-cms-sdk';

// properties: heading, image, body
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
