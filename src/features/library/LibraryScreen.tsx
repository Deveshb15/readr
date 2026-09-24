import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Article } from '../../data/article';
import { useLibraryStore } from '../../data/libraryStore';
import { DateChip } from '../../design/components/DateChip';
import { EmptyState } from '../../design/components/EmptyState';
import { haptic } from '../../design/haptics';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { useIsOffline } from '../../sync/connectivity';
import { removeArticle } from '../../sync';
import { ArticleRow } from './ArticleRow';
import { FlightStatus } from './FlightStatus';
import { flightStatus, groupLibrary, monthLabel, shelfDots } from './selectors';
import { ShelfStrip } from './ShelfStrip';
import { SwipeableRow } from './SwipeableRow';

type Item = { type: 'article'; article: Article } | { type: 'readHeader'; count: number; open: boolean };

export function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const articles = useLibraryStore((s) => s.articles);
  const arrivals = useLibraryStore((s) => s.arrivals);
  const consumeArrival = useLibraryStore((s) => s.consumeArrival);
  const offline = useIsOffline();
  const [readOpen, setReadOpen] = useState(false);
  const now = Date.now();

  const { unread, read } = useMemo(() => groupLibrary(articles), [articles]);
  const dots = useMemo(() => shelfDots(articles, new Date(now)), [articles, now]);
  const status = useMemo(() => flightStatus(articles), [articles]);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = unread.map((article) => ({ type: 'article', article }));
    if (read.length > 0) {
      list.push({ type: 'readHeader', count: read.length, open: readOpen });
      if (readOpen) for (const article of read) list.push({ type: 'article', article });
    }
    return list;
  }, [unread, read, readOpen]);

  const onArrived = useCallback((id: string) => consumeArrival(id), [consumeArrival]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) =>
      item.type === 'article' ? (
        <SwipeableRow onDelete={() => removeArticle(item.article.id)}>
          <ArticleRow article={item.article} isNew={arrivals.has(item.article.id)} now={now} onArrived={onArrived} />
        </SwipeableRow>
      ) : (
        <Pressable
          style={styles.readHeader}
          accessibilityRole="button"
          accessibilityState={{ expanded: item.open }}
          onPress={() => {
            haptic('selection');
            setReadOpen((o) => !o);
          }}
        >
          <DateChip label={`${String(item.count).padStart(2, '0')} read`} tone="faint" />
          <T variant="monoSm" color={colors.textMuted}>
            {item.open ? 'hide' : 'show'}
          </T>
        </Pressable>
      ),
    [arrivals, now, onArrived],
  );

  if (articles.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          title="nothing saved yet."
          helper="save any article from safari or another app, then read it anywhere — even at 38,000 ft."
          actionLabel="show me how"
          onAction={() => router.push('/onboarding')}
        />
      </View>
    );
  }

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + space.x4 }]}>
      <View style={styles.titleRow}>
        <T variant="italicDisplay">readr</T>
        {offline && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <DateChip label="offline" />
          </Animated.View>
        )}
      </View>
      {offline && (
        <T variant="monoSm" color={colors.textMuted}>
          no signal. everything here still works.
        </T>
      )}
      <ShelfStrip dots={dots} month={monthLabel(new Date(now))} />
      <FlightStatus status={status} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => (item.type === 'article' ? item.article.id : 'read-header')}
        getItemType={(item) => item.type}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.x12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  center: { justifyContent: 'center' },
  header: { paddingHorizontal: inset.list, paddingBottom: space.x5, gap: space.x4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: inset.list,
    paddingVertical: space.x4,
    minHeight: 44,
  },
});
