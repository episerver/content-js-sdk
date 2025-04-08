import { contentType } from 'optimizely-cms-sdk';
import { LandingSection } from './LandingSection';

export const ContentType = contentType({
  key: 'InFocus',
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
        views: [LandingSection],
      },
    },
  },
});
