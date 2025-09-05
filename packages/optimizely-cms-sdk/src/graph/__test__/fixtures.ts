import { contentType } from '../../model/index.js';
import { AnyContentType } from '../../model/contentTypes.js';

export const callToAction = contentType({
  baseType: '_component',
  key: 'CallToAction',
  properties: {
    label: { type: 'string' },
    link: { type: 'string' },
  },
});

export const myButton = contentType({
  baseType: '_component',
  key: 'myButton',
  properties: {
    label: { type: 'string' },
    link: { type: 'string' },
  },
});

export const heroBlock = contentType({
  baseType: '_component',
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
  baseType: '_component',
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
  baseType: '_component',
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
  baseType: '_page',
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
  baseType: '_page',
  key: 'ArticlePage',
  properties: {
    body: { type: 'richText' },
    relatedArticle: { type: 'link' },
    source: { type: 'url' },
    tags: { type: 'array', items: { type: 'string' } },
  },
});

export const aboutBlock = contentType({
  baseType: '_component',
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
  baseType: '_page',
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
  baseType: '_page',
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
  baseType: '_page',
  key: 'contactUsPage',
  properties: {
    others: {
      type: 'content',
      restrictedTypes: [myButton],
    },
    body: { type: 'richText' },
  },
});

export const blogPage = contentType({
  baseType: '_page',
  key: 'blogPage',
  properties: {
    blog: {
      type: 'content',
      allowedTypes: [articlePage, '_image'],
    },
  },
});

export const customImage = contentType({
  baseType: '_image',
  key: 'customImage',
  properties: {
    name: { type: 'string' },
    alt: { type: 'string' },
  },
});

export const customVideo = contentType({
  baseType: '_video',
  key: 'customVideo',
  properties: {
    name: { type: 'string' },
    date: { type: 'string' },
  },
});

export const customMedia = contentType({
  baseType: '_media',
  key: 'customMedia',
  properties: {
    name: { type: 'string' },
    fileType: { type: 'string' },
  },
});

export const mediaPage = contentType({
  baseType: '_page',
  key: 'mediaPage',
  properties: {
    media: {
      type: 'content',
      allowedTypes: ['_image', '_media', '_video'],
    },
  },
});

export const specialPage = contentType({
  baseType: '_page',
  key: 'specialPage',
  properties: {
    media: {
      type: 'content',
      restrictedTypes: ['_image'],
    },
  },
});

export const mediaBlock = contentType({
  baseType: '_component',
  key: 'mediaBlock',
  properties: {
    media: {
      type: 'content',
      allowedTypes: [mediaPage],
      restrictedTypes: ['_image'],
    },
  },
});

export const HeroContentType = contentType({
  key: 'NewHero',
  displayName: 'NewHero',
  baseType: '_component',
  properties: {
    heading: {
      type: 'string',
    },
    summary: {
      type: 'string',
    },
    background: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    theme: {
      type: 'string',
      enum: [
        { value: 'light', displayName: 'Light' },
        { value: 'dark', displayName: 'Dark' },
      ],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export const FeedBackPage = contentType({
  key: 'FeedBackPage',
  displayName: 'FeedBackPage',
  baseType: '_page',
  properties: {
    p_contentArea: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [HeroContentType],
      },
      sortOrder: 8,
    },
    p_block: {
      type: 'component',
      contentType: HeroContentType,
      displayName: 'p_block',
      sortOrder: 50,
    },
  },
});

export const ContentPage = contentType({
  key: 'ContentPage',
  displayName: 'ContentPage',
  baseType: '_page',
  properties: {
    p_contentArea: {
      type: 'array',
      items: {
        type: 'content',
      },
    },
  },
});

export const LocationPage = contentType({
  key: 'LocationPage',
  displayName: 'LocationPage',
  baseType: '_page',
  properties: {
    location_area: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['_component'],
      },
    },
  },
});

export const ReviewPage = contentType({
  key: 'ReviewPage',
  displayName: 'ReviewPage',
  baseType: '_page',
  properties: {
    location_area: {
      type: 'array',
      items: {
        type: 'content',
        restrictedTypes: ['_component'],
      },
    },
  },
});

export const HomePage = contentType({
  key: 'HomePage',
  displayName: 'HomePage',
  baseType: '_page',
  properties: {
    p_contentArea: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['_page', '_component', '_video', '_image', '_media'],
      },
      sortOrder: 8,
    },
  },
});

export const Paragraph = contentType({
  key: 'Paragraph',
  displayName: 'Paragraph',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    description: {
      type: 'string',
      indexingType: 'disabled',
    },
  },
});

export const Card = contentType({
  key: 'Card',
  displayName: 'Card',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      indexingType: 'disabled',
    },
  },
});

export const SelfPage = contentType({
  key: 'SelfPage',
  displayName: 'SelfPage',
  baseType: '_page',
  properties: {
    p_contentArea: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['_self'],
      },
      sortOrder: 0,
    },
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
  mediaPage,
  blogPage,
  customImage,
  customMedia,
  customVideo,
  specialPage,
  mediaBlock,
  HeroContentType,
  FeedBackPage,
  ContentPage,
  LocationPage,
  ReviewPage,
  HomePage,
  Paragraph,
  Card,
  SelfPage,
];
