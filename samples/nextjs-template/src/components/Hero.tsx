import { contentType } from 'optimizely-cms-sdk';

export const ContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: 'component',
  properties: {
    heading: {
      type: 'string',
    },
    summary: {
      type: 'string',
    },
    background: {
      type: 'contentReference',
      allowedTypes: ['_Image'],
    },
    theme: {
      type: 'string',
      enum: {
        values: [
          { value: 'light', displayName: 'Light' },
          { value: 'dark', displayName: 'Dark' },
        ],
      },
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});
