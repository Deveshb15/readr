import { create } from 'zustand';

import type { ArticleRepo } from '../../data/repo';
import { paperTones, type PaperTone } from '../../design/tokens';

export type ReaderFont = 'serif' | 'sans' | 'mono';
export type ReaderWidth = 'narrow' | 'wide';
export type ReaderSettings = { tone: PaperTone; font: ReaderFont; size: number; width: ReaderWidth };

export const SIZE_STEPS = [16, 17, 18, 19, 20, 22, 24] as const;
export const DEFAULT_SETTINGS: ReaderSettings = { tone: 'paper', font: 'serif', size: 3, width: 'narrow' };
const KEY = 'reader_settings';

const FONT_STACKS: Record<ReaderFont, string> = {
  serif: '"Newsreader", "New York", Georgia, serif',
  sans: '-apple-system, "SF Pro Text", system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, monospace',
};

export function parseSettings(raw: string | null): ReaderSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const v = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      tone: v.tone && v.tone in paperTones ? v.tone : DEFAULT_SETTINGS.tone,
      font: v.font && v.font in FONT_STACKS ? v.font : DEFAULT_SETTINGS.font,
      size: typeof v.size === 'number' ? Math.min(SIZE_STEPS.length - 1, Math.max(0, Math.round(v.size))) : DEFAULT_SETTINGS.size,
      width: v.width === 'wide' ? 'wide' : 'narrow',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** CSS variables for reader.css. Settings changes only ever touch these. */
export function cssVars(s: ReaderSettings): Record<string, string> {
  const tone = paperTones[s.tone];
  const size = SIZE_STEPS[s.size];
  return {
    '--paper': tone.background,
    '--ink-text': tone.text,
    '--muted': tone.muted,
    '--body-font': FONT_STACKS[s.font],
    '--body-size': `${size}px`,
    '--body-leading': s.font === 'mono' ? '1.65' : '1.58',
    '--measure': s.width === 'wide' ? '40em' : '34em',
  };
}

type State = {
  settings: ReaderSettings;
  hydrate: (repo: ArticleRepo) => void;
  update: (repo: ArticleRepo, patch: Partial<ReaderSettings>) => void;
};

export const useReaderSettings = create<State>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrate: (repo) => set({ settings: parseSettings(repo.getSetting(KEY)) }),
  update: (repo, patch) => {
    const settings = { ...get().settings, ...patch };
    repo.setSetting(KEY, JSON.stringify(settings));
    set({ settings });
  },
}));
