import { contentType } from '@optimizely/cms-sdk';

export const ctString = contentType({
  baseType: '_component',
  key: 'ct_string',
  properties: { p1: { type: 'string' } },
});
export const ctBoolean = contentType({
  baseType: '_component',
  key: 'ct_boolean',
  properties: { p1: { type: 'boolean' } },
});
export const ctInteger = contentType({
  baseType: '_component',
  key: 'ct_integer',
  properties: { p1: { type: 'integer' } },
});
export const ctRich = contentType({
  baseType: '_component',
  key: 'ct_rich',
  properties: { p1: { type: 'richText' } },
});
export const ctLink = contentType({
  baseType: '_component',
  key: 'ct_link',
  properties: { p1: { type: 'link' } },
});
export const ctContentReference = contentType({
  baseType: '_component',
  key: 'ct_contentreference',
  properties: { p1: { type: 'contentReference' } },
});
export const ctArray = contentType({
  baseType: '_component',
  key: 'ct_array',
  properties: { p1: { type: 'array', items: { type: 'string' } } },
});
export const ctWithCollision = contentType({
  baseType: '_page',
  key: 'ct_with_collision',
  properties: {
    collision: {
      type: 'content',
      allowedTypes: [
        ctString,
        ctBoolean,
        ctInteger,
        ctRich,
        ctLink,
        ctContentReference,
        ctArray,
      ],
    },
    p2: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [
          ctString,
          ctBoolean,
          ctInteger,
          ctRich,
          ctLink,
          ctContentReference,
          ctArray,
        ],
      },
    },
  },
});
