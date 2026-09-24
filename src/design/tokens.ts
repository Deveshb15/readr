// Single source of truth for Readr's visual tokens (docs/design/design-system.md).
// scripts/gen-swift.ts turns these into Theme.swift for the share extension.

export const colors = {
  canvas: '#DEDEDE',
  canvasDeep: '#D2D2D6',
  surface: 'rgba(255,255,255,0.45)',
  surfaceSolid: '#FCFCFC',
  ink: '#1800CC',
  inkPressed: '#1200A2',
  inkWash: '#D4D0E6',
  inkFaint: 'rgba(24,0,204,0.35)',
  text: '#111114',
  textMuted: '#8C8C96',
  textFaint: '#AEAEB4',
  hairline: 'rgba(0,0,0,0.06)',
  paper: '#F6F5F2',
  paperText: '#1A1A1F',
  paperMuted: '#6E6E78',
  white: '#FFFFFF',
  danger: '#C8322B',
} as const;

export type ColorToken = keyof typeof colors;

export const space = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
  x12: 48,
  x16: 64,
} as const;

export const inset = {
  list: 20,
  onboarding: 40,
} as const;

export const radius = {
  chip: 8,
  button: 10,
  row: 16,
  card: 24,
  sheet: 32,
  deviceMock: 44,
  pill: 999,
} as const;

export const size = {
  buttonHeight: 56,
  hitSlop: 44,
  doodleStamp: 24,
  thumb: 56,
  thumbPixels: 112,
} as const;

export const shadow = {
  lifted: {
    shadowColor: '#140A50',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
  },
} as const;

export const fonts = {
  mono: 'GeistMono-Regular',
  monoMedium: 'GeistMono-Medium',
  serifTitle: 'Newsreader-Medium',
  serifDisplay: 'Newsreader-Display',
  serifItalic: 'InstrumentSerif-Italic',
} as const;

/** Reader paper tones (all light — the app has no dark mode). */
export const paperTones = {
  paper: { background: '#F6F5F2', text: '#1A1A1F', muted: '#6E6E78' },
  white: { background: '#FFFFFF', text: '#1A1A1F', muted: '#6E6E78' },
  canvas: { background: '#E8E8EA', text: '#16161B', muted: '#66666F' },
} as const;

export type PaperTone = keyof typeof paperTones;
