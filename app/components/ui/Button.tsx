import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { makeStyles, radii, type, useTheme } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'quiet' | 'link' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Shows a spinner, disables the button and announces it as busy. */
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  tall?: boolean; // 56 instead of 52: the save button at the bottom of a form
};

// Primary actions are the primary colour, never the accent. Secondary is a surface with a hairline.
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  loadingLabel,
  disabled = false,
  tall = false,
}: Props) {
  const labelColor = useLabelColor();
  const styles = useStyles();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const filled = variant === 'primary';
  const shown = loading && loadingLabel ? loadingLabel : label;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        tall && styles.tall,
        styles[variant],
        filled && inactive && styles.primaryInactive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={filled ? colors.ink2 : colors.ink} />
        ) : null}
        <Text
          style={[
            variant === 'link' || variant === 'danger' ? type.buttonSmall : type.button,
            labelColor[variant],
            filled && inactive && { color: colors.ink2 },
          ]}
        >
          {shown}
        </Text>
      </View>
    </Pressable>
  );
}

const useLabelColor = makeStyles((t) => ({
  primary: { color: t.colors.onPrimary },
  secondary: { color: t.colors.ink },
  quiet: { color: t.colors.ink },
  link: { color: t.colors.accentText },
  danger: { color: t.colors.error },
}));

const useStyles = makeStyles((t) => ({
  base: {
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tall: { height: 56 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: { backgroundColor: t.colors.primary, boxShadow: t.shadows.primaryButton },
  primaryInactive: { backgroundColor: t.colors.muted, boxShadow: 'none' },
  secondary: { backgroundColor: t.colors.surface, boxShadow: t.shadows.outline },
  quiet: { backgroundColor: 'transparent', boxShadow: t.shadows.outlineQuiet, height: 48 },
  link: { backgroundColor: 'transparent', height: 44, paddingHorizontal: 8 },
  danger: { backgroundColor: 'transparent', height: 44 },
  pressed: { opacity: 0.85 },
}));
