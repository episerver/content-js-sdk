import { contentType } from '../../model';

export const callToAction = contentType({
  baseType: 'component',
  key: 'CallToAction',
  properties: {
    label: { type: 'string' },
    link: { type: 'string' },
  },
});

export const heroBlock = contentType({
  baseType: 'component',
  key: 'Hero',
  properties: {
    heading: { type: 'string' },
    callToAction: {
      type: 'array',
      items: { type: 'content', views: [callToAction] },
    },
  },
});

export const superHeroBlock = contentType({
  baseType: 'component',
  key: 'SuperHero',
  properties: {
    heading: { type: 'string' },
    embed_video: { type: 'string' },
    callToAction: {
      type: 'array',
      items: { type: 'content', views: [callToAction] },
    },
  },
});

export const landingPage = contentType({
  baseType: 'page',
  key: 'LandingPage',
  properties: {
    hero: { type: 'content', views: [heroBlock, superHeroBlock] },
    body: { type: 'richText' },
  },
});

export const articlePage = contentType({
  baseType: 'page',
  key: 'ArticlePage',
  properties: {
    body: { type: 'richText' },
    relatedArticle: { type: 'link' },
    source: { type: 'url' },
    tags: { type: 'array', items: { type: 'string' } },
  },
});
