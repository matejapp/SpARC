import Svg, { Path } from 'react-native-svg';

// One line icon per seeded category (Data/SystemCategories.cs), keyed by name. The first seven
// are the board's; the rest are drawn to match. A user category, or a renamed one, gets the
// fallback dot.
const PATHS: Record<string, string> = {
  Groceries:
    'M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6M9 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M18 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1',
  'Dining out': 'M7 3v8a2 2 0 0 0 2 2v8M7 3v5M11 3v5a2 2 0 0 1-2 2M17 21V3c-2 1-3 4-3 7h3',
  Transport:
    'M6 3h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM4 11h16M8 21l1.5-4M16 21l-1.5-4',
  Utilities: 'M13 2L4 14h7l-1 8 9-12h-7z',
  Salary:
    'M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  Subscriptions: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  Housing: 'M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z',
  Health: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  Entertainment: 'M4 6h16v12H4zM10 9.5v5l4-2.5z',
  Shopping: 'M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2',
  Education: 'M3 9l9-4 9 4-9 4zM7 11v5c3 2 7 2 10 0v-5',
  Freelance: 'M4 6h16v10H4zM2 19h20',
  Gifts: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
  Refunds: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
};

const FALLBACK = 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';

export function CategoryIcon({ name, color, size = 20 }: { name: string | null; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d={(name && PATHS[name]) || FALLBACK}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
