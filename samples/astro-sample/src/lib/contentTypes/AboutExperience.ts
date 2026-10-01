import { contentType } from '@optimizely/cms-sdk';
import { HeroContentType } from './Hero';
import { BannerContentType } from './Banner';

export const AboutExperienceContentType = contentType({
  key: 'AboutExperience',
  displayName: 'About Experience',
  baseType: '_experience',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    section: {
      type: 'content',
      restrictedTypes: [HeroContentType, BannerContentType],
    },
  },
});
