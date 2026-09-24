import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic, type HapticName } from '../haptics';
import { pressScale, springs, useMotionMode } from '../motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  pressHaptic?: HapticName | null;
};

/** Shared press feedback: spring to 0.97 (or dim under Reduce Motion) plus an optional haptic. */
export function PressableScale({ style, children, pressHaptic = 'press', onPressIn, onPressOut, ...rest }: Props) {
  const mode = useMotionMode();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() =>
    mode === 'full'
      ? { transform: [{ scale: 1 - (1 - pressScale) * pressed.value }] }
      : { opacity: 1 - 0.25 * pressed.value },
  );
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = withSpring(1, springs.press);
        if (pressHaptic) haptic(pressHaptic);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, springs.press);
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
