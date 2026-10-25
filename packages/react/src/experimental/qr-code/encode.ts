/**
 * A QR code encoder (ISO/IEC 18004), ours rather than a library's: byte mode (UTF-8), versions 1 to
 * 40, the four error-correction levels, Reed–Solomon over GF(256), the eight masks scored by the
 * standard's four penalty rules. It returns the modules, row by row, `true` for dark.
 */

/** How much of the code can be lost and still read: L 7%, M 15%, Q 25%, H 30%. */
export type QRCodeLevel = "L" | "M" | "Q" | "H";

const LEVELS: readonly QRCodeLevel[] = ["L", "M", "Q", "H"];
// The two format bits for each level, in LEVELS order.
const FORMAT = [1, 0, 3, 2];
// The standard's tables, by level (L, M, Q, H), then version 1 to 40: the error-correction
// codewords in each block, and how many blocks. Index 0 is unused, so a version is its own index.
const table = (rows: string[]) => rows.map((row) => [0, ...row.split(" ").map(Number)]);
const ECC_PER_BLOCK = table([
  "7 10 15 20 26 18 20 24 30 18 20 24 26 30 22 24 28 30 28 28 28 28 30 30 26 28 30 30 30 30 30 30 30 30 30 30 30 30 30 30",
  "10 16 26 18 24 16 18 22 22 26 30 22 22 24 24 28 28 26 26 26 26 28 28 28 28 28 28 28 28 28 28 28 28 28 28 28 28 28 28 28",
  "13 22 18 26 18 24 18 22 20 24 28 26 24 20 30 24 28 28 26 30 28 30 30 30 30 28 30 30 30 30 30 30 30 30 30 30 30 30 30 30",
  "17 28 22 16 22 28 26 26 24 28 24 28 22 24 24 30 28 28 26 28 30 24 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30",
]);
const BLOCKS = table([
  "1 1 1 1 1 2 2 2 2 4 4 4 4 4 6 6 6 6 7 8 8 9 9 10 12 12 12 13 14 15 16 17 18 19 19 20 21 22 24 25",
  "1 1 1 2 2 4 4 4 5 5 5 8 9 9 10 10 11 13 14 16 17 17 18 20 21 23 25 26 28 29 31 33 35 37 38 40 43 45 47 49",
  "1 1 2 2 4 4 6 6 8 8 8 10 12 16 12 17 16 18 21 20 23 23 25 27 29 34 34 35 38 40 43 45 48 51 53 56 59 62 65 68",
  "1 1 2 4 4 4 5 6 8 8 11 11 16 16 18 16 19 21 25 25 25 34 30 32 35 37 40 42 45 48 51 54 57 60 63 66 70 74 77 81",
]);

// Codewords a version holds: every module less the function patterns, eight to a codeword.
function codewords(version: number): number {
  let modules = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    modules -= (25 * align - 10) * align - 55;
    if (version >= 7) modules -= 36;
  }
  return modules >> 3;
}

// Data codewords a version holds at a level (by index in LEVELS).
function dataCodewords(version: number, l: number): number {
  return (
    codewords(version) - (ECC_PER_BLOCK[l]?.[version] as number) * (BLOCKS[l]?.[version] as number)
  );
}

/** The most bytes a version holds at a level: its data, less the mode and the count. */
export function capacity(version: number, level: QRCodeLevel): number {
  return Math.floor(
    (dataCodewords(version, LEVELS.indexOf(level)) * 8 - 4 - (version < 10 ? 8 : 16)) / 8,
  );
}

// The centres of the alignment patterns, along each axis.
function alignment(version: number, size: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const positions = [6];
  for (let at = size - 7; positions.length < count; at -= step) positions.splice(1, 0, at);
  return positions;
}

// Multiplication in GF(256), modulo the QR polynomial x⁸ + x⁴ + x³ + x² + 1.
function times(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

// The Reed–Solomon error-correction codewords for one block.
function correction(data: readonly number[], degree: number): number[] {
  // The generator polynomial (x − α⁰)(x − α¹)…, highest coefficient implied.
  const divisor = new Array<number>(degree).fill(0);
  divisor[degree - 1] = 1;
  for (let i = 0, root = 1; i < degree; i++, root = times(root, 2)) {
    for (let j = 0; j < degree; j++) {
      divisor[j] = times(divisor[j] as number, root) ^ (divisor[j + 1] ?? 0);
    }
  }
  const remainder = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (remainder.shift() as number);
    remainder.push(0);
    for (let j = 0; j < degree; j++) {
      remainder[j] = (remainder[j] as number) ^ times(divisor[j] as number, factor);
    }
  }
  return remainder;
}

// The format word: level and mask, BCH-protected, XOR-masked.
function formatBits(level: number, mask: number): number {
  const data = ((FORMAT[level] as number) << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

// A finder-like run, 1:1:3:1:1, with four light modules on one side.
const FINDER = ["10111010000", "00001011101"];

// The standard's penalty for a masked symbol: lower reads more easily. Every row, then every
// column, is written as a line of "0"s and "1"s in one string, so the runs and finder-like patterns
// are found by the engine's own string search (a newline ends each line, so none spans two).
function penalty(dark: Uint8Array, size: number): number {
  let score = 0;
  let total = 0;
  const width = size + 1;
  const text = new Uint8Array(2 * size * width).fill(10);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = dark[y * size + x] as number;
      total += c;
      text[y * width + x] = 48 + c;
      text[(size + x) * width + y] = 48 + c;
    }
  }
  const lines = new TextDecoder().decode(text);
  // Rule 1: five or more alike in a row or column, 3 and then 1 for each module more.
  for (const run of lines.match(/0{5,}|1{5,}/g) ?? []) score += run.length - 2;
  // Rule 3: something that looks like a finder pattern.
  for (const pattern of FINDER) {
    for (let at = lines.indexOf(pattern); at >= 0; at = lines.indexOf(pattern, at + 1)) score += 40;
  }
  // Rule 2: 2×2 blocks alike.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = dark[y * size + x];
      if (
        c === dark[y * size + x + 1] &&
        c === dark[(y + 1) * size + x] &&
        c === dark[(y + 1) * size + x + 1]
      )
        score += 3;
    }
  }
  // Rule 4: far from half dark.
  return score + 10 * Math.floor(Math.abs(total * 20 - size * size * 10) / (size * size));
}

/**
 * Encode text as a QR code. Picks the smallest version that holds it at the level. Throws a
 * RangeError when it's too long for any version.
 */
export function encodeQr(text: string, level: QRCodeLevel = "M"): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const l = LEVELS.indexOf(level);
  const ecc = ECC_PER_BLOCK[l] as number[];
  const blocks = BLOCKS[l] as number[];
  let version = 1;
  while (bytes.length > capacity(version, level)) {
    if (++version > 40)
      throw new RangeError(`QR code: ${bytes.length} bytes is too long for level ${level}`);
  }

  // The bit stream: byte mode, the count, the bytes, the terminator, then padding.
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  const room = dataCodewords(version, l) * 8;
  put(4, 4);
  put(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) put(byte, 8);
  put(0, Math.min(4, room - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < room; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8)
    data.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));

  // Split into blocks (the later ones a codeword longer), correct each, interleave.
  const count = blocks[version] as number;
  const degree = ecc[version] as number;
  const short = Math.floor(codewords(version) / count) - degree;
  const longs = codewords(version) % count;
  const parts: number[][] = [];
  for (let b = 0, at = 0; b < count; b++) {
    const length = short + (b >= count - longs ? 1 : 0);
    parts.push(data.slice(at, at + length));
    at += length;
  }
  const fixes = parts.map((part) => correction(part, degree));
  const stream: number[] = [];
  for (let i = 0; i <= short; i++)
    for (const part of parts) if (i < part.length) stream.push(part[i] as number);
  for (let i = 0; i < degree; i++) for (const fix of fixes) stream.push(fix[i] as number);

  // The function patterns. `reserved` marks every module that isn't data.
  const size = version * 4 + 17;
  const dark = new Uint8Array(size * size);
  const reserved = new Uint8Array(size * size);
  const set = (x: number, y: number, on: boolean | number) => {
    dark[y * size + x] = on ? 1 : 0;
    reserved[y * size + x] = 1;
  };
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    }
  }
  const centres = alignment(version, size);
  const last = centres.length - 1;
  centres.forEach((ay, i) => {
    centres.forEach((ax, j) => {
      // Not over the three finders.
      if ((i === 0 && (j === 0 || j === last)) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    });
  });
  const drawFormat = (word: number) => {
    const bit = (i: number) => (word >>> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, 1);
  };
  drawFormat(0);
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const word = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, (word >>> i) & 1);
      set(b, a, (word >>> i) & 1);
    }
  }

  // The data, two columns at a time from the bottom right, up then down, skipping the timing column.
  for (let right = size - 1, i = 0; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? size - 1 - v : v;
        if (!reserved[y * size + x] && i < stream.length * 8) {
          dark[y * size + x] = ((stream[i >>> 3] as number) >>> (7 - (i & 7))) & 1;
          i++;
        }
      }
    }
  }

  // Try each mask; keep the one the penalty rules like best.
  const masked = (mask: number) => {
    const out = dark.slice();
    const fn = MASKS[mask] as (x: number, y: number) => boolean;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (!reserved[y * size + x] && fn(x, y))
          out[y * size + x] = 1 - (out[y * size + x] as number);
    return out;
  };
  let best = dark;
  let lowest = Number.POSITIVE_INFINITY;
  const plain = dark.slice();
  for (let mask = 0; mask < 8; mask++) {
    dark.set(plain);
    drawFormat(formatBits(l, mask));
    const candidate = masked(mask);
    const score = penalty(candidate, size);
    if (score < lowest) {
      lowest = score;
      best = candidate;
    }
  }
  return Array.from({ length: size }, (_, y) =>
    Array.from(best.subarray(y * size, (y + 1) * size), Boolean),
  );
}
