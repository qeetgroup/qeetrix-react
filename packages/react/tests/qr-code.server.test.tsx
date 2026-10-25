/**
 * The QR encoder, read back by a reader written from the standard (ISO/IEC 18004) rather than from
 * the encoder: its own GF(256) tables, the published alignment-pattern positions, BCH checks on the
 * format and version words, Reed–Solomon syndromes, then the byte-mode payload. (During development
 * every version 1–40 at every level, filled to capacity, was also decoded by Apple's CoreImage; in
 * the browser suite, Chrome's BarcodeDetector reads the rendered component where it exists.)
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QRCode } from "../src/experimental";
import { capacity, encodeQr, type QRCodeLevel } from "../src/experimental/qr-code/encode";

const EXP: number[] = [];
const LOG: number[] = [];
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
const mul = (a: number, b: number) =>
  a && b ? (EXP[((LOG[a] as number) + (LOG[b] as number)) % 255] as number) : 0;
/** The remainder of a binary polynomial divided by another (BCH). */
const mod = (word: number, poly: number) => {
  const degree = Math.floor(Math.log2(poly));
  for (let bit = Math.floor(Math.log2(word || 1)); bit >= degree; bit--) {
    if (word & (1 << bit)) word ^= poly << (bit - degree);
  }
  return word;
};
/** The standard's Table E.1: the alignment patterns' centres, by version. */
const ALIGNMENT: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];
/** Data codewords of the single-block symbols read in full below (Table 9). */
const DATA: Record<string, number> = {
  "1L": 19,
  "1M": 16,
  "1Q": 13,
  "1H": 9,
  "2L": 34,
  "4L": 80,
  "5L": 108,
};
const LEVEL_BITS: Record<number, QRCodeLevel> = { 1: "L", 0: "M", 3: "Q", 2: "H" };

function read(m: boolean[][]) {
  const size = m.length;
  const version = (size - 17) / 4;
  const at = (x: number, y: number): number => (m[y]?.[x] ? 1 : 0);

  // Finder patterns: a 7×7 ring, a gap, a 3×3 core, with a light separator; timing between them.
  for (const [ox, oy] of [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        if (ox + x < 0 || oy + y < 0 || ox + x >= size || oy + y >= size) continue;
        const d = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        expect(at(ox + x, oy + y), `finder at ${ox},${oy}`).toBe(d === 2 || d === 4 ? 0 : 1);
      }
    }
  }
  for (let i = 8; i < size - 8; i++) {
    expect(at(i, 6)).toBe(i % 2 === 0 ? 1 : 0);
    expect(at(6, i)).toBe(i % 2 === 0 ? 1 : 0);
  }
  expect(at(8, size - 8), "the dark module").toBe(1);

  // Format: both copies agree and are a BCH(15,5) codeword under the 0x5412 mask.
  const first = [0, 1, 2, 3, 4, 5, 7, 8]
    .map((y) => at(8, y))
    .concat([7, 5, 4, 3, 2, 1, 0].map((x) => at(x, 8)));
  const second = Array.from({ length: 8 }, (_, i) => at(size - 1 - i, 8)).concat(
    Array.from({ length: 7 }, (_, i) => at(8, size - 7 + i)),
  );
  expect(second).toEqual(first);
  const format = first.reduce((word, bit, i) => word | (bit << i), 0) ^ 0x5412;
  expect(mod(format, 0x537)).toBe(0);
  const level = LEVEL_BITS[format >> 13] as QRCodeLevel;
  const mask = (format >> 10) & 7;

  // Version information from 7 up: both copies, a BCH(18,6) codeword naming the version.
  if (version >= 7) {
    let word = 0;
    let other = 0;
    for (let i = 0; i < 18; i++) {
      word |= at(size - 11 + (i % 3), Math.floor(i / 3)) << i;
      other |= at(Math.floor(i / 3), size - 11 + (i % 3)) << i;
    }
    expect(other).toBe(word);
    expect(word >> 12).toBe(version);
    expect(mod(word, 0x1f25)).toBe(0);
  }

  // Which modules carry data: everything but the function patterns, marked once.
  const marked = new Uint8Array(size * size);
  const mark = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) marked.fill(1, y * size + x0, y * size + x0 + w);
  };
  mark(0, 0, 9, 9);
  mark(size - 8, 0, 8, 9);
  mark(0, size - 8, 9, 8);
  mark(6, 0, 1, size);
  mark(0, 6, size, 1);
  if (version >= 7) {
    mark(0, size - 11, 6, 3);
    mark(size - 11, 0, 3, 6);
  }
  const centres = ALIGNMENT[version] as number[];
  const last = centres.length - 1;
  centres.forEach((cy, i) => {
    centres.forEach((cx, j) => {
      if (!((i === 0 && (j === 0 || j === last)) || (i === last && j === 0)))
        mark(cx - 2, cy - 2, 5, 5);
    });
  });
  const reserved = (x: number, y: number) => marked[y * size + x] === 1;
  const flip = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ][mask] as (x: number, y: number) => boolean;
  const bits: number[] = [];
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let i = 0; i < size; i++) {
      const y = upward ? size - 1 - i : i;
      for (const x of [right, right - 1]) {
        if (!reserved(x, y)) bits.push(at(x, y) ^ (flip(x, y) ? 1 : 0));
      }
    }
    upward = !upward;
  }
  const codewords: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  return { version, level, mask, codewords };
}

/** Reads a single-block symbol all the way: Reed–Solomon syndromes, then the byte-mode payload. */
function readText(m: boolean[][]) {
  const { version, level, codewords } = read(m);
  const data = DATA[`${version}${level}`] as number;
  for (let i = 0; i < codewords.length - data; i++) {
    expect(
      codewords.reduce((s, c) => mul(s, EXP[i] as number) ^ c, 0),
      `syndrome ${i}`,
    ).toBe(0);
  }
  const bits = codewords
    .slice(0, data)
    .flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1));
  const take = (n: number) => bits.splice(0, n).reduce((v, b) => (v << 1) | b, 0);
  expect(take(4), "byte mode").toBe(0b0100);
  const length = take(8);
  return new TextDecoder().decode(new Uint8Array(Array.from({ length }, () => take(8))));
}

describe("the QR encoder", () => {
  it.each([
    ["Hi", "M", 1],
    ["https://id.qeet.in", "L", 2],
    ["Qeet ID", "H", 1],
    ["upi://pay?pa=acme@qeetpay&pn=Acme%20Pvt%20Ltd&am=124500.00&cu=INR", "L", 4],
    ["नमस्ते, Qeet ID में आपका स्वागत है।", "L", 5],
  ] as const)("writes %j at %s as version %i, and it reads back", (text, level, version) => {
    const m = encodeQr(text, level);
    expect(m).toHaveLength(17 + 4 * version);
    expect(read(m)).toMatchObject({ version, level });
    expect(readText(m)).toBe(text);
  });

  it("holds what the standard's capacity table says, in bytes", () => {
    const table = {
      "1L": 17,
      "1M": 14,
      "1Q": 11,
      "1H": 7,
      "10L": 271,
      "10M": 213,
      "10Q": 151,
      "10H": 119,
      "25L": 1273,
      "25M": 997,
      "40L": 2953,
      "40M": 2331,
      "40Q": 1663,
      "40H": 1273,
    };
    for (const [key, bytes] of Object.entries(table)) {
      expect(capacity(Number.parseInt(key, 10), key.slice(-1) as QRCodeLevel), key).toBe(bytes);
    }
  });

  // Forty symbols up to 177×177, each with eight masks scored: about half a second here, several
  // times that on a CI runner under coverage, so it gets its own timeout.
  it("builds every version, 1 to 40, full and well-formed: patterns, format and version words", {
    timeout: 30_000,
  }, () => {
    for (let version = 1; version <= 40; version++) {
      const level = (["L", "M", "Q", "H"] as const)[version % 4] as QRCodeLevel;
      const m = encodeQr("x".repeat(capacity(version, level)), level);
      expect(read(m)).toMatchObject({ version, level });
    }
  });

  it.each(["L", "M", "Q", "H"] as const)("writes the authenticator link at %s", (level) => {
    const link =
      "otpauth://totp/Acme%20Pvt%20Ltd:priya@acme.in?secret=JBSWY3DPEHPK3PXP&issuer=Acme";
    expect(read(encodeQr(link, level)).level).toBe(level);
  });

  it("picks the next version at the capacity boundary, and refuses what no version holds", () => {
    expect(encodeQr("x".repeat(14), "M")).toHaveLength(21);
    expect(encodeQr("x".repeat(15), "M")).toHaveLength(25);
    expect(encodeQr("x".repeat(2953), "L")).toHaveLength(177);
    expect(() => encodeQr("x".repeat(2954), "L")).toThrow(RangeError);
  });

  it("renders on the server with no client code", () => {
    const out = renderToString(<QRCode value="Hi" label="Scan to sign in" size={120} />);
    expect(out).toMatch(/^<svg viewBox="-4 -4 29 29" width="120" height="120"/);
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Scan to sign in"');
    expect(out).toContain('data-qx-color-scheme="light"');
  });
});
