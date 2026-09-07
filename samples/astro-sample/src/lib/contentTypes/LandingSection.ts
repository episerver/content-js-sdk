import { contentType, displayTemplate } from '@optimizely/cms-sdk';
import { SmallFeatureGridContentType } from './SmallFeatureGrid';
import { VideoFeatureContentType } from './VideoFeature';

export const LandingSectionContentType = contentType({
  key: 'LandingSection',
  baseType: '_component',
  displayName: 'Landing Section',
  properties: {
    heading: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [SmallFeatureGridContentType, VideoFeatureContentType],
      },
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export const LandingSectionDisplayTemplate = displayTemplate({
  key: 'LandingSectionDisplayTemplate',
  isDefault: true,
  displayName: 'LandingSectionDisplayTemplate',
  baseType: '_component',
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
