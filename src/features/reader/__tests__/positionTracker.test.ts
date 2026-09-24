import { chromeDirection, createPositionTracker } from '../positionTracker';

const long = (p: number) => ({ y: p * 4000, h: 4800, vh: 800, p });

function setup(initiallyRead = false) {
  const markRead = jest.fn();
  const save = jest.fn();
  const t = createPositionTracker(initiallyRead, { markRead, save }, 0);
  return { t, markRead, save };
}

describe('createPositionTracker', () => {
  it('covers AE6: 0 → 0.5 → 0.99 marks read exactly once', () => {
    const { t, markRead } = setup();
    t.onScroll(long(0), 0);
    t.onScroll(long(0.5), 500);
    t.onScroll(long(0.99), 1500);
    t.onScroll(long(1), 2600);
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(t.isRead).toBe(true);
  });

  it('never marks an already-read article again', () => {
    const { t, markRead } = setup(true);
    t.onScroll(long(1), 0);
    expect(markRead).not.toHaveBeenCalled();
  });

  it('saves at most once a second and flushes the latest sample on tick', () => {
    const { t, save } = setup();
    t.onScroll(long(0.1), 0);
    t.onScroll(long(0.2), 300);
    t.onScroll(long(0.3), 600);
    expect(save).toHaveBeenCalledTimes(1);
    t.tick(1100);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(long(0.3).y, 0.3);
  });

  it('round-trips a saved scrollY', () => {
    const { t, save } = setup();
    t.onScroll({ y: 1234, h: 4800, vh: 800, p: 0.3085 }, 0);
    expect(save).toHaveBeenCalledWith(1234, 0.3085);
  });

  it('marks short articles read after a 3s dwell instead of never', () => {
    const { t, markRead } = setup();
    t.onScroll({ y: 0, h: 700, vh: 800, p: 1 }, 100);
    expect(markRead).not.toHaveBeenCalled();
    t.tick(2900);
    expect(markRead).not.toHaveBeenCalled();
    t.tick(3000);
    expect(markRead).toHaveBeenCalledTimes(1);
  });
});

describe('chromeDirection', () => {
  it('shows near the top, hides scrolling down, shows scrolling up', () => {
    expect(chromeDirection(0, 30)).toBe('show');
    expect(chromeDirection(200, 240)).toBe('hide');
    expect(chromeDirection(400, 360)).toBe('show');
    expect(chromeDirection(400, 404)).toBe('keep');
  });
});
