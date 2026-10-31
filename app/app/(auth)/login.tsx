import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View, type TextInputInstance } from 'react-native';

import { signIn } from '@/api/auth';
import { ApiError } from '@/api/client';
import { FormScreen } from '@/components/FormScreen';
import { LoginCards } from '@/components/LoginCards';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Wordmark } from '@/components/Wordmark';
import { makeStyles, type } from '@/lib/theme';

type Fields = { login?: string; password?: string };

export default function LoginScreen() {
  const styles = useStyles();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Fields>({});
  const passwordRef = useRef<TextInputInstance>(null);

  // useMutation tracks one async action — pending, error — so the screen does not juggle its own
  // flags. On success there is nothing to navigate: saving the tokens flips the session, and the
  // root layout's Stack.Protected swaps the login screen for the app.
  // gcTime 0: a settled mutation keeps its variables — the password — in memory until collected.
  const mutation = useMutation({
    mutationFn: signIn,
    gcTime: 0,
    onError: (e) => setFieldErrors(fieldsFrom(e)),
  });

  function submit() {
    const errors: Fields = {};
    if (!login.trim()) errors.login = 'Enter your username or email.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (errors.login || errors.password) return;
    mutation.mutate({ login: login.trim(), password });
  }

  // A rejected login has no field errors: the API answers one message for every cause (D-021).
  const banner = mutation.error && !hasFields(mutation.error) ? mutation.error.message : null;

  return (
    <FormScreen
      arc
      footer={
        <>
          <Button label="Log in" loadingLabel="Logging in…" loading={mutation.isPending} onPress={submit} />
          <Button label="Create an account" variant="secondary" onPress={() => router.push('/register')} />
        </>
      }
    >
      <Wordmark />
      <LoginCards />

      <Text accessibilityRole="header" style={styles.headline}>
        Know where your money goes.
      </Text>
      <Text style={styles.sub}>Log in to see this month.</Text>

      <View style={styles.form}>
        <TextField
          label="Username or email"
          value={login}
          onChangeText={setLogin}
          error={fieldErrors.login}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
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
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {banner ? <ErrorBanner message={banner} /> : null}
      </View>
    </FormScreen>
  );
}

function hasFields(error: Error) {
  return error instanceof ApiError && Object.keys(error.fieldErrors).length > 0;
}

function fieldsFrom(error: Error): Fields {
  return error instanceof ApiError ? { login: error.fieldErrors.login, password: error.fieldErrors.password } : {};
}

const useStyles = makeStyles((t) => ({
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
