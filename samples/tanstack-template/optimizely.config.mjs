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
  content: [
    {
      key: 'AboutExperienceContent',
      displayName: 'About Experience',
      contentType: 'AboutExperience',
    },
],
  applications: [
    {
      key: 'tanstack_app',
      entryPoint: 'AboutExperienceContent',
      displayName: 'TanStack Start Template',
      type: 'website',
      isDefault: true,
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3000',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
  ],
});
