import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { InkButton } from '../../design/components/InkButton';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleNamed, doodles } from '../../design/doodles/registry';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { useTutorial } from './tutorialStore';

const RING = ['star', 'tulip', 'paper-plane', 'daisy', 'kite', 'cloud', 'cherries'];

/** One-time "you did it" after the first real Safari save (origin R16, AE7). */
export function Celebration() {
  const celebrating = useTutorial((s) => s.celebrating);
  const end = useTutorial((s) => s.endCelebration);
  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(end, 6000);
    return () => clearTimeout(t);
  }, [celebrating, end]);
  if (!celebrating) return null;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, styles.wrap]}>
      <View style={styles.ring}>
        {RING.map((name, i) => (
          <Doodle key={name} doodle={doodleNamed(name) ?? doodles[0]} size={28} drawOn delayMs={i * 90} />
        ))}
      </View>
      <T variant="italicDisplay" style={styles.center}>
        you did it.
      </T>
      <T variant="monoSm" color={colors.textMuted} style={styles.center}>
        that article is on your phone now. it'll open anywhere.
      </T>
      <View style={styles.action}>
        <InkButton label="see it" onPress={end} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(222,222,222,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: inset.onboarding,
    gap: space.x4,
  },
  ring: { flexDirection: 'row', gap: space.x3, marginBottom: space.x4 },
  center: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: space.x6 },
});
