import { ExperienceContentType, SectionContentType } from './contentTypes.js';

export const BlankSectionContentType: SectionContentType = {
  baseType: '_section',
  key: 'BlankSection',
  displayName: 'Blank Section',
};

export const BlankExperienceContentType: ExperienceContentType = {
  baseType: '_experience',
  key: 'BlankExperience',
  displayName: 'Blank Experience',
  mayContainTypes: ['*'],
};
