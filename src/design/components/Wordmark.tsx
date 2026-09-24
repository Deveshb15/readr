import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { durations, useMotionMode } from '../motion';
import { colors, fonts } from '../tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Hand-drawn shelf stroke, same gesture as the app icon's shelf line.
const UNDERLINE = 'M2 6 C 22 3.5, 62 7.5, 94 4.5';
const UNDERLINE_LENGTH = 96;

/** "Readr": ink R (like the icon's cover letter) + serif italic "eadr", underlined by a drawn shelf. */
export function Wordmark({ size = 34, underline = true }: { size?: number; underline?: boolean }) {
  const mode = useMotionMode();
  const progress = useSharedValue(mode === 'full' ? 0 : 1);
  useEffect(() => {
    if (mode === 'full') {
      progress.value = withDelay(250, withTiming(1, { duration: durations.drawOn, easing: Easing.out(Easing.cubic) }));
    }
  }, [mode, progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: UNDERLINE_LENGTH * (1 - progress.value) }));

  const width = size * 2.45;
  return (
    <View accessibilityRole="header" accessibilityLabel="Readr">
      <Text style={{ fontFamily: fonts.serifItalic, fontSize: size, lineHeight: size * 1.08, color: colors.text }}>
        <Text style={{ color: colors.ink }}>R</Text>eadr
      </Text>
      {underline && (
        <Svg width={width} height={size * 0.26} viewBox="0 0 96 9" style={{ marginTop: -size * 0.06 }}>
          <AnimatedPath
            d={UNDERLINE}
            stroke={colors.ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={[UNDERLINE_LENGTH, UNDERLINE_LENGTH]}
            animatedProps={animatedProps}
          />
        </Svg>
      )}
    </View>
  );
}
