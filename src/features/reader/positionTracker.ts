// Pure reading-position logic, driven by scroll messages and a clock.
// Marks read exactly once (≥98%, or a 3s dwell on articles that fit on screen)
// and saves position at most once a second.

export const READ_THRESHOLD = 0.98;
export const SHORT_DWELL_MS = 3000;
export const SAVE_INTERVAL_MS = 1000;

export type ScrollSample = { y: number; h: number; vh: number; p: number };

export type TrackerEffects = {
  markRead: () => void;
  save: (scrollY: number, progress: number) => void;
};

export function createPositionTracker(initiallyRead: boolean, effects: TrackerEffects, openedAt: number) {
  let read = initiallyRead;
  let lastSaveAt = -Infinity;
  let pending: ScrollSample | null = null;
  let fitsOnScreen = false;

  const markRead = () => {
    if (read) return;
    read = true;
    effects.markRead();
  };

  return {
    get isRead() {
      return read;
    },
    onScroll(sample: ScrollSample, now: number) {
      fitsOnScreen = sample.h <= sample.vh * 1.05;
      if (sample.p >= READ_THRESHOLD && !fitsOnScreen) markRead();
      pending = sample;
      if (now - lastSaveAt >= SAVE_INTERVAL_MS) this.flush(now);
    },
    /** Call on a timer (and on unmount) to persist the latest sample and check dwell. */
    tick(now: number) {
      if (fitsOnScreen && now - openedAt >= SHORT_DWELL_MS) markRead();
      if (pending && now - lastSaveAt >= SAVE_INTERVAL_MS) this.flush(now);
    },
    flush(now: number) {
      if (!pending) return;
      effects.save(pending.y, pending.p);
      lastSaveAt = now;
      pending = null;
    },
  };
}

export type ChromeDirection = 'show' | 'hide' | 'keep';

/** Hide chrome when scrolling down past the header, show when scrolling up (8pt hysteresis). */
export function chromeDirection(prevY: number, y: number): ChromeDirection {
  if (y < 64) return 'show';
  const dy = y - prevY;
  if (dy > 8) return 'hide';
  if (dy < -8) return 'show';
  return 'keep';
}
