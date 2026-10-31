import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/lib/theme';

// The three concentric rings in the corner of a month card (board → Dashboard, Login).
// Decorative; the card clips them.
export function CardRings({ size = 220, opacity = 0.16 }: { size?: number; opacity?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      accessible={false}
      style={[styles.corner, { right: -size * 0.3, top: -size * 0.35 }]}
    >
      {[58, 82, 106].map((r) => (
        <Circle
          key={r}
          cx={110}
          cy={110}
          r={r}
          fill="none"
          stroke={colors.onAccent}
          strokeOpacity={opacity}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute' },
});
