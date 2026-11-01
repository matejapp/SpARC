import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { CalendarIcon, ChevronIcon } from '@/components/icons';
import { dateLabel, fromIsoDate, MIN_ENTRY_DATE, toIsoDate } from '@/lib/dates';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';
import type { IsoDate } from '@/types/api';

// The board's Date row (56 high, calendar icon, caption above the value, chevron). Tapping it
// opens the platform's own date picker, which is native code that Expo Go already contains:
//   iOS     — a calendar drawn inline under the row; tap the row again to fold it away.
//   Android — the system date dialog. Mounting the component opens it; any answer closes it.
// By default it offers 2000-01-01 up to today, a transaction's range: an entry is something
// that already happened. A bill passes its own range, which runs into the future.
export function DateField({
  value,
  onChange,
  error,
  caption = 'Date',
  minimumDate = MIN_ENTRY_DATE,
  maximumDate,
}: {
  value: IsoDate;
  onChange: (value: IsoDate) => void;
  error?: string;
  caption?: string;
  minimumDate?: Date;
  /** Defaults to today. */
  maximumDate?: Date;
}) {
  const styles = useStyles();
  const { colors, scheme, shadows } = useTheme();
  const [open, setOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setOpen(false); // the dialog has already closed itself
    if (event.type === 'set' && date) onChange(toIsoDate(date));
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${caption}, ${dateLabel(value)}`}
        accessibilityHint="Opens the calendar"
        accessibilityState={{ expanded: Platform.OS === 'ios' ? open : undefined }}
        style={[styles.row, error ? { boxShadow: shadows.fieldError } : null]}
      >
        <CalendarIcon color={colors.ink2} />
        <View style={styles.text}>
          <Text style={styles.caption}>{caption}</Text>
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
            minimumDate={minimumDate}
            maximumDate={maximumDate ?? new Date()}
            onChange={handleChange}
            accentColor={colors.accentText}
            themeVariant={scheme}
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 6 },
  row: {
    height: 56,
    borderRadius: radii.field,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1 },
  caption: { ...type.fieldCaption, color: t.colors.ink2 },
  value: { ...type.fieldValue, color: t.colors.ink },
  inline: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.field,
    boxShadow: t.shadows.outline,
    paddingHorizontal: 8,
  },
  error: { ...type.errorText, color: t.colors.error },
}));
