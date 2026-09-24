import { create } from 'zustand';

import type { Article } from '../../data/article';

type TutorialState = {
  visible: boolean;
  expanded: boolean;
  /** Set when the user leaves for Safari; the first Safari save after this celebrates. */
  startedAt: number | null;
  celebrating: boolean;
  open: (expanded?: boolean) => void;
  close: () => void;
  toggleExpanded: () => void;
  markStarted: (now: number) => void;
  celebrate: () => void;
  endCelebration: () => void;
};

export const useTutorial = create<TutorialState>((set) => ({
  visible: false,
  expanded: false,
  startedAt: null,
  celebrating: false,
  open: (expanded = false) => set({ visible: true, expanded }),
  close: () => set({ visible: false, expanded: false, startedAt: null }),
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
  markStarted: (now) => set({ startedAt: now }),
  celebrate: () => set({ visible: false, expanded: false, startedAt: null, celebrating: true }),
  endCelebration: () => set({ celebrating: false }),
}));

export const FIRST_SAFARI_SAVE_KEY = 'first_safari_save_celebrated';

/** First real Safari save after the tutorial sent the user to Safari (origin R16, AE7). */
export function isFirstSafariSave(added: Article[], startedAt: number | null, alreadyCelebrated: boolean): boolean {
  if (alreadyCelebrated || startedAt === null) return false;
  return added.some((a) => a.source === 'safari' && a.savedAt > startedAt);
}
