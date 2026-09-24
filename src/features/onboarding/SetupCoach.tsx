import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRACTICE_URL } from '../../core';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { FadedTextButton } from '../../design/components/FadedTextButton';
import { FrostedCard } from '../../design/components/FrostedCard';
import { InkButton } from '../../design/components/InkButton';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleAt, doodleNamed, doodles } from '../../design/doodles/registry';
import { haptic } from '../../design/haptics';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { syncNow } from '../../sync';
import { useTutorial } from '../tutorial/tutorialStore';
import { PhoneMock } from './PhoneMock';
import { practiceSave, type PracticeResult } from './practiceSave';

type Phase = 'intro' | 'saving' | PracticeResult;

const CELEBRATION = ['star', 'tulip', 'paper-plane', 'daisy', 'cloud'];

export function SetupCoach() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('intro');
  const saved = phase === 'success' || phase === 'already_saved';
  const practice = useLibraryStore((s) => s.articles.find((a) => a.source === 'practice') ?? null);

  const start = async () => {
    setPhase('saving');
    const result = await practiceSave({
      openShareSheet: async () => {
        await Share.share({ url: PRACTICE_URL });
      },
      sync: syncNow,
      findPractice: () => repo().all().find((a) => a.source === 'practice') ?? null,
    });
    setPhase(result);
    haptic(result === 'not_saved' ? 'warning' : 'success');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.x10, paddingBottom: insets.bottom + space.x6 }]}>
      <View style={styles.top}>
        <Doodle doodle={doodleNamed(saved ? 'star' : 'paper-plane') ?? doodles[0]} size={40} drawOn key={String(saved)} />
        {saved ? (
          <T variant="monoLg" style={styles.center}>
            that's it. it's saved{'\n'}
            <T variant="monoLg" color={colors.ink}>
              for offline
            </T>
            , right here.
          </T>
        ) : (
          <T variant="monoLg" style={styles.center}>
            save anything, read it{'\n'}
            <T variant="monoLg" color={colors.ink}>
              anywhere
            </T>
            . tap readr in the share sheet.
          </T>
        )}
      </View>

      <View style={styles.middle}>
        {saved && practice ? (
          <Animated.View entering={FadeInDown.springify()}>
            <FrostedCard>
              <View style={styles.previewRow}>
                <Doodle doodle={doodleAt(practice.doodle)} size={24} drawOn delayMs={200} />
                <View style={{ flex: 1, gap: 4 }}>
                  <T variant="rowTitle">{practice.title}</T>
                  <T variant="monoXs" color={colors.textMuted}>
                    readr · 1 min · saved just now
                  </T>
                </View>
              </View>
            </FrostedCard>
            <View style={styles.burst}>
              {CELEBRATION.map((name, i) => (
                <Animated.View key={name} entering={FadeIn.delay(120 * i)}>
                  <Doodle doodle={doodleNamed(name) ?? doodles[0]} size={22} drawOn delayMs={120 * i} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ) : (
          <PhoneMock />
        )}
        {phase === 'not_saved' && (
          <T variant="monoSm" color={colors.textMuted} style={styles.center}>
            didn't see readr? scroll the app row to the end, tap “more”, and add readr to your favourites.
          </T>
        )}
      </View>

      <View style={styles.actions}>
        {saved ? (
          <>
            <InkButton
              label="try it in safari"
              onPress={() => {
                useTutorial.getState().open(true);
                router.replace('/onboarding/letter');
              }}
            />
            <FadedTextButton label="next" onPress={() => router.replace('/onboarding/letter')} />
          </>
        ) : (
          <>
            <InkButton
              label={phase === 'not_saved' ? 'try again' : 'save my first article'}
              onPress={start}
              disabled={phase === 'saving'}
            />
            <FadedTextButton label="skip" onPress={() => router.replace('/onboarding/letter')} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: inset.onboarding, justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: space.x5 },
  center: { textAlign: 'center' },
  middle: { gap: space.x5 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  burst: { flexDirection: 'row', justifyContent: 'center', gap: space.x4, marginTop: space.x5 },
  actions: { gap: space.x2 },
});
