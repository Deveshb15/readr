import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TiltedCard } from '../../design/components/TiltedCard';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleNamed, doodles } from '../../design/doodles/registry';
import { springs, useMotionMode } from '../../design/motion';
import { colors, radius, space } from '../../design/tokens';
import { T } from '../../design/typography';

const APPS = ['airdrop', 'messages', 'mail', 'Readr', 'notes'] as const;

/** A drawn share sheet (one year's widget-onboarding pattern): readr's icon lifts and pulses in ink. */
export function PhoneMock() {
  const mode = useMotionMode();
  const sheet = useSharedValue(mode === 'full' ? 60 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    sheet.value = withDelay(300, withSpring(0, springs.settle));
    if (mode === 'full') {
      pulse.value = withDelay(900, withRepeat(withSequence(withTiming(1.12, { duration: 420 }), withTiming(1, { duration: 420 })), -1));
    }
  }, [mode, pulse, sheet]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheet.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <TiltedCard style={styles.card}>
      <View style={styles.page}>
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '92%' }]} />
        <View style={[styles.line, { width: '84%' }]} />
      </View>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <T variant="monoXs" color={colors.textMuted}>
          reading at altitude · fieldnotes.com
        </T>
        <View style={styles.apps}>
          {APPS.map((app) => {
            const isReadr = app === 'Readr';
            const icon = (
              <View style={[styles.icon, isReadr && styles.readrIcon]}>
                {isReadr && <Doodle doodle={doodleNamed('bookmark') ?? doodles[0]} size={26} color={colors.white} />}
              </View>
            );
            return (
              <View key={app} style={styles.app}>
                {isReadr ? <Animated.View style={pulseStyle}>{icon}</Animated.View> : icon}
                <T variant="monoXs" color={isReadr ? colors.ink : colors.textFaint}>
                  {app}
                </T>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </TiltedCard>
  );
}

const styles = StyleSheet.create({
  card: { height: 280, overflow: 'hidden', padding: 0 },
  page: { padding: space.x5, gap: space.x3 },
  line: { height: 8, borderRadius: 4, backgroundColor: colors.canvasDeep },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.x4,
    gap: space.x4,
    backgroundColor: colors.surfaceSolid,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  apps: { flexDirection: 'row', justifyContent: 'space-between' },
  app: { alignItems: 'center', gap: 6 },
  icon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.canvasDeep, alignItems: 'center', justifyContent: 'center' },
  readrIcon: { backgroundColor: colors.ink },
});
