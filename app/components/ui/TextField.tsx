import { forwardRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { EyeIcon } from '@/components/icons';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  /** Password field: masked, with a show/hide button. */
  secret?: boolean;
};

// Label above, 52-high field, error below (board → foundations, "Chips · inputs").
export const TextField = forwardRef<TextInputInstance, Props>(function TextField(
  { label, error, hint, secret, onFocus, onBlur, ...input },
  ref,
) {
  const styles = useStyles();
  const { colors, scheme, shadows } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ring = error ? shadows.fieldError : focused ? shadows.fieldFocus : shadows.outline;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, { boxShadow: ring }]}>
        <TextInput
          ref={ref}
          {...input}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={secret && !revealed}
          placeholderTextColor={colors.placeholder}
          keyboardAppearance={scheme}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, secret && styles.inputWithButton]}
        />
        {secret ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.eye}
          >
            <EyeIcon color={colors.ink2} crossed={revealed} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  wrap: { gap: 6 },
  label: { ...type.label, color: t.colors.ink },
  field: {
    height: 52,
    borderRadius: radii.field,
    backgroundColor: t.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { ...type.input, flex: 1, height: '100%', paddingHorizontal: 18, color: t.colors.ink },
  inputWithButton: { paddingRight: 4 },
  eye: {
    width: 44,
    height: 44,
    marginRight: 4,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...type.errorText, color: t.colors.error },
  hint: { ...type.caption, color: t.colors.ink2 },
}));
