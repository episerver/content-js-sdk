import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: ['./components/**/*.ts', './components/**.tsx'],
});
