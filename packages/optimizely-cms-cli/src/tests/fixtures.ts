import { contentType } from '@episerver/cms-sdk';

export const HeroComponentType = contentType({
  key: 'HeroComponent',
  displayName: 'Hero Component',
  baseType: '_component',
  properties: {
    heading: {
      type: 'string',
    },
    summary: {
      type: 'string',
    },
    background: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    theme: {
      type: 'string',
      enum: [
        { value: 'light', displayName: 'Light Theme' },
        { value: 'dark', displayName: 'Dark Theme' },
      ],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export const BannerComponentType = contentType({
  key: 'BannerComponent',
  displayName: 'Banner Component',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    submit: {
      type: 'link',
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export const AboutExperienceType = contentType({
  key: 'AboutExperienceType',
  displayName: 'About Experience Type',
  baseType: '_experience',
  properties: {
    title: {
      type: 'string',
      displayName: 'Experience Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Experience Subtitle',
    },
    section: {
      type: 'content',
      restrictedTypes: [HeroComponentType, BannerComponentType],
    },
  },
});
