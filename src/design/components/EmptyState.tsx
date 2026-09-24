import { StyleSheet, View } from 'react-native';

import { Doodle } from '../doodles/Doodle';
import { doodleNamed, doodles } from '../doodles/registry';
import { T } from '../typography';
import { colors, inset, space } from '../tokens';
import { InkButton } from './InkButton';

type Props = { title: string; helper: string; actionLabel?: string; onAction?: () => void; doodle?: string };

export function EmptyState({ title, helper, actionLabel, onAction, doodle = 'window-seat' }: Props) {
  return (
    <View style={styles.wrap}>
      <Doodle doodle={doodleNamed(doodle) ?? doodles[0]} size={88} strokeWidth={2} drawOn />
      <T variant="italicDisplay" color={colors.text} style={styles.title}>
        {title}
      </T>
      <T variant="monoSm" color={colors.textMuted} style={styles.helper}>
        {helper}
      </T>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <InkButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: inset.onboarding, gap: space.x3 },
  title: { marginTop: space.x4, textAlign: 'center' },
  helper: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: space.x6 },
});
