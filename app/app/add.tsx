import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { colors, radii, shadows, spacing, type } from '@/lib/theme';

// Placeholder for the add-transaction modal. The form arrives with card #26.
export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.close}
        >
          <CloseIcon color={colors.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.heading}>
          New expense
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.card}>
        <Text style={styles.note}>
          Amount, type, category, date and description. Built in card #26.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
    paddingHorizontal: spacing.gutter,
    gap: 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.card,
  },
  heading: { ...type.modalTitle, color: colors.ink },
  headerSpacer: { width: 48 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    boxShadow: shadows.card,
  },
  note: { ...type.body, color: colors.ink2 },
});
