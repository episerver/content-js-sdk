import { Manifest } from './manifest.js';

/** Pluralizes a word based on count */
export const pluralize = (count: number, singular: string) =>
  count !== 1 ? `${singular}s` : singular;

/** Formats manifest counts into a readable summary string */
export const formatCounts = (manifest: any) => {
  const contentTypeCount = manifest.contentTypes?.length || 0;
  const propertyGroupCount = manifest.propertyGroups?.length || 0;
  const displayTemplateCount = manifest.displayTemplates?.length || 0;

  return `${contentTypeCount} content ${pluralize(contentTypeCount, 'type')}, ${propertyGroupCount} property ${pluralize(propertyGroupCount, 'group')}, ${displayTemplateCount} display ${pluralize(displayTemplateCount, 'template')}`;
};

/** Validates that response contains a valid contentTypes array */
export const validateManifest = (response: any): response is Manifest =>
  response?.contentTypes && Array.isArray(response.contentTypes);
