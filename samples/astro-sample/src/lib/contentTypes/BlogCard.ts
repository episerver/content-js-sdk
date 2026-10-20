import { contentType } from '@optimizely/cms-sdk';

export const BlogCardContentType = contentType({
  key: 'BlogCard',
  displayName: 'Blog Card',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    author: {
      type: 'string',
      displayName: 'Author',
    },
    date: {
      type: 'dateTime',
      displayName: 'Date',
    },
  },
});
