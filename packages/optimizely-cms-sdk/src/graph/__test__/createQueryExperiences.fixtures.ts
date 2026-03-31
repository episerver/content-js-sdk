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

export const allContentTypes = [
  MyExperience,
  CallToAction,
  CallToAction2,
  ExpSection,
];
