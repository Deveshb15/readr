import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import type { Article } from '../../data/article';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { DateChip } from '../../design/components/DateChip';
import { EmptyState } from '../../design/components/EmptyState';
import { PillToggle } from '../../design/components/PillToggle';
import { haptic } from '../../design/haptics';
import { colors, inset, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { removeArticle } from '../../sync';
import { useIsOffline } from '../../sync/connectivity';
import { ArticleRow } from './ArticleRow';
import { toShelves } from './coverStyle';
import { FlightStatus } from './FlightStatus';
import { flightStatus, groupLibrary } from './selectors';
import { ShelfRow } from './ShelfRow';
import { SwipeableRow } from './SwipeableRow';

type ViewMode = 'shelf' | 'list';
const VIEW_KEY = 'library_view';

type Item =
  | { type: 'section'; key: string; label: string; count: number; collapsible: boolean; open: boolean }
  | { type: 'shelf'; key: string; books: Article[] }
  | { type: 'row'; key: string; article: Article };

export function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const articles = useLibraryStore((s) => s.articles);
  const arrivals = useLibraryStore((s) => s.arrivals);
  const consumeArrival = useLibraryStore((s) => s.consumeArrival);
  const offline = useIsOffline();
  const [readOpen, setReadOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>(() => (repo().getSetting(VIEW_KEY) === 'list' ? 'list' : 'shelf'));
  const now = Date.now();

  // Two books per shelf with a comfortable gutter between them.
  const bookWidth = Math.floor((width - (inset.list + 8) * 2 - 28) / 2) - 4;

  const { unread, read } = useMemo(() => groupLibrary(articles), [articles]);
  const status = useMemo(() => flightStatus(articles), [articles]);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const push = (list: Article[], prefix: string) => {
      if (mode === 'shelf') {
        toShelves(list).forEach((books, i) => out.push({ type: 'shelf', key: `${prefix}-${i}-${books[0].id}`, books }));
      } else {
        for (const article of list) out.push({ type: 'row', key: article.id, article });
      }
    };
    if (unread.length) {
      out.push({ type: 'section', key: 's-unread', label: 'to read', count: unread.length, collapsible: false, open: true });
      push(unread, 'u');
    }
    if (read.length) {
      out.push({ type: 'section', key: 's-read', label: 'finished', count: read.length, collapsible: true, open: readOpen });
      if (readOpen) push(read, 'r');
    }
    return out;
  }, [unread, read, readOpen, mode]);

  const onArrived = useCallback((id: string) => consumeArrival(id), [consumeArrival]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      switch (item.type) {
        case 'section':
          return (
            <Pressable
              disabled={!item.collapsible}
              style={styles.section}
              accessibilityRole={item.collapsible ? 'button' : 'header'}
              accessibilityState={item.collapsible ? { expanded: item.open } : undefined}
              onPress={() => {
                haptic('selection');
                setReadOpen((o) => !o);
              }}
            >
              <T variant="italicDek">{item.label}</T>
              <View style={styles.sectionRight}>
                <T variant="monoXs" color={colors.textMuted}>
                  {String(item.count).padStart(2, '0')}
                </T>
                {item.collapsible && (
                  <T variant="monoXs" color={colors.ink}>
                    {item.open ? 'hide' : 'show'}
                  </T>
                )}
              </View>
            </Pressable>
          );
        case 'shelf':
          return <ShelfRow books={item.books} bookWidth={bookWidth} arrivals={arrivals} onArrived={onArrived} />;
        case 'row':
          return (
            <SwipeableRow onDelete={() => removeArticle(item.article.id)}>
              <ArticleRow article={item.article} isNew={arrivals.has(item.article.id)} now={now} onArrived={onArrived} />
            </SwipeableRow>
          );
      }
    },
    [arrivals, bookWidth, now, onArrived],
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
        <View>
          <T variant="italicDisplay">readr</T>
          <T variant="monoXs" color={colors.textMuted}>
            {articles.length} saved · {unread.length} to read
          </T>
        </View>
        <View style={styles.toggle}>
          <PillToggle<ViewMode>
            value={mode}
            onChange={(m) => {
              setMode(m);
              repo().setSetting(VIEW_KEY, m);
            }}
            options={[
              { key: 'shelf', label: 'shelf view', render: (s) => <ShelfIcon color={s ? colors.white : colors.ink} /> },
              { key: 'list', label: 'list view', render: (s) => <ListIcon color={s ? colors.white : colors.ink} /> },
            ]}
          />
        </View>
      </View>
      {offline && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.offline}>
          <DateChip label="offline" />
          <T variant="monoXs" color={colors.textMuted}>
            no signal. everything here still works.
          </T>
        </Animated.View>
      )}
      <FlightStatus status={status} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.type}
        ListHeaderComponent={header}
        extraData={mode}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.x12 }}
      />
    </View>
  );
}

function ShelfIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Rect x={3} y={3} width={5} height={11} rx={1} stroke={color} strokeWidth={1.5} fill="none" transform="rotate(-4 5.5 8.5)" />
      <Rect x={11} y={3} width={5} height={11} rx={1} stroke={color} strokeWidth={1.5} fill="none" transform="rotate(4 13.5 8.5)" />
      <Path d="M2 17 H18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ListIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M3 5 H17 M3 10 H17 M3 15 H17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  center: { justifyContent: 'center' },
  header: { paddingHorizontal: inset.list, paddingBottom: space.x2, gap: space.x4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { width: 112 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: inset.list,
    paddingTop: space.x6,
    minHeight: 44,
  },
  sectionRight: { flexDirection: 'row', gap: space.x3 },
});
