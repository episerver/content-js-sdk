import { buildConfig, BlankExperienceContentType } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**.tsx', './src/components/**.ts'],
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
  startPage: {
    key: 'BlankExperience',
    displayName: 'Blank Experience',
    baseType: '_experience',
  },
  applications: [
    {
      key: 'test-app',
      displayName: 'Test App',
      type: 'website',
      entryPoint: '/home',
    },
  ],
});

