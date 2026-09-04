import { contentType } from '@optimizely/cms-sdk';
import { ArticleContentType } from './Article';

export const FAQContentType = contentType({
  key: 'FAQ',
  baseType: '_page',
  displayName: 'FAQ',
  mayContainTypes: [ArticleContentType],
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
  },
});
