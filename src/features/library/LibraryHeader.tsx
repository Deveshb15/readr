import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { offlineState, type Article } from '../../data/article';
import { DateChip } from '../../design/components/DateChip';
import { haptic } from '../../design/haptics';
import { colors, fonts, radius, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { OfflineBadge } from '../offline/OfflineBadge';
import { SearchGlyph } from '../search/SearchScreen';
import { formatBytes } from '../../sync/offline';
import { BookCover } from './BookCover';

/** Search field (opens the search screen) — a button that looks like a field. */
export function SearchField() {
  return (
    <Pressable
      onPress={() => {
        haptic('press');
        router.push('/search');
      }}
      style={({ pressed }) => [styles.search, pressed && { opacity: 0.8 }]}
      accessibilityRole="search"
      accessibilityLabel="search your library"
    >
      <SearchGlyph />
      <T variant="monoMd" color={colors.textFaint} style={{ fontFamily: fonts.mono }}>
        search titles and words inside
      </T>
    </Pressable>
  );
}

/** "All 5 saved offline · 12 MB ›" — always visible, opens Saved offline. */
export const OfflineChip = memo(function OfflineChip({ articles, offline }: { articles: Article[]; offline: boolean }) {
  const states = articles.map(offlineState);
  const ready = states.filter((s) => s === 'offline').length;
  const pending = states.filter((s) => s === 'downloading' || s === 'needs-internet').length;
  const bytes = articles.reduce((n, a) => n + (a.keepOffline ? a.sizeBytes : 0), 0);
  const allSet = pending === 0;
  const copy = allSet
    ? `${ready === articles.length ? 'all ' : ''}${ready} saved offline · ${formatBytes(bytes)}`
    : offline
      ? `${pending} waiting for internet · ${ready} ready offline`
      : `${pending} downloading · ${ready} ready offline`;
  return (
    <Pressable
      onPress={() => {
        haptic('press');
        router.push('/offline');
      }}
      style={({ pressed }) => [styles.chip, allSet ? styles.chipOk : styles.chipWait, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={`${copy}. manage offline articles`}
    >
      <OfflineBadge state={allSet ? 'offline' : offline ? 'needs-internet' : 'downloading'} size={18} />
      <T variant="monoSm" color={allSet ? colors.ink : colors.text}>
        {copy}
      </T>
      <Chevron />
    </Pressable>
  );
});

export function OfflineNotice() {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.notice}>
      <DateChip label="offline" />
      <T variant="monoXs" color={colors.textMuted}>
        no signal. everything here still works.
      </T>
    </Animated.View>
  );
}

/** Picks up where you left off: the last article you opened, if it's in progress. */
export const ContinueCard = memo(function ContinueCard({ article }: { article: Article }) {
  const left = Math.max(1, Math.round(article.minutes * (1 - article.progress)));
  return (
    <Pressable
      onPress={() => {
        haptic('press');
        router.push({ pathname: '/article/[id]', params: { id: article.id } });
      }}
      style={({ pressed }) => [styles.continue, pressed && { transform: [{ scale: 0.99 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`continue reading ${article.title}, ${left} minutes left`}
    >
      <BookCover article={article} width={46} />
      <View style={styles.continueText}>
        <T variant="monoXs" color={colors.ink}>
          continue reading
        </T>
        <T variant="rowTitle" numberOfLines={2} style={styles.continueTitle}>
          {article.title}
        </T>
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(article.progress * 100)}%` }]} />
          </View>
          <T variant="monoXs" color={colors.textMuted}>
            {left} min left
          </T>
        </View>
      </View>
    </Pressable>
  );
});

function Chevron() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path d="M9 5 L16 12 L9 19" stroke={colors.textMuted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    height: 46,
    borderRadius: radius.row - 2,
    paddingHorizontal: space.x3,
    backgroundColor: colors.surfaceSolid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 12,
  },
  chipOk: { backgroundColor: colors.inkWash },
  chipWait: { backgroundColor: colors.surfaceSolid },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  continue: {
    flexDirection: 'row',
    gap: space.x4,
    alignItems: 'center',
    padding: space.x4,
    borderRadius: radius.row + 4,
    backgroundColor: colors.surfaceSolid,
    boxShadow: '0 10px 28px -18px rgba(20,10,80,0.35)',
  },
  continueText: { flex: 1, gap: 6 },
  continueTitle: { fontSize: 16, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.inkWash, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.ink },
});
