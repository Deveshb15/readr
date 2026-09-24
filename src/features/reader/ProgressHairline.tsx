import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { colors } from '../../design/tokens';

export function ProgressHairline({ progress, top }: { progress: SharedValue<number>; top: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.bar, { top }, style]} />;
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.ink,
    transformOrigin: 'left',
  },
});
