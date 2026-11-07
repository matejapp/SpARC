import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CURRENCY_OPTIONS } from '@/components/CurrencyMenu';
import { DateField } from '@/components/DateField';
import { ChevronIcon, CloseIcon } from '@/components/icons';
import { AnchoredMenu, useAnchor, type MenuOption } from '@/components/ui/AnchoredMenu';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCategories } from '@/hooks/useTransactions';
import { addDays, fromIsoDate, todayIso } from '@/lib/dates';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';
import {
  hasAnyFilter,
  MAX_SPAN_DAYS,
  matchPreset,
  PERIOD_PRESETS,
  periodLabel,
  presetRange,
  type PeriodPreset,
  type TransactionFilters,
} from '@/lib/transactionFilters';
import type { CategoryResponse, Currency } from '@/types/api';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
] as const;

const NO_CATEGORY = '__none';
type PeriodChoice = PeriodPreset | 'custom';

// The filter bar on Activity (F-03.3 – F-03.7, D-040). Not drawn on the board: derived from the
// Transactions screen and the form's chips. Type is the board's switch; period, category and
// currency are pills that open a list under themselves. An active pill shows its value and an ×
// that removes just that filter; Clear all removes every one, type included.
export function ActivityFilters({
  filters,
  onChange,
}: {
  filters: TransactionFilters;
  onChange: (next: TransactionFilters) => void;
}) {
  const styles = useStyles();
  const expense = useCategories('expense');
  const income = useCategories('income');
  const period = useAnchor();
  const category = useAnchor();
  const currency = useAnchor();
  // A custom range shows its two date fields; a preset range doesn't.
  const [customOpen, setCustomOpen] = useState(false);

  const set = (patch: Partial<TransactionFilters>) => onChange({ ...filters, ...patch });

  const all = [...(expense.data ?? []), ...(income.data ?? [])];
  const chosenCategory = filters.categoryId ? all.find((c) => c.id === filters.categoryId) : undefined;

  function changeType(next: (typeof TYPES)[number]['value']) {
    const type = next === 'all' ? undefined : next;
    // A category of the other kind would only ever match nothing, so it goes with the switch.
    const keepCategory = !type || !chosenCategory || chosenCategory.kind === type;
    onChange({ ...filters, type, categoryId: keepCategory ? filters.categoryId : undefined });
  }

  // Period
  const preset = filters.from && filters.to ? matchPreset(filters.from, filters.to) : null;
  const showCustom = Boolean(filters.from && filters.to && (customOpen || !preset));
  const periodValue: PeriodChoice | null = filters.from ? (showCustom ? 'custom' : preset) : null;
  const periodOptions: MenuOption<PeriodChoice>[] = [
    ...PERIOD_PRESETS,
    { value: 'custom', label: 'Custom range…' },
  ];
  function pickPeriod(choice: PeriodChoice) {
    if (choice === 'custom') {
      // Start from what is showing, or this month so far.
      setCustomOpen(true);
      set(filters.from && filters.to ? {} : { from: presetRange('thisMonth').from, to: todayIso() });
      return;
    }
    setCustomOpen(false);
    set(presetRange(choice));
  }

  // Category: the switch's kind only, or both under headings.
  const kinds: { label: string; items: CategoryResponse[] | undefined }[] =
    filters.type === 'income'
      ? [{ label: 'Income', items: income.data }]
      : filters.type === 'expense'
        ? [{ label: 'Expense', items: expense.data }]
        : [
            { label: 'Expense', items: expense.data },
            { label: 'Income', items: income.data },
          ];
  const categoryOptions: MenuOption<string>[] = [
    ...kinds.flatMap((k) => (k.items ?? []).map((c) => ({ value: c.id, label: c.name, section: k.label }))),
    { value: NO_CATEGORY, label: 'No category', section: 'Other' },
  ];
  const categoryLabel = filters.uncategorised ? 'No category' : (chosenCategory?.name ?? 'Category');

  return (
    <View style={styles.wrap}>
      <SegmentedControl label="Type" options={TYPES} value={filters.type ?? 'all'} onChange={changeType} />

      <View style={styles.chips}>
        <FilterChip
          anchorRef={period.ref}
          label={filters.from && filters.to ? periodLabel(filters.from, filters.to) : 'Period'}
          name="period"
          active={Boolean(filters.from)}
          expanded={period.anchor !== null}
          onOpen={period.open}
          onClear={() => {
            setCustomOpen(false);
            set({ from: undefined, to: undefined });
          }}
        />
        <FilterChip
          anchorRef={category.ref}
          label={categoryLabel}
          name="category"
          active={Boolean(filters.categoryId || filters.uncategorised)}
          expanded={category.anchor !== null}
          onOpen={category.open}
          onClear={() => set({ categoryId: undefined, uncategorised: undefined })}
        />
        <FilterChip
          anchorRef={currency.ref}
          label={filters.currency ?? 'Currency'}
          name="currency"
          active={Boolean(filters.currency)}
          expanded={currency.anchor !== null}
          onOpen={currency.open}
          onClear={() => set({ currency: undefined })}
        />
        {hasAnyFilter(filters) ? (
          <Button
            label="Clear all"
            variant="link"
            onPress={() => {
              setCustomOpen(false);
              onChange({});
            }}
          />
        ) : null}
      </View>

      {showCustom && filters.from && filters.to ? (
        <View style={styles.range}>
          <DateField
            caption="From"
            value={filters.from}
            maximumDate={fromIsoDate(filters.to)}
            // The API allows at most MAX_SPAN_DAYS, so an earlier From pulls To along with it.
            onChange={(from) => set({ from, to: minIso(filters.to!, addDays(from, MAX_SPAN_DAYS)) })}
          />
          <DateField
            caption="To"
            value={filters.to}
            minimumDate={fromIsoDate(filters.from)}
            // At most MAX_SPAN_DAYS after From. Not capped at today: "This month" already ends
            // in the future, and a future day simply matches nothing.
            maximumDate={fromIsoDate(addDays(filters.from, MAX_SPAN_DAYS))}
            onChange={(to) => set({ to })}
          />
        </View>
      ) : null}

      <AnchoredMenu
        anchor={period.anchor}
        onClose={period.close}
        label="Period"
        options={periodOptions}
        value={periodValue}
        onPick={pickPeriod}
        align="left"
      />
      <AnchoredMenu
        anchor={category.anchor}
        onClose={category.close}
        label="Category"
        options={categoryOptions}
        value={filters.uncategorised ? NO_CATEGORY : (filters.categoryId ?? null)}
        onPick={(id) =>
          set(id === NO_CATEGORY ? { categoryId: undefined, uncategorised: true } : { categoryId: id, uncategorised: undefined })
        }
        align="left"
      />
      <AnchoredMenu
        anchor={currency.anchor}
        onClose={currency.close}
        label="Currency"
        options={CURRENCY_OPTIONS}
        value={filters.currency ?? null}
        onPick={(c: Currency) => set({ currency: c })}
        align="left"
      />
    </View>
  );
}

const minIso = (a: string, b: string) => (a < b ? a : b);

// A pill: idle it names the filter and opens its list; active it shows the value, still opens
// the list to change it, and has an × of its own that removes the filter.
function FilterChip({
  anchorRef,
  label,
  name,
  active,
  expanded,
  onOpen,
  onClear,
}: {
  anchorRef: Ref<ComponentRef<typeof View>>;
  label: string;
  name: string;
  active: boolean;
  expanded: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const ink = active ? colors.onPrimary : colors.ink;
  return (
    <View ref={anchorRef} style={[styles.chip, active && styles.chipActive]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={active ? `${name}: ${label}` : `Filter by ${name}`}
        accessibilityHint={`Opens the list of ${name === 'category' ? 'categories' : `${name}s`}`}
        accessibilityState={{ expanded }}
        hitSlop={{ top: 4, bottom: 4 }}
        style={({ pressed }) => [styles.chipBody, pressed && styles.pressed]}
      >
        <Text style={[styles.chipText, { color: ink }]} numberOfLines={1}>
          {label}
        </Text>
        {active ? null : <ChevronIcon color={colors.ink2} size={12} down />}
      </Pressable>
      {active ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`Remove the ${name} filter`}
          hitSlop={{ top: 4, bottom: 4, right: 6 }}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <CloseIcon color={ink} size={12} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chip: {
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: t.colors.primary, boxShadow: 'none' },
  chipBody: { height: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 14, paddingRight: 12, flexShrink: 1 },
  chipText: { ...type.chip, flexShrink: 1 },
  clear: { height: '100%', paddingLeft: 2, paddingRight: 12, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  range: { gap: 10 },
}));
