import { contentType } from 'optimizely-cms-sdk';

export const ContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: 'page',
  properties: {
    heading: { type: 'string' },
    summary: { type: 'string' },

    background: { type: 'contentReference' },
    theme: {
      type: 'string',
      enum: {
        values: [
          { displayName: 'Dark', value: 'dark' },
          { displayName: 'Light', value: 'light' },
        ],
      },
    },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['LandingSection'],
      },
    },
  },
});
