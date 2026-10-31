import { ApiStatus } from '@/components/ApiStatus';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function DashboardScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      note="The dashboard: month cards with income, expense and what is left. Built in card #29."
    >
      <ApiStatus />
    </PlaceholderScreen>
  );
}
