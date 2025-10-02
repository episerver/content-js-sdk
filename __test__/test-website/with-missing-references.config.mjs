import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: [
    './src/components/missing-content-types/not-included-in-registry.tsx',
    './src/components/missing-content-types/referencing.tsx',
    // DO NOT include "not-synced.tsx"
  ],
});
