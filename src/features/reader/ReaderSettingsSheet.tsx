import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { repo } from '../../data/db';
import { PillToggle } from '../../design/components/PillToggle';
import { PressableScale } from '../../design/components/PressableScale';
import { colors, paperTones, radius, space, type PaperTone } from '../../design/tokens';
import { T } from '../../design/typography';
import { SIZE_STEPS, useReaderSettings, type ReaderFont, type ReaderWidth } from './settingsStore';

const label = (selected: boolean) => (selected ? colors.white : colors.ink);

/** Four controls, all light (Fable/Matter pattern, one year styling). */
export function ReaderSettingsSheet() {
  const settings = useReaderSettings((s) => s.settings);
  const update = (patch: Parameters<ReturnType<typeof useReaderSettings.getState>['update']>[1]) =>
    useReaderSettings.getState().update(repo(), patch);

  return (
    <View style={styles.sheet}>
      <Section title="paper">
        <View style={styles.tones}>
          {(Object.keys(paperTones) as PaperTone[]).map((tone) => {
            const selected = settings.tone === tone;
            return (
              <PressableScale
                key={tone}
                pressHaptic="selection"
                onPress={() => update({ tone })}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${tone} paper`}
                style={[styles.tone, { backgroundColor: paperTones[tone].background }, selected && styles.toneSelected]}
              >
                <T variant="rowTitle" color={paperTones[tone].text}>
                  Aa
                </T>
                <T variant="monoXs" color={paperTones[tone].muted}>
                  {tone}
                </T>
              </PressableScale>
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
  tone: {
    flex: 1,
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
});
