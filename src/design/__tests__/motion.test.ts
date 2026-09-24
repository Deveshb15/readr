import { motionPreset } from '../motion';

describe('motionPreset', () => {
  it('is opacity-only under Reduce Motion', () => {
    expect(motionPreset('reduced')).toMatchObject({ transform: false, drawOn: false, zoom: false });
  });
  it('enables transforms, draw-on and zoom otherwise', () => {
    expect(motionPreset('full')).toMatchObject({ transform: true, drawOn: true, zoom: true });
  });
});
