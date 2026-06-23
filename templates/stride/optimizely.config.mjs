import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: [
    './components/*.tsx',
    './components/**/*.tsx',
    './components/contracts/*.ts',
  ],
  propertyGroups: [],
});
