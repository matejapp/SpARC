import { Pressable, Text } from 'react-native';

import { ChevronIcon } from '@/components/icons';
import { AnchoredMenu, useAnchor, type MenuOption } from '@/components/ui/AnchoredMenu';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { Currency } from '@/types/api';

export const CURRENCY_OPTIONS: readonly MenuOption<Currency>[] = [
  { value: 'RSD', code: 'RSD', label: 'Serbian dinar' },
  { value: 'EUR', code: 'EUR', label: 'Euro' },
  { value: 'USD', code: 'USD', label: 'US dollar' },
];

// The currency pill beside an amount (transaction and bill forms) and the list it opens.
export function CurrencyMenu({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const menu = useAnchor();

  return (
    <>
      <Pressable
        ref={menu.ref}
        onPress={menu.open}
        accessibilityRole="button"
        accessibilityLabel={`Currency, ${value}`}
        accessibilityHint="Opens the list of currencies"
        accessibilityState={{ expanded: menu.anchor !== null }}
        hitSlop={8} // 32 tall as drawn; the slop makes the target 48
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Text style={styles.pillText}>{value}</Text>
        <ChevronIcon color={colors.ink2} size={12} down />
      </Pressable>
      <AnchoredMenu
        anchor={menu.anchor}
        onClose={menu.close}
        label="Currency"
        options={CURRENCY_OPTIONS}
        value={value}
        onPick={onChange}
      />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  pill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pressed: { opacity: 0.6 },
  pillText: { ...type.pill, ...tabularNums, color: t.colors.ink },
}));
