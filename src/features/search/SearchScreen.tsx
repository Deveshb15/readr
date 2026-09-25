import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { siteLabel } from '../../data/article';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import type { SearchHit } from '../../data/search';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleNamed, doodles } from '../../design/doodles/registry';
import { haptic } from '../../design/haptics';
import { colors, fonts, inset, radius, space } from '../../design/tokens';
import { T } from '../../design/typography';
import { BookCover } from '../library/BookCover';
import { Highlighted } from './Highlighted';

const RECENTS_KEY = 'recent_searches';
const MAX_RECENTS = 6;

function loadRecents(): string[] {
  try {
    const v = JSON.parse(repo().getSetting(RECENTS_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const next = [q, ...loadRecents().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENTS);
  repo().setSetting(RECENTS_KEY, JSON.stringify(next));
}

/** Global search: titles, sites and the full text of every saved article (FTS5). */
export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recents, setRecents] = useState(loadRecents);
  const articles = useLibraryStore((s) => s.articles);
  const byId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 90);
    return () => clearTimeout(t);
  }, [query]);

  const hits = useMemo<SearchHit[]>(
    () => (debounced ? repo().search(debounced).filter((h) => byId.has(h.id)) : []),
    [debounced, byId],
  );

  const open = (id: string) => {
    haptic('press');
    if (debounced) {
      saveRecent(debounced);
      setRecents(loadRecents());
    }
    Keyboard.dismiss();
    router.push({ pathname: '/article/[id]', params: { id, q: debounced } });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.x2 }]}>
      <View style={styles.bar}>
        <View style={styles.field}>
          <SearchGlyph />
          <TextInput
            ref={input}
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="search titles and words inside"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            accessibilityLabel="search your library"
          />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <T variant="monoSm" color={colors.ink}>
            cancel
          </T>
        </Pressable>
      </View>

      {!debounced ? (
        <View style={styles.idle}>
          {recents.length > 0 ? (
            <>
              <T variant="monoXs" color={colors.textMuted}>
                recent
              </T>
              <View style={styles.recents}>
                {recents.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => {
                      haptic('selection');
                      setQuery(r);
                    }}
                    style={styles.recent}
                    accessibilityRole="button"
                  >
                    <T variant="monoSm" color={colors.ink}>
                      {r}
                    </T>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <Animated.View entering={FadeIn} style={styles.hint}>
              <Doodle doodle={doodleNamed('glasses') ?? doodles[0]} size={44} drawOn />
              <T variant="italicDek" style={styles.center}>
                search everything you&apos;ve saved
              </T>
              <T variant="monoSm" color={colors.textMuted} style={styles.center}>
                titles, sites, and every word inside your articles — even offline.
              </T>
            </Animated.View>
          )}
        </View>
      ) : hits.length === 0 ? (
        <View style={styles.hint}>
          <T variant="italicDek" style={styles.center}>
            nothing matches “{debounced}”
          </T>
          <T variant="monoSm" color={colors.textMuted} style={styles.center}>
            try fewer or different words.
          </T>
        </View>
      ) : (
        <FlashList
          data={hits}
          keyExtractor={(h) => h.id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + space.x8 }}
          ListHeaderComponent={
            <T variant="monoXs" color={colors.textMuted} style={styles.count}>
              {hits.length} {hits.length === 1 ? 'article' : 'articles'}
            </T>
          }
          renderItem={({ item }) => {
            const a = byId.get(item.id);
            if (!a) return null;
            return (
              <Pressable
                onPress={() => open(item.id)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={a.title}
              >
                <BookCover article={a} width={40} />
                <View style={styles.rowText}>
                  <Highlighted text={item.title || a.title} variant="rowTitle" numberOfLines={2} />
                  {item.snippet ? (
                    <Highlighted text={item.snippet} variant="monoXs" color={colors.textMuted} numberOfLines={3} style={styles.snippet} />
                  ) : null}
                  <T variant="monoXs" color={colors.textFaint}>
                    {[siteLabel(a), a.minutes ? `${a.minutes} min` : null].filter(Boolean).join(' · ')}
                  </T>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function SearchGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={6.5} stroke={colors.textMuted} strokeWidth={2} fill="none" />
      <Path d="M16 16 L20 20" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export { SearchGlyph };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingHorizontal: inset.list, paddingBottom: space.x3 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.row - 2,
    paddingHorizontal: space.x3,
    height: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  input: { flex: 1, fontFamily: fonts.mono, fontSize: 15, color: colors.text, height: '100%' },
  idle: { paddingHorizontal: inset.list, paddingTop: space.x4, gap: space.x3 },
  recents: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  recent: { backgroundColor: colors.inkWash, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  hint: { alignItems: 'center', gap: space.x3, paddingHorizontal: inset.onboarding, paddingTop: space.x16 },
  center: { textAlign: 'center' },
  count: { paddingHorizontal: inset.list, paddingVertical: space.x2 },
  row: { flexDirection: 'row', gap: space.x4, paddingHorizontal: inset.list, paddingVertical: space.x4, alignItems: 'flex-start' },
  pressed: { backgroundColor: colors.canvasDeep },
  rowText: { flex: 1, gap: 6 },
  snippet: { lineHeight: 17 },
});
