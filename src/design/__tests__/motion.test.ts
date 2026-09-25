import { motionPreset } from '../motion';

// jest.mock is hoisted above the import by babel-jest.
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));

describe('motionPreset', () => {
  it('is opacity-only under Reduce Motion', () => {
    expect(motionPreset('reduced')).toMatchObject({ transform: false, drawOn: false, zoom: false });
  });
  it('enables transforms, draw-on and zoom otherwise', () => {
    expect(motionPreset('full')).toMatchObject({ transform: true, drawOn: true, zoom: true });
  });
});
