import * as Haptics from 'expo-haptics';

// Semantic haptics from the design system motion table. Failures are ignored:
// haptics never carry meaning on their own.
const map = {
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  snap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  threshold: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
  selection: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
} as const;

export type HapticName = keyof typeof map;

export function haptic(name: HapticName): void {
  map[name]().catch(() => {});
}
