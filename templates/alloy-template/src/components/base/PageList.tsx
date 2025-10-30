import { contentType } from '@optimizely/cms-sdk';

const PageList = contentType({
  key: 'PageListBlock',
  displayName: '',
  description: '',
  baseType: '_component',
  properties: {
    Heading: {
      type: 'string',
      displayName: 'Heading',
    },
    IncludePublishDate: {
      type: 'boolean',
      displayName: 'Include Publish Date',
    },
    IncludeIntroduction: {
      type: 'boolean',
      displayName: 'Include Introduction',
    },
    Count: {
      type: 'integer',
      displayName: 'Max Count',
    },
    SortOrder: {
      type: 'integer',
      displayName: 'Sort Order',
    },
    Root: {
      type: 'contentReference',
      format: 'PageReference',
      displayName: 'Root',
    },
    PageTypeFilter: {
      type: 'string',
      format: 'PageType',
      displayName: 'Page Type Filter',
    },
    CategoryFilter: {
      type: 'array',
      format: 'categorization',
      displayName: 'Category Filter',
      items: {
        type: 'integer',
      },
    },
    Recursive: {
      type: 'boolean',
      displayName: 'Recursive',
    },
  },
});
