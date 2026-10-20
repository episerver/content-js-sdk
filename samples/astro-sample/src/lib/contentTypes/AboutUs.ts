import { contentType } from '@optimizely/cms-sdk';

export const AboutUsContentType = contentType({
  key: 'AboutUs',
  baseType: '_component',
  displayName: 'About Us',
  properties: {
    heading: {
      type: 'string',
      group: 'Content',
    },
    body: {
      type: 'richText',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});
