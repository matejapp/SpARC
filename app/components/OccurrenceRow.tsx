import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { formatMoney } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { IsoDate, OccurrenceResponse } from '@/types/api';

export type OccurrenceState = 'paid' | 'overdue' | 'upcoming';

/** Overdue is decided here, against the phone's today: the API only knows pending and paid. */
export function occurrenceState(o: Pick<OccurrenceResponse, 'status' | 'dueDate'>, today: IsoDate): OccurrenceState {
  if (o.status === 'paid') return 'paid';
  return o.dueDate < today ? 'overdue' : 'upcoming'; // ISO dates compare as text
}

const LABELS: Record<OccurrenceState, string> = { paid: 'Paid', overdue: 'Overdue', upcoming: 'Upcoming' };

/** The state in words on a tinted pill, so it never rests on colour alone. */
export function StatePill({ state }: { state: OccurrenceState }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tone = {
    paid: { tint: colors.incomeTint, ink: colors.income },
    overdue: { tint: colors.errorTint, ink: colors.error },
    upcoming: { tint: colors.tile, ink: colors.ink2 },
  }[state];
  return (
    <View style={[styles.pill, { backgroundColor: tone.tint }]}>
      <Text style={[styles.pillText, { color: tone.ink }]}>{LABELS[state]}</Text>
    </View>
  );
}

// One month of a bill in a card: category tile, a title and caption the caller words (the bill
// name in the calendar, the date on the bill's own screen), the month's amount in ink — a bill is
// an expense, never orange — and its state. `action` replaces the state pill (Mark paid).
export function OccurrenceRow({
  occurrence,
  title,
  caption,
  state,
  divider,
  onPress,
  hint,
  action,
}: {
  occurrence: OccurrenceResponse;
  title: string;
  caption: string;
  state: OccurrenceState;
  divider: boolean;
  onPress?: () => void;
  hint?: string;
  action?: ReactNode;
}) {
  const styles = useStyles();
  const { categoryTone } = useTheme();
  const tone = categoryTone(occurrence.categoryName, 'expense');
  const amount = formatMoney(occurrence.amount, occurrence.currency);

  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${title}, ${caption}, ${amount}, ${LABELS[state].toLowerCase()}`}
        accessibilityHint={hint}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={[styles.tile, { backgroundColor: tone.tint }]}>
          <CategoryIcon name={occurrence.categoryName} color={tone.ink} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.caption, state === 'overdue' && styles.captionOverdue]} numberOfLines={1}>
            {caption}
          </Text>
        </View>
        <View style={styles.end}>
          <Text style={styles.amount}>{amount}</Text>
          {action ? null : <StatePill state={state} />}
        </View>
      </Pressable>
      {action}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { paddingVertical: 12, gap: 8 },
  divider: { boxShadow: t.shadows.divider },
  main: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.6 },
  tile: { width: 44, height: 44, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.rowTitle, color: t.colors.ink },
  caption: { ...type.caption, color: t.colors.ink2 },
  captionOverdue: { color: t.colors.error },
  end: { alignItems: 'flex-end', gap: 4 },
  amount: { ...type.rowAmount, ...tabularNums, color: t.colors.ink },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  pillText: { ...type.tabLabel },
}));
