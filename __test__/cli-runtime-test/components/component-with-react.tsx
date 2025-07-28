import React from 'react';
import { contentType } from '@episerver/cms-sdk';
import { getString } from './subdir/something.js';

export const ct3 = contentType({
  key: 'ct3',
  baseType: '_page',
  displayName: 'CT3',
  properties: {
    p1: {
      type: getString(),
    },
  },
});

export default function Hello() {
  return <div>Hello world</div>;
}
