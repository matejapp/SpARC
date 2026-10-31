import Svg, { Path } from 'react-native-svg';

// Line icons from the design board, 24 × 24 viewBox. Decorative: the control that
// holds one carries the accessible label.

type IconProps = { color: string; size?: number };

// Tab icons: filled or heavier when their tab is the current one.
type TabIconProps = IconProps & { active: boolean };

export function HomeIcon({ color, size = 22, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"
        fill={active ? color : 'none'}
        stroke={active ? 'none' : color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ActivityIcon({ color, size = 22, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 7h16M4 12h16M4 17h10"
        fill="none"
        stroke={color}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlusIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M12 5v14M5 12h14" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M6 6l12 12M18 6L6 18" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function BackIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EyeIcon({ color, size = 20, crossed }: IconProps & { crossed: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="none" stroke={color} strokeWidth={1.8} />
      {crossed ? <Path d="M4 4l16 16" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" /> : null}
    </Svg>
  );
}
