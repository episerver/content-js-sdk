import { contentType } from '@episerver/cms-sdk';
import { getString } from './subdir/something';

export const ct2 = contentType({
  key: 'ct2',
  baseType: '_page',
  displayName: 'CT2',
  properties: {
    p1: {
      type: getString(),
    },
  },
});
