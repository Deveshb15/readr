import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { offlineState, type Article, type OfflineState } from '../../data/article';
import { useLibraryStore } from '../../data/libraryStore';
import { haptic } from '../../design/haptics';
import { useMotionMode } from '../../design/motion';
import { colors, inset, radius, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { useToast } from '../../design/components/Toast';
import { downloadForOffline, downloadResultCopy, removeFromOffline } from '../../sync';
import { useIsOffline } from '../../sync/connectivity';
import { formatBytes } from '../../sync/offline';
import { retryNow } from '../../sync/retry';
import { BookCover } from '../library/BookCover';
import { OfflineBadge } from './OfflineBadge';

type Group = { key: OfflineState; title: string; items: Article[] };

/** What's on this phone, what isn't, and controls to remove or re-download. */
export function OfflineScreen() {
  const insets = useSafeAreaInsets();
  const offline = useIsOffline();
  const mode = useMotionMode();
  const articles = useLibraryStore((s) => s.articles);
  const [busy, setBusy] = useState<string | null>(null);

  const { groups, total, offlineCount, finishedBytes, finishedIds } = useMemo(() => {
    const by: Record<OfflineState, Article[]> = { downloading: [], 'needs-internet': [], offline: [], removed: [] };
    let total = 0;
    let finishedBytes = 0;
    const finishedIds: string[] = [];
    for (const a of articles) {
      by[offlineState(a)].push(a);
      if (a.keepOffline) total += a.sizeBytes;
      if (a.readAt !== null && offlineState(a) === 'offline') {
        finishedBytes += a.sizeBytes;
        finishedIds.push(a.id);
      }
    }
    const groups: Group[] = [
      { key: 'downloading' as const, title: 'downloading', items: by.downloading },
      { key: 'needs-internet' as const, title: 'waiting for internet', items: by['needs-internet'] },
      { key: 'offline' as const, title: 'on this phone', items: by.offline },
      { key: 'removed' as const, title: 'removed from offline', items: by.removed },
    ].filter((g) => g.items.length > 0);
    return { groups, total, offlineCount: by.offline.length, finishedBytes, finishedIds };
  }, [articles]);

  const act = async (a: Article) => {
    const state = offlineState(a);
    if (state === 'offline') {
      Alert.alert('Remove from offline?', `“${a.title}” stays in your library. Its text and images are removed from this phone.`, [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'remove',
          style: 'destructive',
          onPress: () => {
            haptic('warning');
            removeFromOffline(a.id);
          },
        },
      ]);
      return;
    }
    if (offline) {
      useToast.getState().show('connect to the internet to download');
      return;
    }
    haptic('press');
    setBusy(a.id);
    try {
      if (state === 'removed') {
        useToast.getState().show(downloadResultCopy(await downloadForOffline(a.id)));
      } else {
        await retryNow(a.id);
      }
    } finally {
      setBusy(null);
    }
  };

  const freeFinished = () => {
    Alert.alert(
      'Free up space?',
      `Removes the offline copy of ${finishedIds.length} finished ${finishedIds.length === 1 ? 'article' : 'articles'} (${formatBytes(finishedBytes)}). They stay in your library.`,
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'free up space',
          style: 'destructive',
          onPress: () => {
            haptic('warning');
            finishedIds.forEach(removeFromOffline);
          },
        },
      ],
    );
  };

  const pending = articles.filter((a) => ['downloading', 'needs-internet'].includes(offlineState(a))).length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.x2, paddingBottom: insets.bottom + space.x12 }}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="back">
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M15 5 L8 12 L15 19" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Pressable>
        </View>

        <View style={styles.header}>
          <T variant="italicDisplay">saved offline</T>
          <T variant="monoSm" color={colors.textMuted}>
            {offlineCount} of {articles.length} readable without internet · {formatBytes(total)} on this phone
          </T>
          <View style={[styles.summary, pending === 0 ? styles.summaryOk : styles.summaryWait]}>
            <OfflineBadge state={pending === 0 ? 'offline' : 'downloading'} size={18} />
            <T variant="monoSm" color={pending === 0 ? colors.ink : colors.text}>
              {pending === 0
                ? offlineCount === articles.length
                  ? 'everything is ready for your flight'
                  : 'everything you kept is ready offline'
                : offline
                  ? `${pending} will finish when you're back online`
                  : `${pending} still downloading`}
            </T>
          </View>
        </View>

        {groups.map((g) => (
          <Animated.View key={g.key} layout={mode === 'full' ? LinearTransition : undefined} style={styles.group}>
            <T variant="monoXs" color={colors.textMuted} style={styles.groupTitle}>
              {g.title} · {String(g.items.length).padStart(2, '0')}
            </T>
            <View style={styles.card}>
              {g.items.map((a, i) => (
                <Animated.View key={a.id} entering={FadeIn} style={[styles.row, i > 0 && styles.divider]}>
                  <Pressable
                    style={styles.rowMain}
                    onPress={() => router.push({ pathname: '/article/[id]', params: { id: a.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={a.title}
                  >
                    <BookCover article={a} width={34} />
                    <View style={styles.rowText}>
                      <T variant="rowTitle" numberOfLines={2} style={styles.rowTitle}>
                        {a.title}
                      </T>
                      <T variant="monoXs" color={colors.textMuted}>
                        {rowMeta(a)}
                      </T>
                    </View>
                  </Pressable>
                  {busy === a.id ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Pressable onPress={() => act(a)} hitSlop={8} style={styles.action} accessibilityRole="button">
                      <T variant="monoXs" color={offlineState(a) === 'offline' ? colors.textMuted : colors.ink}>
                        {actionLabel(offlineState(a))}
                      </T>
                    </Pressable>
                  )}
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ))}

        {finishedIds.length > 0 && (
          <Pressable onPress={freeFinished} style={styles.free} accessibilityRole="button">
            <T variant="monoSm" color={colors.ink}>
              free up {formatBytes(finishedBytes)} from finished articles
            </T>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function rowMeta(a: Article): string {
  const s = offlineState(a);
  const size = a.sizeBytes > 0 ? formatBytes(a.sizeBytes) : null;
  if (s === 'offline') return [size, 'offline'].filter(Boolean).join(' · ');
  if (s === 'downloading') return `images ${a.imagesDone}/${a.imagesTotal}`;
  if (s === 'needs-internet') return 'not downloaded yet';
  return 'not on this phone · opens online';
}

function actionLabel(s: OfflineState): string {
  switch (s) {
    case 'offline':
      return 'remove';
    case 'removed':
      return 'download';
    default:
      return 'retry';
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  top: { paddingHorizontal: inset.list - 4 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: inset.list, gap: space.x2, paddingBottom: space.x4 },
  summary: {
    marginTop: space.x2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryOk: { backgroundColor: colors.inkWash },
  summaryWait: { backgroundColor: colors.surfaceSolid },
  group: { paddingHorizontal: inset.list, marginTop: space.x4, gap: space.x2 },
  groupTitle: { paddingLeft: 4 },
  card: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.row + 2,
    paddingHorizontal: space.x4,
    boxShadow: '0 8px 24px -16px rgba(20,10,80,0.25)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingVertical: space.x3 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.08)' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, lineHeight: 19 },
  action: { minWidth: 60, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  free: { marginTop: space.x8, alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 18 },
});
