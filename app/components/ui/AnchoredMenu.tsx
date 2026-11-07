import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { makeStyles, radii, spacing, tabularNums, type, useTheme } from '@/lib/theme';

const MENU_WIDTH = 240;
const ROW_HEIGHT = 48;

type Anchor = { x: number; y: number; width: number; height: number };

export type MenuOption<T extends string> = {
  value: T;
  label: string;
  /** Short bold text before the label, a fixed column: the currency code. */
  code?: string;
  /** A heading shown above this option when it differs from the previous one's. */
  section?: string;
};

/**
 * The trigger side of a menu: put `ref` on the button and call `open` from its onPress.
 * measureInWindow gives the button's place on screen, so the menu opens right below it. The
 * Modal is statusBarTranslucent, so on Android both use the same origin as on iOS.
 */
export function useAnchor() {
  // A View's ref is its native element, which can measure itself on screen.
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  return {
    ref,
    anchor,
    open: () => ref.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height })),
    close: () => setAnchor(null),
  };
}

// A list that opens under the button that asked for it (the currency pill, the Activity filters).
// Drawn by the app rather than a native picker, so it is the same on iOS and Android with no new
// dependency. A Modal is a separate native layer above the whole screen, even the tab bar and the
// keyboard; transparent, it lets the menu sit under its button, and a tap outside closes it.
export function AnchoredMenu<T extends string>({
  anchor,
  onClose,
  label,
  options,
  value,
  onPick,
  align = 'right',
}: {
  anchor: Anchor | null;
  onClose: () => void;
  /** What the list is, for screen readers: "Currency", "Category". */
  label: string;
  options: readonly MenuOption<T>[];
  value: T | null;
  onPick: (value: T) => void;
  /** Which edge lines up with the button. */
  align?: 'left' | 'right';
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const top = anchor ? anchor.y + anchor.height + 8 : 0;
  const wanted = anchor ? (align === 'right' ? anchor.x + anchor.width - MENU_WIDTH : anchor.x) : 0;
  // Never closer than the page gutter to either side, and never past the bottom of the screen:
  // a long list scrolls inside the menu.
  const left = Math.min(Math.max(spacing.gutter, wanted), screenWidth - spacing.gutter - MENU_WIDTH);
  const maxHeight = Math.max(ROW_HEIGHT * 3, screenHeight - top - 48);

  return (
    <Modal
      visible={anchor !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose} // Android back button
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={`Close the ${label.toLowerCase()} list`}>
        {anchor ? (
          <View accessibilityRole="menu" accessibilityLabel={label} style={[styles.menu, { top, left, maxHeight }]}>
            <ScrollView bounces={false}>
              {options.map((option, i) => {
                const selected = option.value === value;
                const heading = option.section && option.section !== options[i - 1]?.section ? option.section : null;
                return (
                  <View key={option.value}>
                    {heading ? (
                      <Text style={[styles.section, i > 0 && styles.divider]} accessibilityRole="header">
                        {heading}
                      </Text>
                    ) : null}
                    <Pressable
                      onPress={() => {
                        onClose();
                        if (!selected) onPick(option.value);
                      }}
                      accessibilityRole="menuitem"
                      accessibilityLabel={option.code ? `${option.code}, ${option.label}` : option.label}
                      accessibilityState={{ selected }}
                      style={({ pressed }) => [
                        styles.row,
                        i > 0 && !heading && styles.divider,
                        pressed && styles.rowPressed,
                      ]}
                    >
                      {option.code ? <Text style={styles.code}>{option.code}</Text> : null}
                      <Text style={option.code ? styles.detail : styles.label} numberOfLines={1}>
                        {option.label}
                      </Text>
                      {selected ? <CheckIcon color={colors.ink} /> : <View style={styles.checkSpace} />}
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: radii.field,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.card,
    overflow: 'hidden',
  },
  section: { ...type.fieldCaption, color: t.colors.ink2, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  row: { height: ROW_HEIGHT, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { boxShadow: t.shadows.divider },
  rowPressed: { backgroundColor: t.colors.overlay },
  code: { ...type.pill, ...tabularNums, color: t.colors.ink, width: 36 },
  detail: { ...type.fieldValue, color: t.colors.ink2, flex: 1 },
  label: { ...type.fieldValue, color: t.colors.ink, flex: 1 },
  checkSpace: { width: 18 },
}));
