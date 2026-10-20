import { contentType } from '@optimizely/cms-sdk';
import { HeroContentType } from './Hero';
import { LandingSectionContentType } from './LandingSection';

export const LandingPageContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    hero: {
      type: 'component',
      contentType: HeroContentType,
    },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [LandingSectionContentType],
      },
    },
  },
});
