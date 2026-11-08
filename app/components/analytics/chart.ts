import { useWindowDimensions } from 'react-native';

import { spacing } from '@/lib/theme';
import { formatWhole } from '@/lib/money';

// Geometry shared by the Analytics charts. Scaling a value to a bar's height or a line's y is
// drawing, not money arithmetic: no total shown anywhere comes from here (D-031).

/** The card's padding; a chart fills the card's inner width. */
export const CARD_PADDING = 20;
/** Room for "140.000" on the y axis. */
export const Y_LABEL_WIDTH = 52;

/** Inner width of a full-width card on this screen. */
export function useCardInnerWidth(): number {
  const { width } = useWindowDimensions();
  return width - 2 * spacing.gutter - 2 * CARD_PADDING;
}

/**
 * A round top for a two-section axis, so both the middle and the top label are round:
 * 126.500 → 140.000 (70.000 in the middle). Never 0, so an all-zero chart still has an axis.
 */
export function niceMax(max: number): number {
  const half = max / 2;
  if (!(half > 0)) return 2;
  const exp = 10 ** Math.floor(Math.log10(half));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10].find((f) => f * exp >= half) ?? 10;
  return 2 * step * exp;
}

/** Bottom-to-top labels for a two-section axis. */
export function axisLabels(top: number): string[] {
  return [formatWhole(0), formatWhole(top / 2), formatWhole(top)];
}
