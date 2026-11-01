import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

// Close button and centred title for a modal form (board → Add transaction, Add bill).
export function ModalHeader({ title }: { title: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.close}
      >
        <CloseIcon color={colors.ink} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {/* Balances the close button so the title stays centred. */}
      <View style={styles.spacer} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: t.shadows.card,
  },
  heading: { ...type.modalTitle, color: t.colors.ink },
  spacer: { width: 48 },
}));
