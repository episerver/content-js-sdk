import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/*.tsx', './src/components/**/*.tsx'],
});
