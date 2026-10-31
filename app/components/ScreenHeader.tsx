import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackIcon } from '@/components/icons';
import { colors, radii, shadows, type } from '@/lib/theme';

// Back button and centred title for a pushed screen (settings, transaction detail). The
// stack's native header is off app-wide so every screen matches the board.
export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={[styles.slot, styles.back]}
      >
        <BackIcon color={colors.ink} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {/* Balances the back button so the title stays centred. */}
      <View style={styles.slot} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slot: { width: 44, height: 44 },
  back: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.modalTitle, flex: 1, textAlign: 'center', color: colors.ink },
});
