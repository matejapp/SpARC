import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows, spacing, type } from '@/lib/theme';

// Stand-in for a screen whose card has not been built yet. Deleted screen by screen as
// each [App] card replaces it.
export function PlaceholderScreen({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.card}>
        <Text style={styles.note}>{note}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
    paddingHorizontal: spacing.gutter,
    gap: 16,
  },
  title: { ...type.screenTitle, color: colors.ink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    boxShadow: shadows.card,
  },
  note: { ...type.body, color: colors.ink2 },
});
