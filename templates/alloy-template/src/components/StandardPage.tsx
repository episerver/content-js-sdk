import { contentType } from '@episerver/cms-sdk';

export const StandardPage = contentType({
  key: 'StandardPage',
  displayName: 'Standard Page',
  baseType: '_experience',
  properties: {
    teaser_image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
    },
    teaser_text: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    unique_selling_points: {
      type: 'string',
      displayName: 'Unique Selling Points',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    large_content_area: {
      type: 'array',
      displayName: 'Large Content Area',
      items: {
        type: 'contentReference',
      },
    },
    small_content_area: {
      type: 'array',
      displayName: 'Small Content Area',
      items: {
        type: 'contentReference',
      },
    },
    title: {
      type: 'string',
    },
    keywords: {
      type: 'string',
    },
    page_description: {
      type: 'string',
    },
  },
});
