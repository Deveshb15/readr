import { StyleSheet, View, type ViewStyle } from 'react-native';

import { T } from '../typography';
import { colors, radius } from '../tokens';

type Props = { label: string; tone?: 'ink' | 'faint'; style?: ViewStyle };

/** one year's "friday, 01.02" chip. Also used for "offline", "saved 2h ago", "needs internet". */
export function DateChip({ label, tone = 'ink', style }: Props) {
  const ink = tone === 'ink';
  return (
    <View style={[styles.chip, { backgroundColor: ink ? colors.ink : colors.inkWash }, style]}>
      <T variant="monoXs" color={ink ? colors.white : colors.ink}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
