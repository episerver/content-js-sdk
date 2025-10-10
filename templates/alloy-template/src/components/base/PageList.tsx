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
      displayName: 'IncludePublishDate',
    },
    IncludeIntroduction: {
      type: 'boolean',
      displayName: 'IncludeIntroduction',
    },
    Count: {
      type: 'integer',
      displayName: 'Count',
    },
    SortOrder: {
      type: 'integer',
      displayName: 'SortOrder',
    },
    Root: {
      type: 'contentReference',
      format: 'PageReference',
      displayName: 'Root',
      restrictedTypes: [],
    },
    PageTypeFilter: {
      type: 'string',
      format: 'PageType',
      displayName: 'PageTypeFilter',
    },
    CategoryFilter: {
      type: 'array',
      format: 'categorization',
      displayName: 'CategoryFilter',
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
