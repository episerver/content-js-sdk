import { contentType } from 'optimizely-cms-sdk';
import { ArticleContentType } from './Article';

export const ArticleListContentType = contentType({
  key: 'ArticleList',
  baseType: 'component',
  properties: {
    large_article: {
      type: 'contentReference',
      allowedTypes: [ArticleContentType],
    },
    small_articles: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: [ArticleContentType],
      },
    },
  },
});

// We will need to do another query to fetch
// the headline for each "large_article" and "small_articles"
