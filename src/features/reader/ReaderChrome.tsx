import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { PressableScale } from '../../design/components/PressableScale';
import { springs } from '../../design/motion';
import { colors, radius } from '../../design/tokens';
import { T } from '../../design/typography';

type Props = {
  visible: SharedValue<number>;
  top: number;
  onBack: () => void;
  onSettings: () => void;
};

/** Floating frosted pill: back + "aa". Hides on scroll down, returns on scroll up. */
export function ReaderChrome({ visible, top, onBack, onSettings }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: withSpring(visible.value, springs.slide),
    transform: [{ translateY: withSpring((1 - visible.value) * -72, springs.slide) }],
  }));
  return (
    <Animated.View style={[styles.wrap, { top }, style]}>
      <View style={styles.pill}>
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
        <PressableScale onPress={onBack} accessibilityRole="button" accessibilityLabel="back to library" style={styles.button}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M15 5 L8 12 L15 19" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </PressableScale>
        <View style={styles.divider} />
        <PressableScale onPress={onSettings} accessibilityRole="button" accessibilityLabel="reading settings" style={styles.button}>
          <T variant="monoMd">aa</T>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  tint: { backgroundColor: 'rgba(255,255,255,0.5)' },
  button: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: colors.hairline },
});
