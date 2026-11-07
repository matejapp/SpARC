import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandArc } from '@/components/BrandArc';
import { ChevronIcon } from '@/components/icons';
import { useMe } from '@/hooks/useMe';
import { makeStyles, radii, spacing, type, useTheme } from '@/lib/theme';

// The Analytics tab (F-04.3 – F-04.5, F-04.8 – F-04.14; board → Analytics tab). Every amount
// is in the display currency, which the chip in the header shows and opens in settings.
export default function AnalyticsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const currency = me.data?.preferredCurrency;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <BrandArc />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Analytics
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={currency ? `Display currency: ${currency}. Change in settings` : 'Display currency settings'}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Text style={styles.chipText}>{currency ?? '···'}</Text>
          <ChevronIcon color={colors.ink2} size={14} down />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  title: { ...type.screenTitle, color: t.colors.ink },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  chipText: { ...type.buttonSmall, color: t.colors.ink, letterSpacing: 0.8 },
}));
