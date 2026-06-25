import { contentType } from '../../model/index.js';

export const MyExperience = contentType({
  baseType: '_experience',
  key: 'MyExperience',
  displayName: 'My Experience',
});

const CallToAction = contentType({
  baseType: '_component',
  key: 'CallToAction',
  displayName: 'Call To Action',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    label: { type: 'string' },
    link: { type: 'string' },
  },
});

const CallToAction2 = contentType({
  baseType: '_component',
  key: 'CallToAction2',
  displayName: 'Call To Action 2',
  compositionBehaviors: [],
  properties: {
    label: { type: 'string' },
  },
});

const ExpSection = contentType({
  baseType: '_component',
  key: 'ExpSection',
  displayName: 'Exp Section',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    heading: { type: 'string' },
  },
});

const ImageComponent = contentType({
  baseType: '_component',
  key: 'ImageComponent',
  displayName: 'Image Component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    title: { type: 'string' },
    image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

export const HeroSection = contentType({
  baseType: '_section',
  key: 'HeroSection',
  displayName: 'Hero Section',
  properties: {
    heading: { type: 'string' },
    backgroundImage: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

export const CardSection = contentType({
  baseType: '_section',
  key: 'CardSection',
  displayName: 'Card Section',
  properties: {
    title: { type: 'string' },
    cards: {
      type: 'array',
      items: { type: 'content', allowedTypes: [CallToAction] },
    },
  },
});

export const EmptySection = contentType({
  baseType: '_section',
  key: 'EmptySection',
  displayName: 'Empty Section',
});

export const SectionWithComponent = contentType({
  baseType: '_section',
  key: 'SectionWithComponent',
  displayName: 'Section With Component',
  properties: {
    component: { type: 'component', contentType: ImageComponent },
  },
});

export const SectionsOnlyExperience = contentType({
  baseType: '_experience',
  key: 'SectionsOnlyExperience',
  displayName: 'Sections Only Experience',
});

export const allContentTypes = [
  MyExperience,
  CallToAction,
  CallToAction2,
  ExpSection,
  ImageComponent,
  HeroSection,
  CardSection,
  EmptySection,
  SectionWithComponent,
  SectionsOnlyExperience,
];
