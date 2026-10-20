import { contentType } from '@optimizely/cms-sdk';

export const LocationContentType = contentType({
  key: 'Location',
  displayName: 'Location component',
  baseType: '_component',
  properties: {
    name: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    address: {
      type: 'string',
    },
    phone: {
      type: 'string',
    },
  },
});
