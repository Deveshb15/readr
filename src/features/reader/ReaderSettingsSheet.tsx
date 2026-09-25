import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { offlineState } from '../../data/article';
import { repo } from '../../data/db';
import { useLibraryStore } from '../../data/libraryStore';
import { downloadForOffline, downloadResultCopy, removeFromOffline } from '../../sync';
import { formatBytes } from '../../sync/offline';
import { PillToggle } from '../../design/components/PillToggle';
import { PressableScale } from '../../design/components/PressableScale';
import { useToast } from '../../design/components/Toast';
import { colors, paperTones, radius, space, type PaperTone } from '../../design/tokens';
import { T } from '../../design/typography';
import { SIZE_STEPS, useReaderSettings, type ReaderFont, type ReaderWidth } from './settingsStore';

const label = (selected: boolean) => (selected ? colors.white : colors.ink);

/** Four controls, all light (Fable/Matter pattern, one year styling). */
export function ReaderSettingsSheet() {
  const settings = useReaderSettings((s) => s.settings);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const article = useLibraryStore((s) => (id ? s.articles.find((a) => a.id === id) ?? null : null));
  const update = (patch: Parameters<ReturnType<typeof useReaderSettings.getState>['update']>[1]) =>
    useReaderSettings.getState().update(repo(), patch);

  return (
    <View style={styles.sheet}>
      <Section title="paper">
        <View style={styles.tones}>
          {(Object.keys(paperTones) as PaperTone[]).map((tone) => {
            const selected = settings.tone === tone;
            return (
              <View key={tone} style={styles.toneCell}>
                <PressableScale
                  pressHaptic="selection"
                  onPress={() => update({ tone })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${tone} paper`}
                  style={[styles.tone, { backgroundColor: paperTones[tone].background }, selected && styles.toneSelected]}
                >
                  <T variant="rowTitle" color={paperTones[tone].text} style={styles.toneAa}>
                    Aa
                  </T>
                  <T variant="monoXs" color={paperTones[tone].muted}>
                    {tone}
                  </T>
                </PressableScale>
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="type">
        <PillToggle<ReaderFont>
          value={settings.font}
          onChange={(font) => update({ font })}
          options={[
            { key: 'serif', label: 'serif', render: (s) => <T variant="rowTitle" color={label(s)}>serif</T> },
            { key: 'sans', label: 'sans', render: (s) => <T variant="monoSm" color={label(s)} style={{ fontFamily: 'System' }}>sans</T> },
            { key: 'mono', label: 'mono', render: (s) => <T variant="monoSm" color={label(s)}>mono</T> },
          ]}
        />
      </Section>

      <Section title="size">
        <View style={styles.stepper}>
          <Step label="smaller" glyph="a" disabled={settings.size === 0} onPress={() => update({ size: settings.size - 1 })} />
          <T variant="monoSm" color={colors.textMuted}>
            {SIZE_STEPS[settings.size]}pt
          </T>
          <Step
            label="larger"
            glyph="A"
            disabled={settings.size === SIZE_STEPS.length - 1}
            onPress={() => update({ size: settings.size + 1 })}
          />
        </View>
      </Section>

      <Section title="width">
        <PillToggle<ReaderWidth>
          value={settings.width}
          onChange={(width) => update({ width })}
          options={[
            { key: 'narrow', label: 'narrow column', render: (s) => <T variant="monoSm" color={label(s)}>narrow</T> },
            { key: 'wide', label: 'wide column', render: (s) => <T variant="monoSm" color={label(s)}>wide</T> },
          ]}
        />
      </Section>

      {article && (
        <Section title="this article">
          <View style={styles.card}>
            {offlineState(article) !== 'removed' && (
              <Row
                label="download again"
                detail="get the latest text and images"
                onPress={() => {
                  const toast = useToast.getState().show;
                  toast('downloading…');
                  downloadForOffline(article.id)
                    .then((state) => toast(downloadResultCopy(state)))
                    .catch(() => toast("couldn't download"));
                  router.back();
                }}
              />
            )}
            <Row label="open original" detail={hostOf(article.url)} onPress={() => Linking.openURL(article.url).catch(() => {})} />
            {offlineState(article) === 'offline' && (
              <Row
                label="remove from offline"
                detail={article.sizeBytes ? `frees ${formatBytes(article.sizeBytes)}` : 'keeps it in your library'}
                muted
                onPress={() => {
                  removeFromOffline(article.id);
                  useToast.getState().show('removed from offline · still in your library');
                  router.dismissAll();
                }}
              />
            )}
          </View>
        </Section>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <T variant="monoXs" color={colors.textMuted}>
        {title}
      </T>
      {children}
    </View>
  );
}

function Row({ label, detail, muted, onPress }: { label: string; detail: string; muted?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={detail}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.inkWash }]}
    >
      <T variant="monoSm" color={muted ? colors.text : colors.ink}>
        {label}
      </T>
      <T variant="monoXs" color={colors.textMuted} numberOfLines={1} style={styles.rowDetail}>
        {detail}
      </T>
    </Pressable>
  );
}

function hostOf(url: string): string {
  const m = /^https?:\/\/(?:www\.)?([^/?#:]+)/i.exec(url);
  return m ? m[1] : url;
}

function Step({ label, glyph, disabled, onPress }: { label: string; glyph: string; disabled: boolean; onPress: () => void }) {
  return (
    <PressableScale
      pressHaptic="selection"
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.step, disabled && { opacity: 0.35 }]}
    >
      <T variant="rowTitle" color={colors.ink} style={{ fontSize: glyph === 'A' ? 22 : 15 }}>
        {glyph}
      </T>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.canvas, padding: space.x5, paddingTop: space.x8, gap: space.x5 },
  section: { gap: space.x2 },
  tones: { flexDirection: 'row', gap: space.x2 },
  toneCell: { flex: 1 },
  tone: {
    height: 72,
    borderRadius: radius.row,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  toneSelected: { borderColor: colors.ink, borderWidth: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inkWash,
    borderRadius: radius.button + 4,
    padding: 4,
  },
  step: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  toneAa: { fontSize: 20, lineHeight: 24 },
  card: { borderRadius: radius.row, backgroundColor: colors.surfaceSolid, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x3,
    minHeight: 48,
    paddingHorizontal: space.x4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowDetail: { flexShrink: 1, textAlign: 'right' },
});
