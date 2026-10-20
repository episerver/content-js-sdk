import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { md5 } from '../md5.js';

/**
 * MD5 is hand-rolled so that HMAC signing needs no Node built-ins, which means these tests
 * are the only thing standing between a padding mistake and a signature Graph rejects.
 */

const hex = (bytes: Uint8Array): string =>
  [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');

describe('md5', () => {
  // The suite from RFC 1321, appendix A.5.
  test.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      'd174ab98d277d9f5a5611c2c9f419d9f',
    ],
    ['1234567890'.repeat(8), '57edf4a22be3c955ac49da2e2107b67a'],
  ])('matches the RFC 1321 vector for %j', (input, expected) => {
    expect(hex(md5(input))).toBe(expected);
  });

  // 55/56 and 63/64 are where a block either just fits or spills into a second one.
  test('agrees with node:crypto across the padding boundaries', () => {
    const lengths = Array.from({ length: 130 }, (_, i) => i);

    lengths.forEach(length => {
      const input = 'x'.repeat(length);
      expect(hex(md5(input))).toBe(createHash('md5').update(input).digest('hex'));
    });
  });

  test('hashes multi-byte characters as UTF-8', () => {
    const input = 'ståhl — 日本語 — 🙂';
    expect(hex(md5(input))).toBe(createHash('md5').update(input, 'utf8').digest('hex'));
  });
});
