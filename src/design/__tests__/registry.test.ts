import data from '../doodles/doodles.json';
import { parsePath } from '../doodles/pathParser';
import { DOODLE_COUNT, doodleAt, doodles } from '../doodles/registry';
import { splitNumbers } from '../typography';

describe('doodle registry', () => {
  it('has unique names, a 32 viewBox, and non-empty paths', () => {
    expect(data.viewBox).toBe(32);
    const names = doodles.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
    for (const d of doodles) {
      expect(d.paths.length).toBeGreaterThan(0);
      for (const p of d.paths) {
        expect(parsePath(p.d).length).toBeGreaterThan(1);
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps a stable, append-only order (existing articles keep their doodle)', () => {
    expect(doodles.slice(0, 24).map((d) => d.name)).toMatchInlineSnapshot(`
[
  "book",
  "paper-plane",
  "cloud",
  "cup",
  "lamp",
  "leaf",
  "mushroom",
  "house",
  "snail",
  "moon",
  "window-seat",
  "suitcase",
  "glasses",
  "bookmark",
  "envelope",
  "tulip",
  "daisy",
  "sprout",
  "rose",
  "star",
  "kite",
  "chair",
  "headphones",
  "cherries",
]
`);
  });

  it('wraps out-of-range indexes', () => {
    expect(doodleAt(DOODLE_COUNT).name).toBe('book');
    expect(doodleAt(-1).name).toBe(doodles[DOODLE_COUNT - 1].name);
  });
});

describe('splitNumbers (ink numerals)', () => {
  it('pads numbers to two digits and marks them', () => {
    expect(splitNumbers('2 not ready offline')).toEqual([
      { value: '02', isNumber: true },
      { value: ' not ready offline', isNumber: false },
    ]);
  });
  it('leaves copy without numbers untouched', () => {
    expect(splitNumbers('all set for your flight')).toEqual([
      { value: 'all set for your flight', isNumber: false },
    ]);
  });
});
