import { useReducedMotion, type WithSpringConfig } from 'react-native-reanimated';

// Spring presets from the design system motion table. Everything interruptible.
export const springs = {
  press: { stiffness: 400, damping: 30, mass: 1 },
  settle: { stiffness: 180, damping: 18, mass: 1 },
  slide: { stiffness: 260, damping: 26, mass: 1 },
  snap: { stiffness: 320, damping: 32, mass: 1 },
} satisfies Record<string, WithSpringConfig>;

export const durations = {
  drawOn: 600,
  drawStagger: 40,
  fade: 180,
  fin: 420,
} as const;

export const pressScale = 0.97;

export type MotionMode = 'full' | 'reduced';

/**
 * Reduce Motion swaps transforms for opacity. Components read this once and
 * pick transform- or opacity-based animations accordingly.
 */
export function useMotionMode(): MotionMode {
  return useReducedMotion() ? 'reduced' : 'full';
}

export function motionPreset(mode: MotionMode) {
  return mode === 'reduced'
    ? { transform: false, drawOn: false, zoom: false, fadeMs: durations.fade }
    : { transform: true, drawOn: true, zoom: true, fadeMs: durations.fade };
}
