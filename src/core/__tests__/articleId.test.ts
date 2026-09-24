import { doodleIndexFor, fnv1a64, utf8Bytes } from '../articleId';

describe('fnv1a64', () => {
  it('matches published FNV-1a 64 test vectors', () => {
    expect(fnv1a64('')).toBe('cbf29ce484222325');
    expect(fnv1a64('a')).toBe('af63dc4c8601ec8c');
    expect(fnv1a64('foobar')).toBe('85944171f73967e8');
  });

  it('hashes non-ASCII as UTF-8', () => {
    expect(utf8Bytes('é')).toEqual([0xc3, 0xa9]);
    expect(utf8Bytes('😀')).toEqual([0xf0, 0x9f, 0x98, 0x80]);
    expect(fnv1a64('café')).not.toBe(fnv1a64('cafe'));
  });
});

describe('doodleIndexFor', () => {
  it('stays within range and handles an empty set', () => {
    expect(doodleIndexFor('ffffffffffffffff', 24)).toBeLessThan(24);
    expect(doodleIndexFor('0000000000000000', 24)).toBe(0);
    expect(doodleIndexFor('abc', 0)).toBe(0);
  });
});
