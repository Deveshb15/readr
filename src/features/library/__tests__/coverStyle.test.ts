import { COVER_PALETTES, MAX_TILT, MIN_TILT, paletteFor, tiltFor, toShelves } from '../coverStyle';

describe('tiltFor', () => {
  const ids = ['00000000000000aa', 'ffffffffffffffff', '1a2b3c4d5e6f7788', '9f8e7d6c5b4a3921'];

  it('leans left in the left column and right in the right column', () => {
    for (const id of ids) {
      expect(tiltFor(id, 0)).toBeLessThan(0);
      expect(tiltFor(id, 1)).toBeGreaterThan(0);
    }
  });

  it('stays within the subtle range', () => {
    for (const id of ids) {
      const t = Math.abs(tiltFor(id, 0));
      expect(t).toBeGreaterThanOrEqual(MIN_TILT);
      expect(t).toBeLessThanOrEqual(MAX_TILT);
    }
  });

  it('is deterministic per article', () => {
    expect(tiltFor('1a2b3c4d5e6f7788', 1)).toBe(tiltFor('1a2b3c4d5e6f7788', 1));
  });

  it('falls back to the minimum tilt for malformed ids', () => {
    expect(tiltFor('zz', 1)).toBe(MIN_TILT);
  });
});

describe('paletteFor', () => {
  it('maps any doodle index (including negatives) onto a palette', () => {
    expect(paletteFor(0)).toBe(COVER_PALETTES[0]);
    expect(paletteFor(COVER_PALETTES.length)).toBe(COVER_PALETTES[0]);
    expect(paletteFor(-1)).toBe(COVER_PALETTES[COVER_PALETTES.length - 1]);
  });
});

describe('toShelves', () => {
  it('chunks into rows of two, keeping a trailing single book', () => {
    expect(toShelves([1, 2, 3, 4, 5])).toEqual([[1, 2], [3, 4], [5]]);
    expect(toShelves([])).toEqual([]);
  });
});
