import { contentType } from '@optimizely/cms-sdk';
import { BlogCardContentType } from './BlogCard';

export const BlogExperienceContentType = contentType({
  key: 'BlogExperience',
  displayName: 'Blog Experience',
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
    articles: {
      type: 'array',
      displayName: 'Articles',
      items: {
        type: 'content',
        allowedTypes: [BlogCardContentType],
      },
    },
  },
});
