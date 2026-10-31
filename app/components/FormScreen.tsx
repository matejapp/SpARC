import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandArc } from '@/components/BrandArc';
import { makeStyles, spacing } from '@/lib/theme';

// A full-height form that stays usable with the keyboard up. React Native does not move content
// out of the keyboard's way by itself: KeyboardAvoidingView shrinks the screen by the keyboard's
// height on iOS (Android resizes the window natively, so it needs no behaviour), and the
// ScrollView lets the user reach a field the shrink pushed off screen. `footer` sits at the
// bottom, like the board's Log in / Create an account buttons. `arc` puts the logo arc behind
// the header (the auth screens; the add and edit sheets are too dense for it).
export function FormScreen({
  children,
  footer,
  topInset = true,
  arc = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  arc?: boolean;
  /** false inside an iOS modal sheet, which already starts below the status bar. */
  topInset?: boolean;
}) {
  const styles = useStyles();
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
        {arc ? <BrandArc /> : null}
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

const useStyles = makeStyles((t) => ({
  flex: { flex: 1, backgroundColor: t.colors.ground },
  content: { flexGrow: 1, paddingHorizontal: spacing.gutter },
  footer: { gap: 12, marginTop: 24 },
}));
