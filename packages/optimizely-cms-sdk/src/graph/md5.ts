/**
 * MD5, per RFC 1321.
 *
 * This exists only because Graph's HMAC scheme hashes the request body with MD5, and Web Crypto
 * does not implement MD5 — it is the one primitive `crypto.subtle` omits. Reaching for
 * `node:crypto` instead is what this replaces: even behind a dynamic import, bundlers resolve
 * the specifier statically, so a browser build of the package root failed with
 * `Could not resolve "node:crypto"`. Hashing here keeps the SDK free of Node built-ins and lets
 * HMAC run on edge runtimes.
 *
 * Not a general-purpose hash. MD5 is broken for anything security-bearing; here it is a body
 * digest that Graph specifies, and the signature protecting it is HMAC-SHA256. Delete this file
 * if Graph ever moves off MD5 — {@linkcode md5} has one caller.
 */

/** Per-round left-rotation amounts. */
const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9,
  14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/** Round constants: the integer parts of `abs(sin(i + 1)) * 2^32`. */
const SINES = Array.from({ length: 64 }, (_, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32),
);

const rotateLeft = (value: number, count: number): number =>
  (value << count) | (value >>> (32 - count));

/** Appends `0x80`, then zeroes, then the message length in bits, to a multiple of 64 bytes. */
function padded(bytes: Uint8Array): Uint8Array {
  const length = bytes.length;
  const blocks = new Uint8Array(((((length + 8) / 64) | 0) + 1) * 64);

  blocks.set(bytes);
  blocks[length] = 0x80;

  // Written as two 32-bit halves because the bit length can exceed what `setUint32` takes.
  const view = new DataView(blocks.buffer);
  view.setUint32(blocks.length - 8, (length * 8) >>> 0, true);
  view.setUint32(blocks.length - 4, Math.floor(length / 2 ** 29), true);

  return blocks;
}

/** The 16-byte MD5 digest of a string, hashed as UTF-8. */
export function md5(text: string): Uint8Array<ArrayBuffer> {
  const blocks = padded(new TextEncoder().encode(text));
  const input = new DataView(blocks.buffer);

  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  for (let offset = 0; offset < blocks.length; offset += 64) {
    let [a, b, c, d] = [a0, b0, c0, d0];

    for (let step = 0; step < 64; step++) {
      const [mixed, word] =
        step < 16 ? [(b & c) | (~b & d), step]
        : step < 32 ? [(d & b) | (~d & c), (5 * step + 1) % 16]
        : step < 48 ? [b ^ c ^ d, (3 * step + 5) % 16]
        : [c ^ (b | ~d), (7 * step) % 16];

      const sum =
        (a + mixed + SINES[step] + input.getUint32(offset + word * 4, true)) | 0;

      [a, b, c, d] = [d, (b + rotateLeft(sum, SHIFTS[step])) | 0, b, c];
    }

    [a0, b0, c0, d0] = [(a0 + a) | 0, (b0 + b) | 0, (c0 + c) | 0, (d0 + d) | 0];
  }

  const digest = new Uint8Array(16);
  const output = new DataView(digest.buffer);
  [a0, b0, c0, d0].forEach((word, i) => output.setUint32(i * 4, word >>> 0, true));

  return digest;
}
