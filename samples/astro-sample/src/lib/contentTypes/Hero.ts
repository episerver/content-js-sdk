import { contentType } from '@optimizely/cms-sdk';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: '_component',
  properties: {
    heading: {
      type: 'string',
    },
    summary: {
      type: 'string',
    },
    background: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    theme: {
      type: 'string',
      enum: [
        { value: 'light', displayName: 'Light' },
        { value: 'dark', displayName: 'Dark' },
      ],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});
