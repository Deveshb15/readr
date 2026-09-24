import { useEffect, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs, useMotionMode } from '../motion';
import { colors, radius, shadow, space } from '../tokens';

/** one year's onboarding card: appears at −4°, settles to −2°. */
export function TiltedCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const mode = useMotionMode();
  const tilt = useSharedValue(mode === 'full' ? -4 : -2);
  const enter = useSharedValue(mode === 'full' ? 0 : 1);
  useEffect(() => {
    tilt.value = withSpring(-2, springs.settle);
    enter.value = withSpring(1, springs.settle);
  }, [tilt, enter]);
  const animated = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 24 }, { rotate: `${tilt.value}deg` }],
  }));
  return <Animated.View style={[styles.card, animated, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: space.x3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...shadow.lifted,
  },
});
