import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/lib/theme';

/** A form-level error, announced to screen readers (board → Login, error state). */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.errorTint, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  text: { ...type.bannerText, color: colors.error },
});
