import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { CurrencyMenu } from '@/components/CurrencyMenu';
import { DateField } from '@/components/DateField';
import { FormScreen } from '@/components/FormScreen';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { useCategories } from '@/hooks/useTransactions';
import { billDueDateRange, dayOrdinal, fromIsoDate, todayIso } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { BillRequest, Currency, IsoDate } from '@/types/api';

export type BillDraft = {
  name: string;
  amountText: string;
  currency: Currency;
  categoryId: string | null;
  firstDueDate: IsoDate;
  monthly: boolean;
};

export const emptyBillDraft = (): BillDraft => ({
  name: '',
  amountText: '',
  currency: 'RSD',
  categoryId: null,
  firstDueDate: todayIso(),
  monthly: true,
});

const FORM_FIELDS = ['name', 'amount', 'categoryId', 'firstDueDate'] as const;
type Errors = Partial<Record<(typeof FORM_FIELDS)[number], string>>;

const REPEATS = [
  { value: 'monthly', label: 'Every month' },
  { value: 'once', label: 'Just once' },
] as const;

function repeatNote(draft: BillDraft): string {
  if (!draft.monthly) return "One payment on this date, then it's done.";
  const day = dayOrdinal(draft.firstDueDate);
  // The API moves a 29th–31st to the last day of a shorter month (D-034).
  return fromIsoDate(draft.firstDueDate).getDate() > 28
    ? `Repeats on the ${day} of every month, or the month's last day.`
    : `Repeats on the ${day} of every month.`;
}

// Add and edit share this form (board → Add bill, Edit bill). The screen supplies the header,
// and `note` goes under it (edit says which months a change reaches).
export function BillForm({
  initial,
  header,
  note,
  submitLabel,
  onSubmit,
  pending,
  error,
  topInset,
}: {
  initial: BillDraft;
  header: ReactNode;
  note?: string;
  submitLabel: string;
  onSubmit: (request: BillRequest) => void;
  pending: boolean;
  error: Error | null;
  topInset?: boolean;
}) {
  const styles = useStyles();
  const { categoryTone, colors, scheme } = useTheme();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [lastError, setLastError] = useState<Error | null>(null);
  const categories = useCategories('expense'); // a bill is always an expense
  const range = billDueDateRange();
  // An existing bill can keep a first due date that has passed; the API only refuses a new
  // past date. Let the picker show the kept one.
  const initialDate = fromIsoDate(initial.firstDueDate);
  const minimumDate = initialDate < range.min ? initialDate : range.min;

  // Server field errors land on their fields once per failed request (as in TransactionForm).
  if (error !== lastError) {
    setLastError(error);
    if (error instanceof ApiError) setErrors(error.fieldErrors);
  }

  const set = (patch: Partial<BillDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const clear = (field: keyof Errors) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  function submit() {
    const name = draft.name.trim();
    const amount = parseAmount(draft.amountText);
    const next: Errors = {};
    if (!amount.ok) next.amount = amount.error;
    if (!name) next.name = 'Enter a name.';
    if (!draft.categoryId) next.categoryId = 'Pick a category.';
    setErrors(next);
    if (!amount.ok || !name || !draft.categoryId) return;

    onSubmit({
      name,
      amount: amount.value,
      currency: draft.currency, // a month freezes the NBS rate only when it is paid (D-039)
      categoryId: draft.categoryId,
      firstDueDate: draft.firstDueDate,
      monthly: draft.monthly,
    });
  }

  // An error that names none of this form's fields (a missing category, the network) goes in the
  // banner instead.
  const onAField =
    error instanceof ApiError && FORM_FIELDS.some((field) => error.fieldErrors[field]);
  const banner = error && !onAField ? error.message : null;

  return (
    <FormScreen
      topInset={topInset}
      footer={<Button label={submitLabel} loading={pending} loadingLabel="Saving…" tall onPress={submit} />}
    >
      {header}
      {note ? <Text style={styles.note}>{note}</Text> : null}

      <View style={styles.amountBlock}>
        <Text style={styles.amountLabel}>Amount each time</Text>
        <View style={styles.amountRow}>
          <TextInput
            value={draft.amountText}
            onChangeText={(amountText) => {
              set({ amountText });
              clear('amount');
            }}
            onBlur={() => {
              const parsed = parseAmount(draft.amountText);
              if (draft.amountText && !parsed.ok) setErrors((e) => ({ ...e, amount: parsed.error }));
            }}
            placeholder="0,00"
            placeholderTextColor={colors.placeholder}
            keyboardAppearance={scheme}
            keyboardType="decimal-pad"
            accessibilityLabel={`Amount each time, in ${draft.currency}`}
            accessibilityHint={errors.amount}
            maxLength={20}
            style={styles.amountInput}
          />
          <CurrencyMenu value={draft.currency} onChange={(currency) => set({ currency })} />
        </View>
        {errors.amount ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errors.amount}
          </Text>
        ) : draft.currency !== 'RSD' ? (
          <Text style={styles.conversion}>Each payment converts at the NBS rate for the day it's paid.</Text>
        ) : null}
      </View>

      <View style={styles.name}>
        <TextField
          label="Name"
          value={draft.name}
          onChangeText={(name) => {
            set({ name });
            clear('name');
          }}
          error={errors.name}
          placeholder="Rent, internet, phone…"
          maxLength={100}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Category</Text>
        {categories.isPending ? (
          <View style={styles.chips} accessibilityLabel="Loading categories">
            {[88, 104, 76, 96, 84, 110].map((w) => (
              <View key={w} style={[styles.chipSkeleton, { width: w }]} />
            ))}
          </View>
        ) : categories.isError ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>Categories didn't load.</Text>
            <Button label="Try again" variant="link" onPress={() => categories.refetch()} />
          </View>
        ) : (
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Category">
            {categories.data.map((c) => {
              const selected = c.id === draft.categoryId;
              const tone = categoryTone(c.name, c.kind);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    set({ categoryId: c.id });
                    clear('categoryId');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[styles.chip, { backgroundColor: tone.tint }, selected && styles.chipSelected]}
                >
                  <View style={[styles.chipDot, { backgroundColor: selected ? colors.onPrimary : tone.ink }]} />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {errors.categoryId ? <Text style={styles.error}>{errors.categoryId}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Repeats</Text>
        <SegmentedControl
          label="Repeats"
          options={REPEATS}
          value={draft.monthly ? 'monthly' : 'once'}
          onChange={(v) => set({ monthly: v === 'monthly' })}
        />
      </View>

      <View style={styles.dateBlock}>
        <DateField
          caption={draft.monthly ? 'First due date' : 'Due date'}
          value={draft.firstDueDate}
          onChange={(firstDueDate) => {
            set({ firstDueDate });
            clear('firstDueDate');
          }}
          minimumDate={minimumDate}
          maximumDate={range.max}
          error={errors.firstDueDate}
        />
        <Text style={styles.repeatNote}>{repeatNote(draft)}</Text>
        {banner ? <ErrorBanner message={banner} /> : null}
      </View>
    </FormScreen>
  );
}

const useStyles = makeStyles((t) => ({
  note: {
    ...type.bannerText,
    color: t.colors.ink2,
    backgroundColor: t.colors.tile,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  amountBlock: { alignItems: 'center', marginTop: 20 },
  amountLabel: { ...type.label, color: t.colors.ink2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  amountInput: {
    ...type.amountInput,
    ...tabularNums,
    color: t.colors.ink, // a bill is an expense: ink, never orange
    width: 220,
    textAlign: 'right',
    padding: 0,
  },
  conversion: { ...type.caption, color: t.colors.ink2, marginTop: 8, textAlign: 'center' },
  name: { marginTop: 22 },
  section: { marginTop: 22, gap: 10 },
  sectionLabel: { ...type.label, color: t.colors.ink2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 44,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipSelected: { backgroundColor: t.colors.primary, boxShadow: 'none' },
  chipText: { ...type.chip, color: t.colors.ink },
  chipTextSelected: { color: t.colors.onPrimary },
  chipSkeleton: { height: 44, borderRadius: radii.pill, backgroundColor: t.colors.hairline },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineErrorText: { ...type.body, color: t.colors.ink },
  dateBlock: { marginTop: 12, gap: 6 },
  repeatNote: { ...type.caption, color: t.colors.ink2, paddingHorizontal: 4 },
  error: { ...type.errorText, color: t.colors.error, marginTop: 8 },
}));
