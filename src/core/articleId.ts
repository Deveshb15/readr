// FNV-1a 64-bit over UTF-8, as 16 lowercase hex chars. No TextEncoder (JSContext lacks it).

const OFFSET = 0xcbf29ce484222325n;
const PRIME = 0x100000001b3n;
const MASK = 0xffffffffffffffffn;

export function utf8Bytes(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 63),
        0x80 | ((cp >> 6) & 63),
        0x80 | (cp & 63),
      );
  }
  return out;
}

export function fnv1a64(s: string): string {
  let h = OFFSET;
  for (const b of utf8Bytes(s)) {
    h ^= BigInt(b);
    h = (h * PRIME) & MASK;
  }
  return h.toString(16).padStart(16, '0');
}

export function doodleIndexFor(id: string, count: number): number {
  if (count <= 0) return 0;
  return parseInt(id.slice(-8), 16) % count;
}
