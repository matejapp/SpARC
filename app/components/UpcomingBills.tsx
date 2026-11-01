import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { OccurrenceRow, occurrenceState } from '@/components/OccurrenceRow';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useUpcomingBills } from '@/hooks/useBills';
import { dueDay, todayIso } from '@/lib/dates';
import { makeStyles, radii, type } from '@/lib/theme';

// The dashboard's "Bills due" section (F-04.6): overdue months first, then what falls due in the
// next 30 days. Not drawn on the board — derived from the Recent card. It loads and fails on its
// own, so the rest of the dashboard keeps working without it.
export function UpcomingBills() {
  const styles = useStyles();
  const upcoming = useUpcomingBills();
  const today = todayIso();

  let body;
  if (upcoming.isPending) {
    body = <RowsSkeleton rows={2} label="Loading bills due" />;
  } else if (upcoming.isError && !upcoming.data) {
    body = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageText}>Bills due didn't load.</Text>
        <Button label="Try again" variant="secondary" onPress={() => upcoming.refetch()} />
      </View>
    );
  } else if (upcoming.data.length === 0) {
    body = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageText}>No bills due in the next 30 days.</Text>
        <Button label="Add a bill" variant="link" onPress={() => router.push('/bill/new')} />
      </View>
    );
  } else {
    body = (
      <View style={[styles.card, styles.rows]}>
        {upcoming.data.map((o, i) => {
          const state = occurrenceState(o, today);
          return (
            <OccurrenceRow
              key={o.id}
              occurrence={o}
              title={o.billName}
              caption={state === 'overdue' ? `Overdue since ${dueDay(o.dueDate, today)}` : `Due ${dueDay(o.dueDate, today)}`}
              state={state}
              divider={i > 0}
              onPress={() => router.push({ pathname: '/bill/[id]', params: { id: o.billId } })}
              hint="Opens the bill"
            />
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Bills due
        </Text>
        <Button label="Calendar" variant="link" onPress={() => router.navigate('/calendar')} />
      </View>
      {body}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: 8, marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...type.sectionTitle, color: t.colors.ink },
  card: { backgroundColor: t.colors.surface, borderRadius: radii.card, boxShadow: t.shadows.card },
  rows: { paddingVertical: 4, paddingHorizontal: 16 },
  message: { padding: 20, gap: 12 },
  messageText: { ...type.body, color: t.colors.ink2 },
}));
