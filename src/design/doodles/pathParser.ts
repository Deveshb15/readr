// Minimal SVG path parser for the doodle set: absolute M, L, C, Q, Z only.
// Used by scripts/gen-swift.ts (to emit SwiftUI Path builders) and to estimate
// stroke lengths for the draw-on animation.

export type PathCommand =
  | { op: 'M' | 'L'; x: number; y: number }
  | { op: 'Q'; x1: number; y1: number; x: number; y: number }
  | { op: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: 'Z' };

const ARITY = { M: 2, L: 2, Q: 4, C: 6, Z: 0 } as const;

export class UnsupportedPathError extends Error {}

export function parsePath(d: string): PathCommand[] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const out: PathCommand[] = [];
  let i = 0;
  while (i < tokens.length) {
    const op = tokens[i++];
    if (!(op in ARITY)) {
      throw new UnsupportedPathError(`Unsupported path command "${op}" in "${d}"`);
    }
    const n = ARITY[op as keyof typeof ARITY];
    const nums = tokens.slice(i, i + n).map(Number);
    if (nums.length !== n || nums.some(Number.isNaN)) {
      throw new UnsupportedPathError(`Command "${op}" expects ${n} numbers in "${d}"`);
    }
    i += n;
    switch (op) {
      case 'M':
      case 'L':
        out.push({ op, x: nums[0], y: nums[1] });
        break;
      case 'Q':
        out.push({ op, x1: nums[0], y1: nums[1], x: nums[2], y: nums[3] });
        break;
      case 'C':
        out.push({ op, x1: nums[0], y1: nums[1], x2: nums[2], y2: nums[3], x: nums[4], y: nums[5] });
        break;
      case 'Z':
        out.push({ op: 'Z' });
        break;
    }
  }
  return out;
}

/** Approximate stroke length by walking control polygons. Overestimates slightly, which is what dash offsets need. */
export function approxLength(commands: PathCommand[]): number {
  let len = 0;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
  for (const c of commands) {
    switch (c.op) {
      case 'M':
        x = sx = c.x;
        y = sy = c.y;
        break;
      case 'L':
        len += dist(x, y, c.x, c.y);
        x = c.x;
        y = c.y;
        break;
      case 'Q':
        len += dist(x, y, c.x1, c.y1) + dist(c.x1, c.y1, c.x, c.y);
        x = c.x;
        y = c.y;
        break;
      case 'C':
        len += dist(x, y, c.x1, c.y1) + dist(c.x1, c.y1, c.x2, c.y2) + dist(c.x2, c.y2, c.x, c.y);
        x = c.x;
        y = c.y;
        break;
      case 'Z':
        len += dist(x, y, sx, sy);
        x = sx;
        y = sy;
        break;
    }
  }
  return Math.ceil(len);
}
