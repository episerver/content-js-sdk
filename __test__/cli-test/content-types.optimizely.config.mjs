import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./content-types/**.ts'],
});
