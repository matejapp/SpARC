import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, Text, View, type TextInputInstance } from 'react-native';

import { register, signIn } from '@/api/auth';
import { ApiError } from '@/api/client';
import { FormScreen } from '@/components/FormScreen';
import { BackIcon } from '@/components/icons';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';
import type { RegisterRequest } from '@/types/api';

type Fields = { username?: string; email?: string; password?: string };

// Mirrors the API's rules (RegisterRequest) so most mistakes are caught before a round trip.
// The API stays the authority: its field errors land on the same fields.
const USERNAME = /^[A-Za-z0-9\-._+]{3,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(username: string, email: string, password: string): Fields {
  const errors: Fields = {};
  if (!USERNAME.test(username)) {
    errors.username = '3 to 32 characters: letters, digits and - . _ +';
  }
  if (!EMAIL.test(email) || email.length > 256) errors.email = 'Enter a valid email address.';
  if (password.length < 10) errors.password = 'At least 10 characters.';
  else if (password.length > 128) errors.password = 'At most 128 characters.';
  return errors;
}

// Derived from Login (the board draws no register screen): same fields, same buttons.
export default function RegisterScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Fields>({});
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const mutation = useMutation({
    gcTime: 0, // drop the password with the settled mutation
    mutationFn: async (request: RegisterRequest) => {
      await register(request);
      // Registration issues no tokens (D-020), so sign in with what was just typed.
      try {
        await signIn({ login: request.username, password: request.password });
      } catch {
        Alert.alert('Account created', 'Log in with your new account to continue.');
        router.replace('/login');
      }
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        const { username: u, email: m, password: p } = e.fieldErrors;
        setFieldErrors({ username: u, email: m, password: p });
      }
    },
  });

  function submit() {
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();
    const errors = validate(trimmedUser, trimmedEmail, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    // RSD until multi-currency lands; the preferred currency only changes how totals display.
    mutation.mutate({ username: trimmedUser, email: trimmedEmail, password, preferredCurrency: 'RSD' });
  }

  const error = mutation.error;
  const banner =
    error && !(error instanceof ApiError && Object.keys(error.fieldErrors).length) ? error.message : null;

  return (
    <FormScreen
      arc
      footer={
        <>
          <Button
            label="Create account"
            loadingLabel="Creating account…"
            loading={mutation.isPending}
            onPress={submit}
          />
          <Button label="I already have an account" variant="link" onPress={() => router.back()} />
        </>
      }
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to log in"
        hitSlop={8}
        style={styles.back}
      >
        <BackIcon color={colors.ink} />
      </Pressable>

      <Text accessibilityRole="header" style={styles.headline}>
        Create an account
      </Text>
      <Text style={styles.sub}>Track this month from the first expense.</Text>

      <View style={styles.form}>
        <TextField
          label="Username"
          value={username}
          onChangeText={setUsername}
          error={fieldErrors.username}
          hint="Letters, digits and - . _ +"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          textContentType="username"
          maxLength={32}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          maxLength={256}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={passwordRef}
          label="Password"
          secret
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          hint="At least 10 characters."
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={128}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {banner ? <ErrorBanner message={banner} /> : null}
      </View>
    </FormScreen>
  );
}

const useStyles = makeStyles((t) => ({
  back: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    ...type.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: t.colors.ink,
    marginTop: 20,
  },
  sub: { ...type.body, color: t.colors.ink2, marginTop: 8 },
  form: { gap: 14, marginTop: 24 },
}));
