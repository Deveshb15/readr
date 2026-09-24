import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../design/haptics';
import { springs } from '../../design/motion';
import { colors } from '../../design/tokens';
import { T } from '../../design/typography';

const THRESHOLD = 96;
const RUBBER_START = 140;

/** Swipe left to delete. Rubber-bands past 140pt; rigid haptic when crossing the threshold. */
export function SwipeableRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const x = useSharedValue(0);
  const armed = useSharedValue(false);
  const measured = useSharedValue(0);
  const height = useSharedValue<number | null>(null);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      const raw = Math.min(0, e.translationX);
      const dist = -raw;
      x.value = dist <= RUBBER_START ? raw : -(RUBBER_START + (dist - RUBBER_START) * 0.3);
      const isArmed = dist >= THRESHOLD;
      if (isArmed !== armed.value) {
        armed.value = isArmed;
        runOnJS(haptic)(isArmed ? 'threshold' : 'selection');
      }
    })
    .onEnd(() => {
      if (armed.value) {
        x.value = withTiming(-600, { duration: 200 }, () => {
          height.value = measured.value;
          height.value = withTiming(0, { duration: 180 }, () => runOnJS(onDelete)());
        });
      } else {
        x.value = withSpring(0, springs.snap);
        armed.value = false;
      }
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const containerStyle = useAnimatedStyle(() => (height.value === null ? {} : { height: height.value, overflow: 'hidden' }));
  const actionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(-x.value, [0, THRESHOLD], [0, 1], 'clamp'),
    backgroundColor: armed.value ? colors.danger : colors.canvasDeep,
  }));

  return (
    <Animated.View
      style={containerStyle}
      onLayout={(e) => {
        measured.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.action, actionStyle]}>
        <View style={styles.actionLabel}>
          <T variant="monoSm" color={colors.white}>
            delete
          </T>
        </View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  action: { justifyContent: 'center', alignItems: 'flex-end' },
  actionLabel: { paddingRight: 24 },
});
