import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { PressableScale } from '../../design/components/PressableScale';
import { springs } from '../../design/motion';
import { colors, fonts } from '../../design/tokens';
import { T } from '../../design/typography';
import type { OfflineState } from '../../data/article';
import { OfflineBadge } from '../offline/OfflineBadge';

type Props = {
  visible: SharedValue<number>;
  top: number;
  onBack: () => void;
  onSettings: () => void;
  minutesLeft: number | null;
  offline: OfflineState;
};

/**
 * Two solid round buttons — back (left) and text settings (right) — that read as
 * buttons on any paper tone. They slide away on scroll down and return on scroll up.
 */
export function ReaderChrome({ visible, top, onBack, onSettings, minutesLeft, offline }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: withSpring(visible.value, springs.slide),
    transform: [{ translateY: withSpring((1 - visible.value) * -80, springs.slide) }],
  }));
  return (
    <Animated.View pointerEvents="box-none" style={[styles.bar, { top }, style]}>
      <PressableScale onPress={onBack} accessibilityRole="button" accessibilityLabel="back to library" style={styles.button}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M15 5 L8 12 L15 19" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </PressableScale>
      <View style={styles.pill} accessibilityLabel={`${offline === 'offline' ? 'saved offline. ' : ''}${minutesLeft ?? ''} minutes left`}>
        <OfflineBadge state={offline} size={16} />
        {minutesLeft !== null && (
          <T variant="monoXs" color={colors.textMuted}>
            {minutesLeft} min left
          </T>
        )}
      </View>
      <PressableScale onPress={onSettings} accessibilityRole="button" accessibilityLabel="text settings" style={styles.button}>
        <T variant="rowTitle" style={styles.aa}>
          Aa
        </T>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceSolid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    boxShadow: '0 4px 12px -6px rgba(20,10,80,0.25)',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSolid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    boxShadow: '0 6px 16px -6px rgba(20,10,80,0.28), 0 1px 3px rgba(20,10,80,0.12)',
  },
  aa: { fontFamily: fonts.serifTitle, fontSize: 17, lineHeight: 20, color: colors.text },
});
