import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { CARD_PADDING } from '@/components/analytics/chart';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { makeStyles, radii, type } from '@/lib/theme';

type Props<T> = {
  title: string;
  /** Small text at the title's right: "Last 6 months". */
  aside?: string;
  /** A control at the title's right instead (the Expense / Income switch). */
  action?: ReactNode;
  query: UseQueryResult<T>;
  /** Height of the grey block shown while loading, about the chart's own. */
  skeletonHeight?: number;
  children: (data: T) => ReactNode;
};

/**
 * One Analytics card over one query (board → Analytics — loading, empty, error). Each card loads
 * and fails on its own, so a failed chart leaves the rest of the screen readable. Data already
 * shown stays on a failed refetch.
 */
export function AnalyticsCard<T>({ title, aside, action, query, skeletonHeight = 150, children }: Props<T>) {
  const styles = useStyles();
  let body: ReactNode;
  if (query.data !== undefined) {
    body = children(query.data);
  } else if (query.isError) {
    body = (
      <View style={styles.error}>
        <ErrorBanner message={errorMessage(query.error)} />
        <View style={styles.retry}>
          <Button label="Try again" variant="secondary" onPress={() => query.refetch()} />
        </View>
      </View>
    );
  } else {
    body = (
      <View
        accessible
        accessibilityLabel={`Loading ${title.toLowerCase()}`}
        accessibilityState={{ busy: true }}
        style={[styles.skeleton, { height: skeletonHeight }]}
      />
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {action ?? (aside ? <Text style={styles.aside}>{aside}</Text> : null)}
      </View>
      {body}
    </View>
  );
}

function errorMessage(e: Error): string {
  if (e instanceof ApiError && e.kind !== 'http') return "This chart didn't load. Check your connection, then try again.";
  // A 4xx from the API carries a sentence meant for people (e.g. no NBS rate for a date).
  return `This chart didn't load. ${e.message}`;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.card,
    padding: CARD_PADDING,
    gap: 12,
    boxShadow: t.shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32 },
  title: { ...type.modalTitle, color: t.colors.ink, flexShrink: 1 },
  aside: { ...type.caption, color: t.colors.ink2 },
  skeleton: { borderRadius: radii.tile, backgroundColor: t.colors.tile },
  error: { gap: 12 },
  retry: { alignSelf: 'flex-start' },
}));
