import { memo, useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { durations, useMotionMode } from '../motion';
import { colors } from '../tokens';
import { DOODLE_VIEWBOX, type DoodleDef } from './registry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  doodle: DoodleDef;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Signature motion: strokes draw themselves. Off by default so static doodles cost nothing. */
  drawOn?: boolean;
  delayMs?: number;
};

export const Doodle = memo(function Doodle({
  doodle,
  size = 24,
  color = colors.ink,
  strokeWidth = 1.75,
  drawOn = false,
  delayMs = 0,
}: Props) {
  // Keep visual stroke width constant in points regardless of render size.
  const sw = (strokeWidth * DOODLE_VIEWBOX) / size;
  const mode = useMotionMode();
  const animate = drawOn && mode === 'full';
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${DOODLE_VIEWBOX} ${DOODLE_VIEWBOX}`}>
      {doodle.paths.map((p, i) =>
        animate ? (
          <DrawOnPath
            key={i}
            d={p.d}
            length={p.length}
            color={color}
            strokeWidth={sw}
            delayMs={delayMs + i * durations.drawStagger}
          />
        ) : (
          <Path
            key={i}
            d={p.d}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ),
      )}
    </Svg>
  );
});

function DrawOnPath({
  d,
  length,
  color,
  strokeWidth,
  delayMs,
}: {
  d: string;
  length: number;
  color: string;
  strokeWidth: number;
  delayMs: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durations.drawOn, easing: Easing.out(Easing.cubic) }),
    );
  }, [delayMs, progress]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
}
