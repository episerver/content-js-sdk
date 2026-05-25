import { buildConfig } from '@optimizely/cms-sdk';

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
  content: [
    {
      key: 'AboutExperienceContent',
      displayName: 'About Experience',
      contentType: 'AboutExperience',
    },
    {
      key: 'BlogExperienceContent',
      displayName: 'Blog Experience',
      contentType: 'BlogExperience',
    },
  ],
  applications: [
    {
      key: 'nextjs_app',
      entryPoint: 'AboutExperienceContent',
      displayName: 'Next.js Template',
      type: 'website',
      isDefault: true,
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3001',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
    {
      key: 'blog_app',
      displayName: 'Blog App',
      type: 'website',
      isDefault: false,
      entryPoint: 'BlogExperienceContent',
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3002',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
  ],

});