import { Pressable } from 'react-native';

import { T } from '../typography';
import { colors, size } from '../tokens';

/** one year's "skip": faded mono text with a full-size hit area. */
export function FadedTextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      style={({ pressed }) => ({
        minHeight: size.hitSlop,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <T variant="monoSm" color={colors.textMuted}>
        {label}
      </T>
    </Pressable>
  );
}
