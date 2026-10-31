import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarIcon, ChevronIcon } from '@/components/icons';
import { dateLabel, fromIsoDate, MIN_ENTRY_DATE, toIsoDate } from '@/lib/dates';
import { colors, radii, shadows, type } from '@/lib/theme';
import type { IsoDate } from '@/types/api';

// The board's Date row (56 high, calendar icon, caption above the value, chevron). Tapping it
// opens the platform's own date picker, which is native code that Expo Go already contains:
//   iOS     — a calendar drawn inline under the row; tap the row again to fold it away.
//   Android — the system date dialog. Mounting the component opens it; any answer closes it.
// Dates after today are not offered: an entry is something that already happened.
export function DateField({
  value,
  onChange,
  error,
}: {
  value: IsoDate;
  onChange: (value: IsoDate) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setOpen(false); // the dialog has already closed itself
    if (event.type === 'set' && date) onChange(toIsoDate(date));
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`Date, ${dateLabel(value)}`}
        accessibilityHint="Opens the calendar"
        accessibilityState={{ expanded: Platform.OS === 'ios' ? open : undefined }}
        style={[styles.row, error ? { boxShadow: shadows.fieldError } : null]}
      >
        <CalendarIcon color={colors.ink2} />
        <View style={styles.text}>
          <Text style={styles.caption}>Date</Text>
          <Text style={styles.value}>{dateLabel(value)}</Text>
        </View>
        <ChevronIcon color={colors.ink2} down={Platform.OS === 'ios' && open} />
      </Pressable>

      {open ? (
        <View style={Platform.OS === 'ios' ? styles.inline : null}>
          <DateTimePicker
            value={fromIsoDate(value)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={MIN_ENTRY_DATE}
            maximumDate={today}
            onChange={handleChange}
            accentColor={colors.accentText}
            themeVariant="light"
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: {
    height: 56,
    borderRadius: radii.field,
    backgroundColor: colors.surface,
    boxShadow: shadows.outline,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1 },
  caption: { ...type.fieldCaption, color: colors.ink2 },
  value: { ...type.fieldValue, color: colors.ink },
  inline: {
    backgroundColor: colors.surface,
    borderRadius: radii.field,
    boxShadow: shadows.outline,
    paddingHorizontal: 8,
  },
  error: { ...type.errorText, color: colors.error },
});
