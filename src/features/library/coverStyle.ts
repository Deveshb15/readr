// Deterministic "book" styling per article: tilt and a typographic cover palette
// for articles without a lead image. Same article → same look, every launch.

export type CoverPalette = { background: string; ink: string; muted: string };

// Light, paper-like cover stocks that sit well on the grey canvas, plus one ink cover.
export const COVER_PALETTES: readonly CoverPalette[] = [
  { background: '#E9E5F6', ink: '#1800CC', muted: '#5A4FB0' },
  { background: '#F2E8DA', ink: '#3B2A14', muted: '#8A7458' },
  { background: '#E0EBE4', ink: '#17392A', muted: '#5C7A6B' },
  { background: '#F2E1E5', ink: '#4A1426', muted: '#94606F' },
  { background: '#1800CC', ink: '#FFFFFF', muted: '#B9B2F2' },
  { background: '#ECEAE1', ink: '#232322', muted: '#7A786F' },
];

function hash(id: string): number {
  // Article ids are 16 hex chars; the first 6 are plenty of entropy for styling.
  const n = parseInt(id.slice(0, 6), 16);
  return Number.isNaN(n) ? 0 : n;
}

export function paletteFor(doodle: number): CoverPalette {
  const i = ((doodle % COVER_PALETTES.length) + COVER_PALETTES.length) % COVER_PALETTES.length;
  return COVER_PALETTES[i];
}

export const MIN_TILT = 0.8;
export const MAX_TILT = 2.6;

/**
 * Books lean outward: left column tilts left (negative), right column tilts right.
 * Magnitude varies per article between MIN_TILT and MAX_TILT degrees.
 */
export function tiltFor(id: string, column: 0 | 1): number {
  const magnitude = MIN_TILT + ((hash(id) % 1000) / 1000) * (MAX_TILT - MIN_TILT);
  const rounded = Math.round(magnitude * 10) / 10;
  return column === 0 ? -rounded : rounded;
}

/** Groups items into shelf rows of `perRow`. */
export function toShelves<T>(items: T[], perRow = 2): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  return rows;
}
