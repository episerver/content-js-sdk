import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: [
    './src/components/with-display-templates.tsx',
    './src/components/with-repeated-properties.tsx',
  ],
});
