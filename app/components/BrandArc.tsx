import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { makeStyles, useTheme } from '@/lib/theme';

// The logo's arc, large and faint, bleeding off the top-right corner behind a screen's header
// (D-033). Decorative only: screen readers skip it and it takes no touches. Mount it as the
// first child of a screen's scroll content so it scrolls away with the header and the
// content draws over it.
export function BrandArc({ size = 340 }: { size?: number }) {
  const styles = useStyles();
  const { gradients, arcOpacity } = useTheme();
  const [from, mid, to] = gradients.mark;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.corner, { width: size, height: size, top: -size * 0.42, right: -size * 0.38 }]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="brand-arc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="0.5" stopColor={mid} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Path
          d="M50 20A30 30 0 1 1 20 50"
          fill="none"
          stroke="url(#brand-arc)"
          strokeOpacity={arcOpacity}
          strokeWidth={14}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  corner: { position: 'absolute' },
}));
