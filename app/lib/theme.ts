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
} as const;

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
  tabBar: '0 -1px 0 #ECE8E4',
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
  headline: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.semiBold, fontSize: 16 },
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 12 },
  tabLabelActive: { fontFamily: fonts.bold, fontSize: 12 },
} as const;

// Every amount uses tabular figures so columns line up (D-027).
export const tabularNums = { fontVariant: ['tabular-nums'] } as const;
