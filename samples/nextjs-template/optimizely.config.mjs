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
  applications: [
    {
      key: 'nextjs_app',
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
      // previewUrlFormats: {
      //   any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
      // },
    },
    {
      key: 'blog_app',
      displayName: 'Blog App',
      type: 'website',
      isDefault: false,
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
    {
      key: 'test_app',
      displayName: 'Test App',
      type: 'website',
      isDefault: false,
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3003',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
  ],

});