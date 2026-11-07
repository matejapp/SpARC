import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { CheckIcon, ChevronIcon } from '@/components/icons';
import { makeStyles, radii, spacing, tabularNums, type, useTheme } from '@/lib/theme';
import type { Currency } from '@/types/api';

const OPTIONS: readonly { code: Currency; name: string }[] = [
  { code: 'RSD', name: 'Serbian dinar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US dollar' },
];

const MENU_WIDTH = 220;

type Anchor = { x: number; y: number; width: number; height: number };

// The currency pill beside the amount and the list it opens. Drawn by the app rather than a
// native picker so it looks and behaves the same on iOS and Android, with no new dependency.
// A Modal is a separate native layer above the whole screen (even the tab bar and the keyboard);
// transparent, it lets the menu sit under the pill, and a tap anywhere outside closes it.
export function CurrencyMenu({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  // A View's ref is its native element, which can measure itself on screen.
  const pill = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  // measureInWindow gives the pill's place on screen, so the menu can open right below it.
  // The Modal is statusBarTranslucent, so on Android both use the same origin as on iOS.
  function open() {
    pill.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  }

  function pick(code: Currency) {
    setAnchor(null);
    if (code !== value) onChange(code);
  }

  // Right edges line up with the pill; never closer than the page gutter to either side.
  const left = anchor
    ? Math.min(
        Math.max(spacing.gutter, anchor.x + anchor.width - MENU_WIDTH),
        screenWidth - spacing.gutter - MENU_WIDTH,
      )
    : 0;

  return (
    <>
      <Pressable
        ref={pill}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Currency, ${value}`}
        accessibilityHint="Opens the list of currencies"
        accessibilityState={{ expanded: anchor !== null }}
        hitSlop={8} // 32 tall as drawn; the slop makes the target 48
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Text style={styles.pillText}>{value}</Text>
        <ChevronIcon color={colors.ink2} size={12} down />
      </Pressable>

      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAnchor(null)} // Android back button
      >
        <Pressable style={styles.backdrop} onPress={() => setAnchor(null)} accessibilityLabel="Close the currency list">
          {anchor ? (
            <View
              accessibilityRole="menu"
              accessibilityLabel="Currency"
              style={[styles.menu, { top: anchor.y + anchor.height + 8, left }]}
            >
              {OPTIONS.map((option, i) => {
                const selected = option.code === value;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => pick(option.code)}
                    accessibilityRole="menuitem"
                    accessibilityLabel={`${option.code}, ${option.name}`}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.rowPressed]}
                  >
                    <Text style={styles.code}>{option.code}</Text>
                    <Text style={styles.name}>{option.name}</Text>
                    {selected ? <CheckIcon color={colors.ink} /> : <View style={styles.checkSpace} />}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
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
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: radii.field,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.card,
    overflow: 'hidden',
  },
  row: { height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { boxShadow: t.shadows.divider },
  rowPressed: { backgroundColor: t.colors.overlay },
  code: { ...type.pill, ...tabularNums, color: t.colors.ink, width: 36 },
  name: { ...type.fieldValue, color: t.colors.ink2, flex: 1 },
  checkSpace: { width: 18 },
}));
