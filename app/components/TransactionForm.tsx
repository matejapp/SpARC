import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { DateField } from '@/components/DateField';
import { FormScreen } from '@/components/FormScreen';
import { CurrencyMenu } from '@/components/CurrencyMenu';
import { PencilIcon } from '@/components/icons';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCategories } from '@/hooks/useTransactions';
import { todayIso } from '@/lib/dates';
import { formatAmount, formatRate, parseAmount } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { Currency, IsoDate, TransactionRequest, TransactionType } from '@/types/api';

export type TransactionDraft = {
  type: TransactionType;
  amountText: string;
  currency: Currency;
  categoryId: string | null;
  occurredOn: IsoDate;
  description: string;
};

// A new entry starts in RSD, the pivot: the preferred currency is a display setting (D-004).
export const emptyDraft = (type: TransactionType = 'expense'): TransactionDraft => ({
  type,
  amountText: '',
  currency: 'RSD',
  categoryId: null,
  occurredOn: todayIso(),
  description: '',
});

/** What a saved transaction froze (D-038), so an edit can show it while its value is unchanged. */
export type FrozenRate = { amountRsd: number; rateToRsd: number };

const FORM_FIELDS = ['amount', 'categoryId', 'occurredOn', 'description'] as const;
type Errors = Partial<Record<(typeof FORM_FIELDS)[number], string>>;

const TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
] as const;

// Add and edit share this form (board → Add transaction; edit is derived from it). The screen
// supplies the header — it depends on the chosen type — and anything below the save button.
export function TransactionForm({
  initial,
  header,
  submitLabel,
  onSubmit,
  pending,
  error,
  topInset,
  after,
  frozen,
  belowAmount,
}: {
  initial: TransactionDraft;
  frozen?: FrozenRate;
  header: (type: TransactionType) => ReactNode;
  submitLabel: (type: TransactionType) => string;
  onSubmit: (request: TransactionRequest) => void;
  pending: boolean;
  error: Error | null;
  topInset?: boolean;
  after?: ReactNode;
  /** Under the amount, told whether amount, currency and date are still the saved ones. */
  belowAmount?: (unchanged: boolean) => ReactNode;
}) {
  const styles = useStyles();
  const { categoryTone, colors, scheme, shadows } = useTheme();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [lastError, setLastError] = useState<Error | null>(null);
  const categories = useCategories(draft.type);

  // Server field errors land on their fields once per failed request. Setting state while
  // rendering is React's sanctioned way to react to a changed prop without an extra pass.
  if (error !== lastError) {
    setLastError(error);
    if (error instanceof ApiError) setErrors(error.fieldErrors);
  }

  const set = (patch: Partial<TransactionDraft>) => setDraft((d) => ({ ...d, ...patch }));

  function changeType(next: TransactionType) {
    // Categories belong to one kind (the API refuses a mismatch), so the pick starts over.
    if (next !== draft.type) set({ type: next, categoryId: null });
    setErrors((e) => ({ ...e, categoryId: undefined }));
  }

  function submit() {
    const amount = parseAmount(draft.amountText);
    const next: Errors = {};
    if (!amount.ok) next.amount = amount.error;
    if (!draft.categoryId) next.categoryId = 'Pick a category.';
    setErrors(next);
    if (!amount.ok || !draft.categoryId) return;

    onSubmit({
      type: draft.type,
      amount: amount.value,
      currency: draft.currency, // never a rate: the API freezes the NBS rate itself (D-038)
      categoryId: draft.categoryId,
      occurredOn: draft.occurredOn,
      description: draft.description.trim() || null,
    });
  }

  // An error that names none of this form's fields (a 404 category, rates unavailable (503), the
  // network) goes in the banner instead.
  const onAField =
    error instanceof ApiError && FORM_FIELDS.some((field) => error.fieldErrors[field]);
  const banner = error && !onAField ? error.message : null;
  const amountInk = draft.type === 'income' ? colors.income : colors.ink;

  // A foreign amount says how it becomes RSD. The saved figures only while the value is the one
  // they were frozen for; amount, currency or date changed means the API takes the rate again.
  const valueUnchanged =
    draft.amountText === initial.amountText &&
    draft.currency === initial.currency &&
    draft.occurredOn === initial.occurredOn;
  const conversion =
    draft.currency === 'RSD'
      ? null
      : frozen && valueUnchanged
        ? `= ${formatAmount(frozen.amountRsd)} RSD · 1 ${draft.currency} = ${formatRate(frozen.rateToRsd)} RSD`
        : `Converted to RSD at the NBS rate for this date.`;

  return (
    <FormScreen
      topInset={topInset}
      footer={
        <>
          <Button label={submitLabel(draft.type)} loading={pending} loadingLabel="Saving…" tall onPress={submit} />
          {after}
        </>
      }
    >
      {header(draft.type)}

      <View style={styles.segment}>
        <SegmentedControl label="Type" options={TYPES} value={draft.type} onChange={changeType} />
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.amountLabel}>
          Amount
        </Text>
        <View style={styles.amountRow}>
          <TextInput
            value={draft.amountText}
            onChangeText={(amountText) => {
              set({ amountText });
              if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
            }}
            onBlur={() => {
              const parsed = parseAmount(draft.amountText);
              if (draft.amountText && !parsed.ok) setErrors((e) => ({ ...e, amount: parsed.error }));
            }}
            placeholder="0,00"
            placeholderTextColor={colors.placeholder}
            keyboardAppearance={scheme}
            keyboardType="decimal-pad"
            accessibilityLabel={`Amount in ${draft.currency}`}
            accessibilityHint={errors.amount}
            maxLength={20}
            style={[styles.amountInput, { color: amountInk }]}
          />
          <CurrencyMenu value={draft.currency} onChange={(currency) => set({ currency })} />
        </View>
        {errors.amount ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errors.amount}
          </Text>
        ) : conversion ? (
          <Text style={styles.conversion}>{conversion}</Text>
        ) : null}
      </View>

      {belowAmount?.(valueUnchanged)}

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
                    setErrors((e) => ({ ...e, categoryId: undefined }));
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[styles.chip, { backgroundColor: tone.tint }, selected && styles.chipSelected]}
                >
                  {/* Idle chips carry their category colour; the chosen one turns primary. */}
                  <View style={[styles.chipDot, { backgroundColor: selected ? colors.onPrimary : tone.ink }]} />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {errors.categoryId ? <Text style={styles.error}>{errors.categoryId}</Text> : null}
      </View>

      <View style={styles.fields}>
        <DateField
          value={draft.occurredOn}
          onChange={(occurredOn) => set({ occurredOn })}
          error={errors.occurredOn}
        />
        <View style={[styles.descriptionRow, errors.description ? { boxShadow: shadows.fieldError } : null]}>
          <PencilIcon color={colors.ink2} />
          <TextInput
            value={draft.description}
            onChangeText={(description) => set({ description })}
            placeholder="Description (optional)"
            placeholderTextColor={colors.placeholder}
            keyboardAppearance={scheme}
            accessibilityLabel="Description"
            maxLength={500}
            returnKeyType="done"
            style={styles.descriptionInput}
          />
        </View>
        {errors.description ? <Text style={styles.error}>{errors.description}</Text> : null}
        {banner ? <ErrorBanner message={banner} /> : null}
      </View>
    </FormScreen>
  );
}

const useStyles = makeStyles((t) => ({
  segment: { marginTop: 24 },
  amountBlock: { alignItems: 'center', marginTop: 28 },
  amountLabel: { ...type.label, color: t.colors.ink2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  amountInput: {
    ...type.amountInput,
    ...tabularNums,
    width: 220,
    textAlign: 'right',
    padding: 0,
  },
  conversion: { ...type.caption, ...tabularNums, color: t.colors.ink2, marginTop: 8, textAlign: 'center' },
  section: { marginTop: 28, gap: 10 },
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
  fields: { gap: 10, marginTop: 24 },
  descriptionRow: {
    height: 56,
    borderRadius: radii.field,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  descriptionInput: { ...type.fieldValue, flex: 1, height: '100%', color: t.colors.ink, padding: 0 },
  error: { ...type.errorText, color: t.colors.error, marginTop: 8 },
}));
