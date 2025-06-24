import { contentType } from '../../model';

export const MyExperience = contentType({
  baseType: '_experience',
  key: 'MyExperience',
});

const CallToAction = contentType({
  baseType: '_component',
  key: 'CallToAction',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    label: { type: 'string' },
    link: { type: 'string' },
  },
});

const CallToAction2 = contentType({
  baseType: '_component',
  key: 'CallToAction2',
  compositionBehaviors: [],
  properties: {
    label: { type: 'string' },
  },
});

const ExpSection = contentType({
  baseType: '_component',
  key: 'ExpSection',
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
