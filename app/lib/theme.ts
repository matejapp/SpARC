import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Appearance, StyleSheet } from 'react-native';

import { dark, light, type Palette, type Scheme, type Tone } from '@/lib/palettes';

// Design tokens. Colours come in two themes (lib/palettes.ts, D-033); shape, type and spacing
// are the same in both and live here as plain constants.
//
// Switching themes at runtime means a style can't be computed once at import time. Components
// read colours through useTheme(), and build their StyleSheet with makeStyles(), which makes
// one sheet per theme and hands back the one for the current theme.

export type Theme = Palette & {
  /** A category's colours; "Other …", user categories and unknown names fall back by kind. */
  categoryTone: (name: string | null, kind: 'income' | 'expense') => Tone;
};

function withHelpers(palette: Palette): Theme {
  return {
    ...palette,
    categoryTone: (name, kind) =>
      (name && palette.categoryTones[name]) ||
      (kind === 'income'
        ? { tint: palette.colors.incomeTint, ink: palette.colors.income }
        : { tint: palette.colors.tile, ink: palette.colors.ink }),
  };
}

export const themes: Record<Scheme, Theme> = { dark: withHelpers(dark), light: withHelpers(light) };

// The chosen theme is a per-device preference, not account data: kept on the phone with the
// session's store (no extra dependency; nothing secret about it). Dark is the default.
const STORAGE_KEY = 'sparc.theme';
let mode: Scheme = 'dark';
let restored = false;
const listeners = new Set<() => void>();

function publish(next: Scheme) {
  mode = next;
  // Native pieces we don't draw — alerts, the date picker, the keyboard — follow this.
  Appearance.setColorScheme(next);
  listeners.forEach((listener) => listener());
}

/** Cold start: read the saved choice before the first frame, so the app never flashes. */
export async function restoreThemeMode(): Promise<void> {
  let saved: string | null = null;
  try {
    saved = await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    // Unreadable: keep the default.
  }
  restored = true;
  publish(saved === 'light' ? 'light' : 'dark');
}

export async function setThemeMode(next: Scheme): Promise<void> {
  publish(next);
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, next);
  } catch {
    // Not saved: the app still switches; the next cold start falls back to dark.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemeMode(): Scheme {
  return useSyncExternalStore(subscribe, () => mode);
}

export function useThemeRestored(): boolean {
  return useSyncExternalStore(subscribe, () => restored);
}

export function useTheme(): Theme {
  return themes[useThemeMode()];
}

// What StyleSheet.create accepts; intersecting with it keeps 'row', 'center'… literal.
type Styles = Parameters<typeof StyleSheet.create>[0];

/**
 * A themed StyleSheet. Call at module level in place of StyleSheet.create; the returned hook
 * gives the sheet for the current theme. Each theme's sheet is built once and reused.
 */
export function makeStyles<S extends Styles>(factory: (theme: Theme) => S & Styles) {
  const sheets = new Map<Theme, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    let sheet = sheets.get(theme);
    if (!sheet) {
      sheet = StyleSheet.create(factory(theme));
      sheets.set(theme, sheet);
    }
    return sheet;
  };
}

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
