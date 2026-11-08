import { Pressable, Text, View } from 'react-native';

import { BackIcon, ChevronIcon } from '@/components/icons';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { Period, PeriodKind } from '@/lib/periods';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

const KINDS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
] as const satisfies readonly { value: PeriodKind; label: string }[];

/** Week · Month · Quarter · Year, then ‹ title › to step through them (board → Analytics tab). */
export function PeriodPicker({
  period,
  onKind,
  onStep,
}: {
  period: Period;
  onKind: (kind: PeriodKind) => void;
  onStep: (by: -1 | 1) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <SegmentedControl label="Period length" options={KINDS} value={period.kind} onChange={onKind} />
      <View style={styles.row}>
        <Pressable
          onPress={() => onStep(-1)}
          disabled={!period.canGoBack}
          accessibilityRole="button"
          accessibilityLabel="Earlier period"
          accessibilityState={{ disabled: !period.canGoBack }}
          style={({ pressed }) => [styles.arrow, !period.canGoBack && styles.off, pressed && styles.pressed]}
        >
          <BackIcon color={colors.ink} size={18} />
        </Pressable>
        <Text style={styles.title} accessibilityLiveRegion="polite">
          {period.title}
        </Text>
        <Pressable
          onPress={() => onStep(1)}
          disabled={period.isCurrent}
          accessibilityRole="button"
          accessibilityLabel="Later period"
          accessibilityState={{ disabled: period.isCurrent }}
          style={({ pressed }) => [styles.arrow, period.isCurrent && styles.off, pressed && styles.pressed]}
        >
          <ChevronIcon color={colors.ink} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  title: { ...type.headline, fontSize: 16, color: t.colors.ink, flex: 1, textAlign: 'center' },
}));
