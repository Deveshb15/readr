import data from './doodles.json';
import { approxLength, parsePath } from './pathParser';

export type DoodleDef = {
  name: string;
  paths: { d: string; length: number }[];
};

export const DOODLE_VIEWBOX = data.viewBox;

export const doodles: readonly DoodleDef[] = data.doodles.map((doodle) => ({
  name: doodle.name,
  paths: doodle.paths.map((d) => ({ d, length: approxLength(parsePath(d)) })),
}));

export const DOODLE_COUNT = doodles.length;

/** Articles store a doodle index. Out-of-range indexes (shouldn't happen) wrap. */
export function doodleAt(index: number): DoodleDef {
  const i = ((index % DOODLE_COUNT) + DOODLE_COUNT) % DOODLE_COUNT;
  return doodles[i];
}

export function doodleNamed(name: string): DoodleDef | undefined {
  return doodles.find((d) => d.name === name);
}
