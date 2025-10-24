import { propertyGroups } from '@optimizely/cms-sdk';

export const customPropertyGroups = propertyGroups([
  {
    key: 'seo',
    displayName: 'SEO',
    sortOrder: 1,
  },
  {
    key: 'meta',
    displayName: 'Meta',
    sortOrder: 2,
  },
  {
    key: 'layout',
    displayName: 'Layout',
    sortOrder: 3,
  },
]);

declare module '@optimizely/cms-sdk/buildConfig' {
  interface PropertyGroupRegistry
    extends Record<(typeof customPropertyGroups)[number]['key'], string> {}
}
