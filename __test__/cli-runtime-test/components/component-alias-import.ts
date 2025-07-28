import React from 'react';
import { contentType } from '@episerver/cms-sdk';
import { getString } from '@/subdir/something.js';

export const contentTypeWithRegex = contentType({
  key: 'ct1',
  baseType: '_page',
  displayName: 'CT1',
  properties: {
    p1: {
      type: getString(),
    },
  },
});
