import { contentType } from '@optimizely/cms-sdk';
import { getString } from '@/subdir/something.js';

export const ct1 = contentType({
  key: 'ct1',
  baseType: '_page',
  displayName: 'CT1',
  properties: {
    p1: {
      type: getString(),
    },
  },
});
