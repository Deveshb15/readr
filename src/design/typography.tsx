import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from './tokens';

export const type = {
  monoXs: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
  monoSm: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
  monoMd: { fontFamily: fonts.mono, fontSize: 15, lineHeight: 22 },
  monoLg: { fontFamily: fonts.monoMedium, fontSize: 17, lineHeight: 24 },
  rowTitle: { fontFamily: fonts.serifTitle, fontSize: 17, lineHeight: 22 },
  readTitle: { fontFamily: fonts.serifDisplay, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  italicDisplay: { fontFamily: fonts.serifItalic, fontSize: 28, lineHeight: 32 },
  italicDek: { fontFamily: fonts.serifItalic, fontSize: 20, lineHeight: 28 },
  byline: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

type Props = TextProps & { variant?: TypeVariant; color?: string };

/** The app's only text primitive. UI copy is lowercase by convention, not by transform. */
export function T({ variant = 'monoMd', color = colors.text, style, ...rest }: Props) {
  return <Text {...rest} style={[type[variant], { color }, style]} />;
}

/**
 * Renders copy where numerals are in ink and the rest is faded — the one year
 * "trial ends in **07** days" pattern. Numbers are zero-padded to two digits.
 */
export function InkNumbers({
  text,
  variant = 'monoSm',
  baseColor = colors.textMuted,
}: {
  text: string;
  variant?: TypeVariant;
  baseColor?: string;
}) {
  const parts = splitNumbers(text);
  return (
    <T variant={variant} color={baseColor}>
      {parts.map((p, i) =>
        p.isNumber ? (
          <Text key={i} style={{ color: colors.ink }}>
            {p.value}
          </Text>
        ) : (
          p.value
        ),
      )}
    </T>
  );
}

export function splitNumbers(text: string): { value: string; isNumber: boolean }[] {
  return text
    .split(/(\d+)/)
    .filter((s) => s.length > 0)
    .map((s) =>
      /^\d+$/.test(s) ? { value: s.padStart(2, '0'), isNumber: true } : { value: s, isNumber: false },
    );
}
