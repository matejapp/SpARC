// The two colour themes (D-033). Every colour value in the app lives in this file; components
// ask useTheme() for a role (`primary`, `accent`, `ink`…), never for a hue.
//
//   dark  (default) — midnight ground, electric blue actions, cantaloupe accent
//   light           — the D-027 warm light palette, with the same cantaloupe accent
//
// Cantaloupe is the brand orange in both: the month card, the add button and the mark. Text on
// it is dark in both themes (white on cantaloupe is unreadable). Orange never marks an amount.

export type Scheme = 'dark' | 'light';

type Gradient = {
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export type Tone = { tint: string; ink: string };

export type Palette = {
  scheme: Scheme;
  colors: {
    ground: string; // screen background
    surface: string; // cards, inputs
    ink: string; // text, icons, expense amounts
    ink2: string; // secondary text, inactive tab
    hairline: string;
    tile: string; // icon tile behind an uncoloured row
    muted: string; // disabled button, skeleton
    primary: string; // primary buttons, the chosen chip
    onPrimary: string;
    tabActive: string;
    income: string;
    incomeTint: string;
    error: string;
    errorTint: string;
    accentText: string; // links, the avatar initial; never an amount
    onAccent: string; // text and marks on the cantaloupe card and the add button
    onCard: string; // small text on the cantaloupe card
    placeholder: string;
    overlay: string; // pressed state
    onCardSkeleton: string;
    cardChip: string;
    cardChipLine: string;
    segmentTrack: string;
    segmentThumb: string;
  };
  shadows: {
    card: string;
    primaryButton: string;
    addButton: string;
    outline: string; // secondary buttons, idle inputs
    outlineQuiet: string; // "Load older"
    fieldFocus: string;
    fieldError: string;
    segmentLift: string;
    monthCard: string;
    tabBar: string;
    divider: string; // between rows in a card
  };
  gradients: { accent: Gradient; cardBack: Gradient; mark: readonly [string, string, string] };
  tabBarBackground: string;
  /** How strongly the logo arc shows behind screen headers (BrandArc). */
  arcOpacity: number;
  /** One hue per seeded category for its tile, icon and chip (D-032). */
  categoryTones: Record<string, Tone>;
};

// Cantaloupe, shared by both themes. expo-linear-gradient runs diagonally from `start` to `end`,
// approximating the board's radial light from the top-right.
const accent: Gradient = {
  colors: ['#FFC9A3', '#FFA177', '#F7894F', '#E8743D'],
  start: { x: 1, y: 0 },
  end: { x: 0, y: 1 },
};
const mark = ['#FFB088', '#FF9461', '#E8743D'] as const; // the logo arc, as in assets/brand/sparc-mark.svg

// Contrast: text ≥ 6.6:1 on its surfaces, white on primary 4.5:1, midnight on cantaloupe
// ≥ 5.4:1, category icon on tint ≥ 6.1:1.
export const dark: Palette = {
  scheme: 'dark',
  colors: {
    ground: '#0A0D14',
    surface: '#151A24',
    ink: '#EEF1F7',
    ink2: '#97A1B3',
    hairline: '#222A38',
    tile: '#1B2130',
    muted: '#2A3242',
    primary: '#2E6BFF',
    onPrimary: '#FFFFFF',
    tabActive: '#7AA2FF',
    income: '#3DD68C',
    incomeTint: '#0F2A1E',
    error: '#FF6B5E',
    errorTint: '#34161A',
    accentText: '#7AA2FF',
    onAccent: '#0A0D14',
    onCard: 'rgba(10,13,20,0.78)',
    placeholder: '#6B7588',
    overlay: 'rgba(255,255,255,0.08)',
    onCardSkeleton: 'rgba(10,13,20,0.14)',
    cardChip: 'rgba(255,255,255,0.45)',
    cardChipLine: 'rgba(10,13,20,0.35)',
    segmentTrack: '#0F131C',
    segmentThumb: '#2A3242',
  },
  // On midnight a drop shadow barely shows, so surfaces separate by colour and hairlines; the
  // coloured glows mark the two accents.
  shadows: {
    card: 'inset 0 0 0 1px #1E2533, 0 10px 24px rgba(0,0,0,0.35)',
    primaryButton: '0 10px 22px -10px rgba(46,107,255,0.8)',
    addButton: '0 12px 26px -10px rgba(255,161,119,0.75)',
    outline: 'inset 0 0 0 1px #2A3242',
    outlineQuiet: 'inset 0 0 0 1px #3A4356',
    fieldFocus: 'inset 0 0 0 2px #2E6BFF',
    fieldError: 'inset 0 0 0 2px #FF6B5E',
    segmentLift: '0 2px 8px rgba(0,0,0,0.4)',
    monthCard: '0 22px 44px -18px rgba(255,161,119,0.55)',
    tabBar: '0 -1px 0 #1E2533',
    divider: 'inset 0 1px 0 #222A38',
  },
  gradients: {
    accent,
    cardBack: { colors: ['#6E9BFF', '#2E6BFF', '#1A3FB8'], start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    mark,
  },
  tabBarBackground: 'rgba(14,18,27,0.94)',
  arcOpacity: 0.16,
  categoryTones: {
    Groceries: { tint: '#0F2A31', ink: '#5CC8E0' },
    'Dining out': { tint: '#33240F', ink: '#F2B25C' },
    Housing: { tint: '#2E2119', ink: '#D69A72' },
    Utilities: { tint: '#2F2A0E', ink: '#E8CB4A' },
    Transport: { tint: '#142340', ink: '#7FA8F5' },
    Health: { tint: '#3A1520', ink: '#F27B97' },
    Entertainment: { tint: '#251C3D', ink: '#B49AF0' },
    Shopping: { tint: '#36152B', ink: '#EA80C2' },
    Subscriptions: { tint: '#1B1F3F', ink: '#9AA4F2' },
    Education: { tint: '#1E2430', ink: '#A9B6CC' },
    Salary: { tint: '#0F2A1E', ink: '#3DD68C' },
    Freelance: { tint: '#1A2A12', ink: '#8FD45E' },
    Gifts: { tint: '#26290F', ink: '#C2D84A' },
    Refunds: { tint: '#0E2A26', ink: '#4FD1B5' },
  },
};

// Contrast: ink text 16:1, links (deep cantaloupe) ≥ 4.8:1 on every light surface, ink on
// cantaloupe ≥ 5.6:1, category icon on tint ≥ 4.3:1.
export const light: Palette = {
  scheme: 'light',
  colors: {
    ground: '#F6F4F2',
    surface: '#FFFFFF',
    ink: '#1F1D1B',
    ink2: '#6F6A65',
    hairline: '#ECE8E4',
    tile: '#F3EFEC',
    muted: '#E4DFDA',
    primary: '#1F1D1B',
    onPrimary: '#FFFFFF',
    tabActive: '#1F1D1B',
    income: '#2F7D57',
    incomeTint: '#E7F2EC',
    error: '#C0362C',
    errorTint: '#FBEAE8',
    accentText: '#A84E1F',
    onAccent: '#1F1D1B',
    onCard: 'rgba(31,29,27,0.78)',
    placeholder: '#8A847E',
    overlay: 'rgba(31,29,27,0.08)',
    onCardSkeleton: 'rgba(31,29,27,0.14)',
    cardChip: 'rgba(255,255,255,0.5)',
    cardChipLine: 'rgba(31,29,27,0.35)',
    segmentTrack: '#ECE8E4',
    segmentThumb: '#FFFFFF',
  },
  shadows: {
    card: '0 1px 2px rgba(31,29,27,0.04), 0 8px 24px rgba(31,29,27,0.06)',
    primaryButton: '0 8px 18px -8px rgba(31,29,27,0.5)',
    addButton: '0 12px 24px -10px rgba(232,116,61,0.7)',
    outline: 'inset 0 0 0 1px #ECE8E4',
    outlineQuiet: 'inset 0 0 0 1px #DCD6D0',
    fieldFocus: 'inset 0 0 0 2px #1F1D1B',
    fieldError: 'inset 0 0 0 2px #C0362C',
    segmentLift: '0 1px 2px rgba(31,29,27,0.08), 0 4px 10px rgba(31,29,27,0.06)',
    monthCard: '0 20px 40px -16px rgba(232,116,61,0.55)',
    tabBar: '0 -1px 0 #ECE8E4',
    divider: 'inset 0 1px 0 #ECE8E4',
  },
  gradients: {
    accent,
    cardBack: { colors: ['#5A534E', '#3A3633', '#1F1D1B'], start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
    mark,
  },
  tabBarBackground: 'rgba(255,255,255,0.92)',
  arcOpacity: 0.22,
  categoryTones: {
    Groceries: { tint: '#E1EFF3', ink: '#1D7184' },
    'Dining out': { tint: '#FBEEDB', ink: '#9A5B0E' },
    Housing: { tint: '#F3E8E0', ink: '#875838' },
    Utilities: { tint: '#FAF2D2', ink: '#7D6200' },
    Transport: { tint: '#E4ECF8', ink: '#2E5C9A' },
    Health: { tint: '#FAE6EA', ink: '#AE3752' },
    Entertainment: { tint: '#EEE8F8', ink: '#6748A3' },
    Shopping: { tint: '#F7E6F1', ink: '#9C3577' },
    Subscriptions: { tint: '#E7E9F7', ink: '#434F9B' },
    Education: { tint: '#E8EBF0', ink: '#4C5A72' },
    Salary: { tint: '#E7F2EC', ink: '#2F7D57' },
    Freelance: { tint: '#E6F1DF', ink: '#44722A' },
    Gifts: { tint: '#EFF3DC', ink: '#58731C' },
    Refunds: { tint: '#E0F1ED', ink: '#28705F' },
  },
};
