import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { colors, type } from '@/lib/theme';

export default function DashboardScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      note="The dashboard: month cards with income, expense and what is left. Built in card #29."
    >
      {/* Until card #23 gates the app on a session, the login screen is reached from here. */}
      <Link href="/login" style={styles.link}>
        Open the login screen
      </Link>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  link: { ...type.headline, color: colors.accentText, paddingVertical: 12 },
});
