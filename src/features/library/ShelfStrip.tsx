import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { DateChip } from '../../design/components/DateChip';
import { Doodle } from '../../design/doodles/Doodle';
import { doodleAt } from '../../design/doodles/registry';
import { colors, space } from '../../design/tokens';
import type { ShelfDot } from './selectors';

/** one year's dot-grid year, as a single row: one dot per save this month; read ones become their doodle. */
export const ShelfStrip = memo(function ShelfStrip({ dots, month }: { dots: ShelfDot[]; month: string }) {
  const count = String(dots.length).padStart(2, '0');
  return (
    <View style={styles.wrap} accessibilityLabel={`${month}: ${dots.length} saved, ${dots.filter((d) => d.read).length} read`}>
      <DateChip label={`${month} · ${count} saved`} />
      <View style={styles.row}>
        {dots.map((d) =>
          d.read ? (
            <Doodle key={d.id} doodle={doodleAt(d.doodle)} size={18} strokeWidth={1.4} />
          ) : (
            <View key={d.id} style={styles.dotCell}>
              <View style={styles.dot} />
            </View>
          ),
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: space.x3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  dotCell: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.ink },
});
