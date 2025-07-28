import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: ['./content-types/**.ts'],
});
