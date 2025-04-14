import { contentType } from 'optimizely-cms-sdk';

export const ContentType = contentType({
  key: 'LandingSection',
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
