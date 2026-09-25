import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { OfflineState } from '../../data/article';
import { colors } from '../../design/tokens';

/**
 * Tiny status glyph used on covers, rows and the reader:
 * offline = ink check, downloading = ring with a down arrow, needs internet = cloud, removed = dashed cloud.
 */
export function OfflineBadge({ state, size = 16 }: { state: OfflineState; size?: number }) {
  return (
    <View
      accessibilityLabel={LABELS[state]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: state === 'offline' ? colors.ink : colors.surfaceSolid,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(20,10,80,0.25)',
      }}
    >
      <Svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24">
        {state === 'offline' && (
          <Path d="M6 12.5 L10.2 16.5 L18 8" stroke={colors.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
        {state === 'downloading' && (
          <>
            <Circle cx={12} cy={12} r={9} stroke={colors.inkFaint} strokeWidth={2.5} fill="none" />
            <Path d="M12 7 V16 M8 12.5 L12 16.5 L16 12.5" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
        {(state === 'needs-internet' || state === 'removed') && (
          <Path
            d="M7 18 C3.5 18 3 13.5 6 12.5 C6 8.5 11 7.5 12.5 10 C14 7.5 19.5 8 19 12.5 C21.5 13 21 18 17.5 18 Z"
            stroke={state === 'removed' ? colors.textMuted : colors.ink}
            strokeWidth={2.2}
            strokeDasharray={state === 'removed' ? '3 3' : undefined}
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

const LABELS: Record<OfflineState, string> = {
  offline: 'saved offline',
  downloading: 'downloading',
  'needs-internet': 'needs internet',
  removed: 'removed from offline',
};
