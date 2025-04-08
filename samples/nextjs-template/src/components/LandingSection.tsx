import { contentType } from 'optimizely-cms-sdk';

export const LandingSection = contentType({
  key: 'InFocusSection',
  baseType: 'component',
  displayName: 'Landing Section',
  properties: {
    heading: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
  },
});
