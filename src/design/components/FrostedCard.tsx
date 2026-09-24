import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from '../tokens';

/** one year's frosted widget card: blur + translucent white + 1px top highlight, no shadow. */
export function FrostedCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.clip, style]}>
      <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={styles.highlight} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { borderRadius: radius.card, overflow: 'hidden' },
  tint: { backgroundColor: colors.surface },
  highlight: {
    position: 'absolute',
    top: 0,
    left: radius.card,
    right: radius.card,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  content: { padding: space.x4 },
});
