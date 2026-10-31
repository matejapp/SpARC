import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/lib/theme';

// A full-height form that stays usable with the keyboard up. React Native does not move content
// out of the keyboard's way by itself: KeyboardAvoidingView shrinks the screen by the keyboard's
// height on iOS (Android resizes the window natively, so it needs no behaviour), and the
// ScrollView lets the user reach a field the shrink pushed off screen. `footer` sits at the
// bottom, like the board's Log in / Create an account buttons.
export function FormScreen({
  children,
  footer,
  topInset = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** false inside an iOS modal sheet, which already starts below the status bar. */
  topInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: (topInset ? insets.top : 0) + 12, paddingBottom: Math.max(insets.bottom, 16) + 20 },
        ]}
        // A tap on a button while the keyboard is up should press the button, not just
        // dismiss the keyboard.
        keyboardShouldPersistTaps="handled"
      >
        {children}
        {footer ? (
          <>
            {/* Pushes the footer to the bottom when the form is shorter than the screen. */}
            <View style={styles.flex} />
            <View style={styles.footer}>{footer}</View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ground },
  content: { flexGrow: 1, paddingHorizontal: spacing.gutter },
  footer: { gap: 12, marginTop: 24 },
});
