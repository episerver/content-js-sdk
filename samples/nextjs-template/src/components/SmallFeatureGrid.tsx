import { contentType } from 'optimizely-cms-sdk';
import { ArticleContentType } from './Article';
import { SmallFeatureContentType } from './SmallFeature';

export const ContentType = contentType({
  key: 'SmallFeatureGrid',
  displayName: 'Small feature grid',
  baseType: 'component',
  properties: {
    features: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: [ArticleContentType, SmallFeatureContentType, '_Image'],
      },
    },
  },
});
