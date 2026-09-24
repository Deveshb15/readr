import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { repo } from '../../data/db';
import { InkButton } from '../../design/components/InkButton';
import { Wordmark } from '../../design/components/Wordmark';
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
          Readr keeps the things you meant to read — the whole thing, pictures and all — right on your phone.
        </T>
        <T variant="monoMd" style={styles.center}>
          so the next time the wifi gives up at{' '}
          <T variant="monoMd" color={colors.ink}>
            38,000 ft
          </T>
          , your reading doesn't.
        </T>
        <T variant="monoMd" style={styles.center}>love,</T>
        <Wordmark size={30} />
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
