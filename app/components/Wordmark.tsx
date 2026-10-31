import { StyleSheet, Text } from 'react-native';

import { fonts, useTheme } from '@/lib/theme';

// "SpARC" set as on the board: Sp medium, ARC extra bold (D-017).
export function Wordmark({ size = 26, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.base, { fontSize: size, letterSpacing: -0.03 * size, color: color ?? colors.ink }]}
    >
      Sp<Text style={styles.arc}>ARC</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: fonts.medium },
  arc: { fontFamily: fonts.extraBold },
});
