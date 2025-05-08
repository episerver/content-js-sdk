import { contentType } from '../../model';
import { AnyContentType } from '../../model/contentTypes';

export const callToAction = contentType({
  baseType: 'component',
  key: 'CallToAction',
  properties: {
    label: { type: 'string' },
    link: { type: 'string' },
  },
});

export const myButton = contentType({
  baseType: 'component',
  key: 'myButton',
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
      items: { type: 'content', allowedTypes: [callToAction, myButton] },
    },
  },
});

export const specialHeroBlock = contentType({
  baseType: 'component',
  key: 'SpecialHero',
  properties: {
    heading: { type: 'string' },
    primaryCallToAction: {
      type: 'content',
      allowedTypes: [callToAction],
    },
    callToAction: {
      type: 'array',
      items: { type: 'content', allowedTypes: [callToAction, callToAction] },
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
      items: { type: 'content', allowedTypes: [callToAction] },
    },
  },
});

export const landingPage = contentType({
  baseType: 'page',
  key: 'LandingPage',
  properties: {
    hero: {
      type: 'content',
      allowedTypes: [heroBlock, superHeroBlock, specialHeroBlock],
    },
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

export const aboutBlock = contentType({
  baseType: 'component',
  key: 'AboutContent',
  properties: {
    heading: { type: 'string' },
    embed_video: { type: 'string' },
    callToAction: {
      type: 'array',
      items: { type: 'content', allowedTypes: [callToAction, myButton] },
    },
  },
});

export const aboutPage = contentType({
  baseType: 'page',
  key: 'AboutPage',
  properties: {
    hero: {
      type: 'content',
      allowedTypes: [heroBlock],
      restrictedTypes: [myButton],
    },
    body: { type: 'richText' },
  },
});

export const fAQPage = contentType({
  baseType: 'page',
  key: 'fAQPage',
  properties: {
    hero: {
      type: 'content',
      allowedTypes: [myButton, heroBlock, superHeroBlock],
    },
    body: { type: 'richText' },
  },
});

export const contactUsPage = contentType({
  baseType: 'page',
  key: 'contactUsPage',
  properties: {
    others: {
      type: 'content',
      restrictedTypes: [myButton],
    },
    body: { type: 'richText' },
  },
});

export const allContentTypes: AnyContentType[] = [
  callToAction,
  specialHeroBlock,
  heroBlock,
  superHeroBlock,
  landingPage,
  articlePage,
  myButton,
  aboutPage,
  aboutBlock,
  contactUsPage,
  fAQPage,
];
