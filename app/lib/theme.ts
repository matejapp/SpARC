// Design tokens from D-027 and the design board. No colour value lives anywhere else:
// components import from here. Light mode only; a dark set slots in beside `colors` later.

export const colors = {
  ground: '#F6F4F2', // screen background
  surface: '#FFFFFF', // cards, inputs
  ink: '#1F1D1B', // text, primary buttons, expense amounts
  ink2: '#6F6A65', // secondary text, inactive tab
  hairline: '#ECE8E4',
  tile: '#F3EFEC', // icon tile behind an expense row
  muted: '#E4DFDA', // disabled button, skeleton
  income: '#2F7D57',
  incomeTint: '#E7F2EC',
  error: '#C0362C',
  errorTint: '#FBEAE8',
  accentText: '#B8461C', // links; never an amount
  onCard: '#FFE9DE', // small text on the orange card
  onCardPast: '#E4DED9', // small text on a charcoal card
  onInk: '#FFFFFF',
  placeholder: '#8A847E',
  dotInactive: '#D6D0CA', // inactive pager dot, outline of a quiet button
  overlay: 'rgba(31,29,27,0.08)', // pressed state on light surfaces
  onCardSkeleton: 'rgba(255,255,255,0.28)', // loading bars on the orange card
  cardChip: 'rgba(255,233,222,0.55)', // the chip on the month card
  cardChipLine: 'rgba(122,59,30,0.35)',
} as const;

// One hue per seeded category (D-032), for its row tile, icon and chip. Income categories stay
// in the green family and no expense category is green, so green still reads as "income".
// Orange stays the accent's alone. Icon on tint is ≥ 4.3:1, ink text on tint ≥ 13:1.
type Tone = { tint: string; ink: string };

const categoryTones: Record<string, Tone> = {
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

// The accent gradient appears only on the current-month card, the add button and the
// app icon (D-027). The board draws it radial from the top-right; expo-linear-gradient
// approximates that with a diagonal run from `start` to `end`.
export const gradients = {
  accent: {
    colors: ['#F7A26B', '#E5602A', '#B8461C', '#7A3B1E'],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  charcoal: {
    colors: ['#5A534E', '#3A3633', '#1F1D1B'],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
  },
  mark: ['#F28A4B', '#E5602A', '#B8461C'],
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

// React Native `boxShadow` takes the CSS syntax, so these are copied from the board as is.
export const shadows = {
  card: '0 1px 2px rgba(31,29,27,0.04), 0 8px 24px rgba(31,29,27,0.06)',
  primaryButton: '0 8px 18px -8px rgba(31,29,27,0.5)',
  addButton: '0 12px 24px -10px rgba(184,70,28,0.7)',
  outline: 'inset 0 0 0 1px #ECE8E4', // secondary buttons, chips, idle inputs
  outlineQuiet: 'inset 0 0 0 1px #DCD6D0', // "Load older"
  fieldFocus: 'inset 0 0 0 2px #1F1D1B',
  fieldError: 'inset 0 0 0 2px #C0362C',
  segmentLift: '0 1px 2px rgba(31,29,27,0.08), 0 4px 10px rgba(31,29,27,0.06)',
  monthCard: '0 20px 40px -16px rgba(184,70,28,0.55)',
  tabBar: '0 -1px 0 #ECE8E4',
  divider: 'inset 0 1px 0 #ECE8E4', // between rows in a card
} as const;

export const tabBarBackground = 'rgba(255,255,255,0.92)';

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
