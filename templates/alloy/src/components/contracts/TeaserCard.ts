import { contract } from '@optimizely/cms-sdk';

export const TeaserCardContract = contract({
  key: 'TeaserCard',
  displayName: 'Teaser Card',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    description: {
      type: 'string',
      displayName: 'Teaser Description',
    },
    image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
      allowedTypes: ['_image'],
    },
  },
});
