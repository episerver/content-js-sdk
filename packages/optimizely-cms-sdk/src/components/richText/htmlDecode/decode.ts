/**
 * HTML entity decoder
 */

import { bodyRegExps, namedReferences } from './entities.js';

export type Level = 'xml' | 'html4' | 'html5' | 'all';
export type DecodeScope = 'strict' | 'body' | 'attribute';

export interface DecodeOptions {
  level?: Level;
  scope?: DecodeScope;
}

// Surrogate pair helpers (for Unicode code points > 0xFFFF)
const fromCodePoint =
  String.fromCodePoint ||
  function (astralCodePoint: number) {
    return String.fromCharCode(
      Math.floor((astralCodePoint - 0x10000) / 0x400) + 0xd800,
      ((astralCodePoint - 0x10000) % 0x400) + 0xdc00,
    );
  };

// Maps legacy Windows-1252 code points to correct Unicode values
const numericUnicodeMap: Record<number, number> = {
  0: 65533,
  128: 8364,
  130: 8218,
  131: 402,
  132: 8222,
  133: 8230,
  134: 8224,
  135: 8225,
  136: 710,
  137: 8240,
  138: 352,
  139: 8249,
  140: 338,
  142: 381,
  145: 8216,
  146: 8217,
  147: 8220,
  148: 8221,
  149: 8226,
  150: 8211,
  151: 8212,
  152: 732,
  153: 8482,
  154: 353,
  155: 8250,
  156: 339,
  158: 382,
  159: 376,
};

const allNamedReferences = {
  ...namedReferences,
  all: namedReferences.html5,
};

// Regular expressions for matching entities in different contexts
const strict = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);/g;
// Matches entities in body text, allowing for missing semicolons in some cases
const attribute = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+)[;=]?/g;

const baseDecodeRegExps: Record<Exclude<Level, 'all'>, Record<DecodeScope, RegExp>> = {
  xml: {
    strict,
    attribute,
    body: bodyRegExps.xml,
  },
  html4: {
    strict,
    attribute,
    body: bodyRegExps.html4,
  },
  html5: {
    strict,
    attribute,
    body: bodyRegExps.html5,
  },
};

const decodeRegExps: Record<Level, Record<DecodeScope, RegExp>> = {
  ...baseDecodeRegExps,
  all: baseDecodeRegExps.html5,
};

const fromCharCode = String.fromCharCode;
const outOfBoundsChar = fromCharCode(65533);

const defaultDecodeOptions: DecodeOptions = {
  scope: 'body',
  level: 'all',
};

function getDecodedEntity(
  entity: string,
  references: Record<string, string>,
  isAttribute: boolean,
  isStrict: boolean,
): string {
  let decodeResult = entity;
  const decodeEntityLastChar = entity[entity.length - 1];

  if (isAttribute && decodeEntityLastChar === '=') {
    decodeResult = entity;
  } else if (isStrict && decodeEntityLastChar !== ';') {
    decodeResult = entity;
  } else {
    const decodeResultByReference = references[entity];
    if (decodeResultByReference) {
      decodeResult = decodeResultByReference;
    } else if (entity[0] === '&' && entity[1] === '#') {
      const decodeSecondChar = entity[2];
      const decodeCode =
        decodeSecondChar == 'x' || decodeSecondChar == 'X' ?
          parseInt(entity.substring(3), 16)
        : parseInt(entity.substring(2));

      decodeResult =
        decodeCode >= 0x10ffff ? outOfBoundsChar
        : decodeCode > 65535 ? fromCodePoint(decodeCode)
        : fromCharCode(numericUnicodeMap[decodeCode] || decodeCode);
    }
  }
  return decodeResult;
}

/** Decodes all HTML entities in text */
export function decode(
  text: string | undefined | null,
  {
    level = 'all',
    scope = level === 'xml' ? 'strict' : 'body',
  }: DecodeOptions = defaultDecodeOptions,
) {
  if (!text) {
    return '';
  }

  const decodeRegExp = decodeRegExps[level][scope];
  const references = allNamedReferences[level].entities;
  const isAttribute = scope === 'attribute';
  const isStrict = scope === 'strict';

  return text.replace(decodeRegExp, entity =>
    getDecodedEntity(entity, references, isAttribute, isStrict),
  );
}
