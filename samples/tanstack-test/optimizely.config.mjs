import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**.tsx'],
  propertyGroups: [
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
  ],
});
