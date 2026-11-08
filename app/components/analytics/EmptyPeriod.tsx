import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { AnalyticsIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import type { Period } from '@/lib/periods';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

/** No income and no expense in the period (F-04.7; board → Analytics — empty). */
export function EmptyPeriod({ period, onPrevious }: { period: Period; onPrevious: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.tile}>
        <AnalyticsIcon color={colors.ink} size={28} active={false} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {period.isCurrent ? `Nothing in ${period.name} yet` : `Nothing in ${period.name}`}
      </Text>
      <Text style={styles.text}>
        {period.isCurrent
          ? 'Add an income or an expense and its numbers and charts show up here.'
          : 'No income or expense was recorded in this period.'}
      </Text>
      <View style={styles.actions}>
        <Button label="Add a transaction" onPress={() => router.push('/add')} />
        {period.canGoBack ? <Button label={`See ${period.previousName}`} variant="link" onPress={onPrevious} /> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.card,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
    boxShadow: t.shadows.card,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: t.colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.modalTitle, fontSize: 19, color: t.colors.ink, textAlign: 'center', marginTop: 6 },
  text: { ...type.body, fontSize: 14, color: t.colors.ink2, textAlign: 'center', maxWidth: 280 },
  actions: { alignSelf: 'stretch', gap: 4, marginTop: 12 },
}));
