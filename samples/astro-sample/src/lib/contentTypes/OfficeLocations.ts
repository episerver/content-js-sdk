import { contentType } from '@optimizely/cms-sdk';
import { LocationContentType } from './Location';

export const OfficeContentType = contentType({
  key: 'OfficeLocations',
  displayName: 'Office Locations',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    offices: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [LocationContentType],
      },
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});
