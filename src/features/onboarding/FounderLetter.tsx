import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { repo } from '../../data/db';
import { InkButton } from '../../design/components/InkButton';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleNamed, doodles } from '../../design/doodles/registry';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { ONBOARDED_KEY } from './practiceSave';

/** one year's founder-letter moment, once, at the end of onboarding. */
export function FounderLetter() {
  const insets = useSafeAreaInsets();
  const finish = () => {
    repo().setSetting(ONBOARDED_KEY, '1');
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };
  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.x16, paddingBottom: insets.bottom + space.x6 }]}>
      <View style={styles.body}>
        <Doodle doodle={doodleNamed('window-seat') ?? doodles[0]} size={40} drawOn />
        <T variant="monoMd" style={styles.center}>hey friend</T>
        <T variant="monoMd" style={styles.center}>
          readr keeps the things you meant to read — the whole thing, pictures and all — right on your phone.
        </T>
        <T variant="monoMd" style={styles.center}>
          so the next time the wifi gives up at{' '}
          <T variant="monoMd" color={colors.ink}>
            38,000 ft
          </T>
          , your reading doesn't.
        </T>
        <T variant="monoMd" style={styles.center}>love,</T>
        <Svg width={140} height={48} viewBox="0 0 140 48" accessibilityLabel="signed, readr">
          <Path
            d="M8 34 C14 10 22 10 20 30 C19 40 28 18 34 24 C38 28 36 34 42 30 C48 26 46 20 52 22 C58 24 54 34 60 32 C68 28 64 14 72 18 C80 22 74 36 82 32 C90 28 88 22 96 24 C104 26 100 36 110 30 C118 26 124 20 132 22"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
      <InkButton label="start reading" onPress={finish} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: inset.onboarding, justifyContent: 'space-between' },
  body: { alignItems: 'center', gap: space.x5 },
  center: { textAlign: 'center' },
});
