import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Article } from '../../data/article';
import { DateChip } from '../../design/components/DateChip';
import { FadedTextButton } from '../../design/components/FadedTextButton';
import { InkButton } from '../../design/components/InkButton';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { useIsOffline } from '../../sync/connectivity';
import { retryNow } from '../../sync/retry';

/** Link-only saves: honest state instead of an empty page. */
export function LinkOnlyState({ article }: { article: Article }) {
  const insets = useSafeAreaInsets();
  const offline = useIsOffline();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 96 }]}>
      <DateChip label="needs internet" tone="faint" />
      <T variant="readTitle">{article.title}</T>
      <T variant="monoSm" color={colors.textMuted}>
        {offline
          ? "readr couldn't save this page for offline reading. it'll try again when you're back online."
          : "readr couldn't save a clean copy of this page yet."}
      </T>
      {!offline && (
        <View style={styles.actions}>
          <InkButton label="try again now" onPress={() => retryNow(article.id)} />
          <FadedTextButton label="open original" onPress={() => Linking.openURL(article.url).catch(() => {})} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: inset.list + 4, gap: space.x4 },
  actions: { marginTop: space.x6, gap: space.x2 },
});
