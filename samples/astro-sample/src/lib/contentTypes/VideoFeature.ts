import { contentType } from '@optimizely/cms-sdk';

export const VideoFeatureContentType = contentType({
  key: 'VideoFeature',
  baseType: '_component',
  displayName: 'Video Feature',
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
    thumbnail_image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    thumbnail_caption: {
      type: 'string',
    },
    video_link: {
      type: 'string',
    },
  },
});
