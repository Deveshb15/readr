import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useMotionMode } from '../motion';
import { T } from '../typography';
import { colors, radius } from '../tokens';

type ToastState = { message: string | null; show: (message: string) => void; clear: () => void };

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));

/** Ink pill, top-center, auto-dismiss. Mounted once in the root layout. */
export function ToastHost() {
  const { message, clear } = useToast();
  const insets = useSafeAreaInsets();
  const mode = useMotionMode();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 2200);
    return () => clearTimeout(t);
  }, [message, clear]);
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={mode === 'full' ? SlideInUp.springify() : FadeIn}
      exiting={mode === 'full' ? SlideOutUp : FadeOut}
      style={[styles.toast, { top: insets.top + 8 }]}
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <T variant="monoSm" color={colors.white}>
        {message}
      </T>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
});
