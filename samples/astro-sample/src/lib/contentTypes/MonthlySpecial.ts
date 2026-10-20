import { contentType } from '@optimizely/cms-sdk';
import { BlogCardContentType } from './BlogCard';

export const MonthlySpecialContentType = contentType({
  key: 'MonthlySpecial',
  displayName: 'Monthly Special',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    blog: {
      type: 'content',
      allowedTypes: [BlogCardContentType],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});
