import { router } from 'expo-router';

import { ApiStatus } from '@/components/ApiStatus';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { Button } from '@/components/ui/Button';

export default function DashboardScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      note="The dashboard: month cards with income, expense and what is left. Built in card #29."
    >
      <ApiStatus />
      {/* Stand-in for the avatar button the dashboard header brings. */}
      <Button label="Profile and settings" variant="secondary" onPress={() => router.push('/settings')} />
    </PlaceholderScreen>
  );
}
