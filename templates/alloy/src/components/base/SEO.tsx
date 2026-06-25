import { contentType } from '@optimizely/cms-sdk';

export const SEOContentType = contentType({
  key: 'SEO',
  displayName: 'SEO Properties',
  baseType: '_component',
  properties: {
    site_title: {
      type: 'string',
      displayName: 'Title',
      group: 'SEO',
    },
    keywords: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Keywords',
      group: 'SEO',
    },
    page_description: {
      type: 'string',
      displayName: 'Page Description',
      group: 'SEO',
    },
    disable_indexing: {
      type: 'boolean',
      displayName: 'Disable Indexing',
      group: 'SEO',
    },
  },
});
