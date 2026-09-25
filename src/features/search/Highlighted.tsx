import { Text, type TextStyle } from 'react-native';

import { parseSnippet } from '../../data/search';
import { colors } from '../../design/tokens';
import { T, type TypeVariant } from '../../design/typography';

/** Renders an FTS highlight/snippet string, marking matched terms in ink on a wash. */
export function Highlighted({
  text,
  variant,
  color = colors.text,
  numberOfLines,
  style,
}: {
  text: string;
  variant: TypeVariant;
  color?: string;
  numberOfLines?: number;
  style?: TextStyle;
}) {
  return (
    <T variant={variant} color={color} numberOfLines={numberOfLines} style={style}>
      {parseSnippet(text).map((seg, i) =>
        seg.match ? (
          <Text key={i} style={{ color: colors.ink, backgroundColor: colors.inkWash }}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      )}
    </T>
  );
}
