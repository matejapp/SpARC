import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { DateField } from '@/components/DateField';
import { FormScreen } from '@/components/FormScreen';
import { PencilIcon } from '@/components/icons';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCategories } from '@/hooks/useTransactions';
import { todayIso } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { colors, radii, shadows, tabularNums, type } from '@/lib/theme';
import type { IsoDate, TransactionRequest, TransactionType } from '@/types/api';

export type TransactionDraft = {
  type: TransactionType;
  amountText: string;
  categoryId: string | null;
  occurredOn: IsoDate;
  description: string;
};

export const emptyDraft = (type: TransactionType = 'expense'): TransactionDraft => ({
  type,
  amountText: '',
  categoryId: null,
  occurredOn: todayIso(),
  description: '',
});

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
}: {
  initial: TransactionDraft;
  header: (type: TransactionType) => ReactNode;
  submitLabel: (type: TransactionType) => string;
  onSubmit: (request: TransactionRequest) => void;
  pending: boolean;
  error: Error | null;
  topInset?: boolean;
  after?: ReactNode;
}) {
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
      currency: 'RSD', // the only currency the API accepts until multi-currency
      categoryId: draft.categoryId,
      occurredOn: draft.occurredOn,
      description: draft.description.trim() || null,
    });
  }

  // An error that names none of this form's fields (a 404 category, the RSD-only rule, the
  // network) goes in the banner instead.
  const onAField =
    error instanceof ApiError && FORM_FIELDS.some((field) => error.fieldErrors[field]);
  const banner = error && !onAField ? error.message : null;
  const amountInk = draft.type === 'income' ? colors.income : colors.ink;

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
            keyboardType="decimal-pad"
            accessibilityLabel="Amount in RSD"
            accessibilityHint={errors.amount}
            maxLength={20}
            style={[styles.amountInput, { color: amountInk }]}
          />
          <View style={styles.currencyPill}>
            <Text style={styles.currencyText}>RSD</Text>
          </View>
        </View>
        {errors.amount ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errors.amount}
          </Text>
        ) : null}
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
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    set({ categoryId: c.id });
                    setErrors((e) => ({ ...e, categoryId: undefined }));
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
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

const styles = StyleSheet.create({
  segment: { marginTop: 24 },
  amountBlock: { alignItems: 'center', marginTop: 28 },
  amountLabel: { ...type.label, color: colors.ink2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  amountInput: {
    ...type.amountInput,
    ...tabularNums,
    width: 220,
    textAlign: 'right',
    padding: 0,
  },
  currencyPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.outline,
    justifyContent: 'center',
  },
  currencyText: { ...type.pill, color: colors.ink },
  section: { marginTop: 28, gap: 10 },
  sectionLabel: { ...type.label, color: colors.ink2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.outline,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.ink, boxShadow: 'none' },
  chipText: { ...type.chip, color: colors.ink },
  chipTextSelected: { color: colors.onInk },
  chipSkeleton: { height: 44, borderRadius: radii.pill, backgroundColor: colors.hairline },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineErrorText: { ...type.body, color: colors.ink },
  fields: { gap: 10, marginTop: 24 },
  descriptionRow: {
    height: 56,
    borderRadius: radii.field,
    backgroundColor: colors.surface,
    boxShadow: shadows.outline,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  descriptionInput: { ...type.fieldValue, flex: 1, height: '100%', color: colors.ink, padding: 0 },
  error: { ...type.errorText, color: colors.error, marginTop: 8 },
});
