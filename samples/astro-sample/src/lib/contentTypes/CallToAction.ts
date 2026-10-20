import { contentType } from '@optimizely/cms-sdk';

export const CallToActionContentType = contentType({
  key: 'CallToAction',
  baseType: '_component',
  displayName: 'Call to Action',
  properties: {
    label: {
      type: 'string',
    },
    link: {
      type: 'string',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});
