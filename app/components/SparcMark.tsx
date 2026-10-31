import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, gradients } from '@/lib/theme';

// The arc-and-spark mark (D-027), drawn from assets/brand/sparc-mark.svg.
export function SparcMark({ size = 40 }: { size?: number }) {
  const [from, mid, to] = gradients.mark;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="SpARC">
      <Defs>
        <LinearGradient id="sparc-arc" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="0.5" stopColor={mid} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Path
        d="M50 20A30 30 0 1 1 20 50"
        fill="none"
        stroke="url(#sparc-arc)"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Circle cx={28.8} cy={28.8} r={7} fill={colors.ink} />
    </Svg>
  );
}
