import { contentType, displayTemplate } from 'optimizely-cms-sdk';

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
    features: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['SmallFeatureGrid'],
      },
    },
  },
});

export const DisplayTemplate = displayTemplate({
  key: 'LandingSectionDisplayTemplate',
  isDefault: true,
  displayName: 'LandingSectionDisplayTemplate',
  contentType: 'LandingSection',
  settings: {
    background: {
      editor: 'select',
      displayName: 'Background',
      sortOrder: 0,
      choices: {
        red: {
          displayName: 'Red',
          sortOrder: 0,
        },
        blue: {
          displayName: 'Blue',
          sortOrder: 1,
        },
      },
    },
  },
});
