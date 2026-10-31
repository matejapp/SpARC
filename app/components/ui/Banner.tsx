import { Text, View } from 'react-native';

import { makeStyles, type } from '@/lib/theme';

/** A form-level error, announced to screen readers (board → Login, error state). */
export function ErrorBanner({ message }: { message: string }) {
  const styles = useStyles();
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  banner: { backgroundColor: t.colors.errorTint, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  text: { ...type.bannerText, color: t.colors.error },
}));
