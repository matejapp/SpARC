// Design tokens. No colour value lives anywhere else: components import from here.
//
// TRIAL (branch exp/midnight-palette): midnight black, electric blue and cantaloupe orange,
// replacing the D-027 light palette to see the app in it. Roles, not hues, are what the
// components name: `primary` is the action colour (electric blue), `accent` the month card and
// add button (cantaloupe), `ink` the text colour (light on midnight). Contrast: text ≥ 6.6:1 on
// its surfaces, white on primary 4.5:1, midnight on cantaloupe ≥ 5.4:1.

/** The app is dark: status bar, keyboard and native pickers follow it. */
export const scheme = 'dark' as const;

export const colors = {
  ground: '#0A0D14', // midnight: screen background
  surface: '#151A24', // cards, inputs
  ink: '#EEF1F7', // text, icons, expense amounts
  ink2: '#97A1B3', // secondary text, inactive tab
  hairline: '#222A38',
  tile: '#1B2130', // icon tile behind an uncoloured row
  muted: '#2A3242', // disabled button, skeleton
  primary: '#2E6BFF', // electric blue: primary buttons, the chosen chip, focus
  onPrimary: '#FFFFFF',
  tabActive: '#7AA2FF',
  income: '#3DD68C',
  incomeTint: '#0F2A1E',
  error: '#FF6B5E',
  errorTint: '#34161A',
  accentText: '#7AA2FF', // links, the avatar initial; never an amount
  onAccent: '#0A0D14', // text and marks on the cantaloupe card and the add button
  onCard: 'rgba(10,13,20,0.78)', // small text on the cantaloupe card
  onInk: '#FFFFFF',
  placeholder: '#6B7588',
  dotInactive: '#3A4356',
  overlay: 'rgba(255,255,255,0.08)', // pressed state on dark surfaces
  onCardSkeleton: 'rgba(10,13,20,0.14)', // loading bars on the cantaloupe card
  cardChip: 'rgba(255,255,255,0.45)', // the chip on the month card
  cardChipLine: 'rgba(10,13,20,0.35)',
  segmentTrack: '#0F131C',
  segmentThumb: '#2A3242',
} as const;

// One hue per seeded category (D-032), for its row tile, icon and chip: a deep tint with a light
// ink on midnight. Income categories stay in the green family and no expense category is green,
// so green still reads as "income". Icon on tint ≥ 6.1:1, text on tint ≥ 12.7:1.
type Tone = { tint: string; ink: string };

const categoryTones: Record<string, Tone> = {
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
};

/** A category's colours; "Other …", user categories and unknown names fall back by kind. */
export function categoryTone(name: string | null, kind: 'income' | 'expense'): Tone {
  return (
    (name && categoryTones[name]) ||
    (kind === 'income'
      ? { tint: colors.incomeTint, ink: colors.income }
      : { tint: colors.tile, ink: colors.ink })
  );
}

// The accent (cantaloupe) appears only on the current-month card, the add button and the mark.
// The second login card is electric blue. expo-linear-gradient runs diagonally from `start`
// to `end`, approximating the board's radial light from the top-right.
export const gradients = {
  accent: {
    colors: ['#FFC9A3', '#FFA177', '#F7894F', '#E8743D'],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  cardBack: {
    colors: ['#6E9BFF', '#2E6BFF', '#1A3FB8'],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  mark: ['#FFC9A3', '#FFA177', '#E8743D'],
} as const;

export const radii = {
  card: 28,
  bankCard: 20, // the month card: a payment card's corners, not a panel's (D-032)
  field: 18,
  tile: 14,
  pill: 999,
} as const;

export const spacing = {
  gutter: 20, // page side padding
  screenTop: 60, // header offset on the board's 390 × 844 frames, safe area included
} as const;

// React Native `boxShadow` takes the CSS syntax. On midnight a drop shadow barely shows, so
// surfaces separate by colour and hairlines; the coloured glows mark the two accents.
export const shadows = {
  card: 'inset 0 0 0 1px #1E2533, 0 10px 24px rgba(0,0,0,0.35)',
  primaryButton: '0 10px 22px -10px rgba(46,107,255,0.8)',
  addButton: '0 12px 26px -10px rgba(255,161,119,0.75)',
  outline: 'inset 0 0 0 1px #2A3242', // secondary buttons, idle inputs
  outlineQuiet: 'inset 0 0 0 1px #3A4356', // "Load older"
  fieldFocus: 'inset 0 0 0 2px #2E6BFF',
  fieldError: 'inset 0 0 0 2px #FF6B5E',
  segmentLift: '0 2px 8px rgba(0,0,0,0.4)',
  monthCard: '0 22px 44px -18px rgba(255,161,119,0.55)',
  tabBar: '0 -1px 0 #1E2533',
  divider: 'inset 0 1px 0 #222A38', // between rows in a card
} as const;

export const tabBarBackground = 'rgba(14,18,27,0.94)';

// Plus Jakarta Sans ships one file per weight, so each weight is its own family.
// Never pair these with `fontWeight` — iOS may fall back to the system font.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

// Type scale from the board's foundations page. letterSpacing is -0.02em in points.
export const type = {
  display: { fontFamily: fonts.extraBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.64 },
  screenTitle: { fontFamily: fonts.extraBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.48 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  modalTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  greetingName: { fontFamily: fonts.extraBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.52 },
  label: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18 },
  input: { fontFamily: fonts.medium, fontSize: 16 },
  rowTitle: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20 },
  rowAmount: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  dayHeading: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, letterSpacing: 0.78 },
  bannerText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  errorText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  amountInput: { fontFamily: fonts.extraBold, fontSize: 44, letterSpacing: -1.32 },
  chip: { fontFamily: fonts.semiBold, fontSize: 14 },
  fieldCaption: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16 },
  fieldValue: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20 },
  pill: { fontFamily: fonts.bold, fontSize: 14 },
  greetingLabel: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  cardCode: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.68 },
  cardCaption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  cardAmount: { fontFamily: fonts.extraBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  cardCurrency: { fontFamily: fonts.semiBold, fontSize: 15 },
  cardStatLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  cardStatValue: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
  avatar: { fontFamily: fonts.extraBold, fontSize: 17 },
  headline: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.semiBold, fontSize: 16 },
  buttonSmall: { fontFamily: fonts.semiBold, fontSize: 15 },
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 12 },
  tabLabelActive: { fontFamily: fonts.bold, fontSize: 12 },
} as const;

// Every amount uses tabular figures so columns line up (D-027).
export const tabularNums = { fontVariant: ['tabular-nums'] } as const;
