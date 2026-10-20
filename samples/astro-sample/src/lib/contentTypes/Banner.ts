import { contentType } from '@optimizely/cms-sdk';

export const BannerContentType = contentType({
  key: 'Banner',
  displayName: 'Banner',
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
