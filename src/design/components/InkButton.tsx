import { StyleSheet } from 'react-native';

import { T } from '../typography';
import { colors, radius, size } from '../tokens';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

/** one year's primary button: ink fill, lowercase mono label. */
export function InkButton({ label, onPress, disabled, accessibilityHint }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[styles.button, disabled && styles.disabled]}
    >
      <T variant="monoLg" color={colors.white}>
        {label}
      </T>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: size.buttonHeight,
    borderRadius: radius.button,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabled: { backgroundColor: colors.inkFaint },
});
