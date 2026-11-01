import { Pressable, Text, View } from 'react-native';

import { ChevronIcon } from '@/components/icons';
import type { OccurrenceState } from '@/components/OccurrenceRow';
import { dateLabel, type Month, monthGrid, monthSpan, WEEKDAYS } from '@/lib/dates';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';
import type { IsoDate } from '@/types/api';

/** The state that marks a day: overdue outranks upcoming, which outranks paid. */
export type DayMarks = Record<IsoDate, OccurrenceState>;

// The calendar's month (F-05.4), drawn from plain Views: seven columns, a row per week, Monday
// first. A day with bills carries a dot in its state's colour, and its label says the state too.
// No calendar library: the grid is a few lines of date arithmetic in lib/dates.ts.
export function MonthGrid({
  month,
  marks,
  selected,
  today,
  onSelect,
  onShift,
}: {
  month: Month;
  marks: DayMarks;
  selected: IsoDate | null;
  today: IsoDate;
  onSelect: (day: IsoDate) => void;
  onShift: (by: number) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const dot: Record<OccurrenceState, string> = {
    overdue: colors.error,
    upcoming: colors.primary,
    paid: colors.income,
  };
  const { title } = monthSpan(month);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable
          onPress={() => onShift(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={styles.arrow}
        >
          <View style={styles.flip}>
            <ChevronIcon color={colors.ink} size={18} />
          </View>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Pressable onPress={() => onShift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow}>
          <ChevronIcon color={colors.ink} size={18} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {monthGrid(month).map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((day, i) => {
            if (!day) return <View key={`pad-${i}`} style={styles.cell} />;
            const mark = marks[day];
            const isSelected = day === selected;
            const isToday = day === today;
            return (
              <Pressable
                key={day}
                onPress={() => onSelect(day)}
                accessibilityRole="button"
                accessibilityLabel={`${dateLabel(day, today)}${mark ? `, bills ${mark}` : ''}`}
                accessibilityState={{ selected: isSelected }}
                style={styles.cell}
              >
                <View style={[styles.day, isToday && styles.today, isSelected && styles.selected]}>
                  <Text style={[styles.dayText, isSelected && styles.selectedText]}>{Number(day.slice(8))}</Text>
                </View>
                <View
                  style={[styles.dot, mark ? { backgroundColor: dot[mark] } : null]}
                  accessible={false}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.card,
    boxShadow: t.shadows.card,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  flip: { transform: [{ scaleX: -1 }] },
  title: { ...type.headline, color: t.colors.ink },
  week: { flexDirection: 'row' },
  weekday: { ...type.fieldCaption, flex: 1, textAlign: 'center', color: t.colors.ink2, paddingVertical: 6 },
  cell: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', gap: 3 },
  day: { width: 34, height: 34, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  today: { boxShadow: t.shadows.fieldFocus },
  selected: { backgroundColor: t.colors.primary, boxShadow: 'none' },
  dayText: { ...type.fieldValue, color: t.colors.ink },
  selectedText: { color: t.colors.onPrimary },
  dot: { width: 5, height: 5, borderRadius: 3 },
}));
