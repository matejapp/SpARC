import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { BackIcon } from '@/components/icons';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

// Back button and centred title for a pushed screen (settings, transaction detail). The
// stack's native header is off app-wide so every screen matches the board.
export function ScreenHeader({ title }: { title: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={[styles.slot, styles.back]}
      >
        <BackIcon color={colors.ink} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {/* Balances the back button so the title stays centred. */}
      <View style={styles.slot} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slot: { width: 44, height: 44 },
  back: {
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.modalTitle, flex: 1, textAlign: 'center', color: t.colors.ink },
}));
