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

// Three bars on a baseline (board → Analytics tab).
export function AnalyticsIcon({ color, size = 22, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M5 20v-7M12 20V5M19 20v-10M3 20h18"
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

// Also the Calendar tab's icon, heavier when its tab is the current one.
export function CalendarIcon({ color, size = 20, active = false }: IconProps & { active?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM3 10h18M8 3v4M16 3v4" fill="none" stroke={color} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronIcon({ color, size = 16, down = false }: IconProps & { down?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d={down ? 'M6 9l6 6 6-6' : 'M9 6l6 6-6 6'} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MinusIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M5 12h14" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function WalletIcon({ color, size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M6 5h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM3 10h18M7 15h4" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
