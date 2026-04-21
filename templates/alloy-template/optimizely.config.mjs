import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: [
    './src/components/*.tsx',
    './src/components/**/*.tsx',
    './src/components/contracts/*.ts',
  ],
  propertyGroups: [
    {
      key: 'SEO',
      displayName: 'SEO',
      sortOrder: 1,
    },
    {
      key: 'SiteSettings',
      displayName: 'Site Settings',
      sortOrder: 2,
    },
  ],
  startPage: {
    key: 'Start',
    displayName: 'Start Page',
    baseType: '_experience',
  },
});