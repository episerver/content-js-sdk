import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./components/**/*.ts', './components/**.tsx'],
});
