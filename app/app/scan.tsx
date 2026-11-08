import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { MAX_QR_TEXT_LENGTH } from '@/api/receipts';
import { ModalHeader } from '@/components/ModalHeader';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { useReceiptDraft } from '@/hooks/useReceipts';
import { formatAmount } from '@/lib/money';
import { makeStyles, radii, spacing, type, useTheme } from '@/lib/theme';
import type { ReceiptDraftResponse } from '@/types/api';

const NOT_A_RECEIPT = "This isn't a fiscal receipt code. Scan the QR code printed on the receipt.";

// Scan a fiscal receipt's QR code (F-08, D-045), opened from the add form. The camera only reads
// the code; the API decodes it and looks the receipt up, then the add form opens with the draft.
//
// Camera access is a runtime permission on both platforms. `useCameraPermissions` reads its
// state (null while it loads) and asks; once the user refuses for good, only Settings can turn
// it back on, so the screen re-reads it when the app comes back to the foreground. expo-camera
// runs in Expo Go, so this needs no development build.
export default function ScanScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const draft = useReceiptDraft();
  const [torch, setTorch] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  // The camera reports the same code many times a second; only the first one counts. A ref, not
  // state: it has to hold before the next frame's callback, without waiting for a render.
  const locked = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  function onScanned({ data }: BarcodeScanningResult) {
    if (locked.current) return;
    locked.current = true;
    if (!data || data.length > MAX_QR_TEXT_LENGTH) {
      setLocalError(NOT_A_RECEIPT);
      return;
    }
    draft.mutate(data, {
      onSuccess: (result) => router.replace({ pathname: '/add', params: draftParams(result) }),
    });
  }

  function scanAgain() {
    draft.reset();
    setLocalError(null);
    locked.current = false;
  }

  const byHand = () => router.replace('/add');
  const granted = permission?.granted === true;
  const error = localError ?? (draft.error ? scanErrorMessage(draft.error) : null);
  const scanning = granted && !cameraFailed && !draft.isPending && !error;

  return (
    <View
      style={[
        styles.screen,
        {
          // On iOS a modal is a sheet below the status bar; on Android it covers the screen.
          paddingTop: (Platform.OS === 'ios' ? 0 : insets.top) + 12,
          paddingBottom: Math.max(insets.bottom, 16) + 20,
        },
      ]}
    >
      <ModalHeader title="Scan a receipt" />

      <View style={styles.viewport}>
        {permission === null ? (
          <View style={styles.placeholder} accessibilityLabel="Checking camera access" />
        ) : !granted ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>Camera access</Text>
            <Text style={styles.messageBody}>
              {permission.canAskAgain
                ? "SpARC uses the camera to read a receipt's QR code. Nothing is photographed or kept."
                : 'Camera access is off for SpARC. Turn it on in Settings, or enter the expense by hand.'}
            </Text>
          </View>
        ) : cameraFailed ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>The camera didn't start</Text>
            <Text style={styles.messageBody}>Close this and try again, or enter the expense by hand.</Text>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch && scanning}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            // Off while a code is being read or an error is shown, so nothing fires behind it.
            onBarcodeScanned={scanning ? onScanned : undefined}
            onMountError={() => setCameraFailed(true)}
            accessibilityLabel="Camera viewfinder"
          />
        )}
      </View>

      {draft.isPending ? (
        <View style={styles.reading} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.ink2} />
          <Text style={styles.hint}>Reading the receipt…</Text>
        </View>
      ) : scanning ? (
        <Text style={styles.hint}>Point the camera at the QR code printed at the bottom of the receipt.</Text>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.flex} />

      <View style={styles.actions}>
        {permission !== null && !granted ? (
          permission.canAskAgain ? (
            <Button label="Allow camera" tall onPress={() => requestPermission()} />
          ) : (
            <Button label="Open Settings" tall onPress={() => Linking.openSettings()} />
          )
        ) : error ? (
          <Button label="Scan again" tall onPress={scanAgain} />
        ) : granted && !cameraFailed ? (
          <Button
            label={torch ? 'Light off' : 'Light on'}
            variant="secondary"
            disabled={!scanning}
            onPress={() => setTorch((on) => !on)}
          />
        ) : null}
        <Button label="Enter by hand" variant="link" onPress={byHand} />
      </View>
    </View>
  );
}

/**
 * The draft as the add form's route params, which are strings. The amount goes as the text the
 * form would show ("1.250,50"), so the form parses it like anything typed — no number crosses
 * as a float string, and the screen does no arithmetic.
 */
function draftParams(d: ReceiptDraftResponse): Record<string, string> {
  const params: Record<string, string> = {
    receipt: '1',
    amount: formatAmount(d.amount),
    occurredOn: d.occurredOn,
  };
  if (d.storeName) params.store = d.storeName;
  if (d.receiptNumber) params.receiptNumber = d.receiptNumber;
  if (d.existingTransactionId) params.existingId = d.existingTransactionId;
  return params;
}

/** The API's own words for a refused code (on `text`); otherwise the usual message. */
function scanErrorMessage(error: Error): string {
  if (error instanceof ApiError) return error.fieldErrors.text ?? error.message;
  return error.message;
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground, paddingHorizontal: spacing.gutter, gap: 16 },
  flex: { flex: 1 },
  viewport: {
    marginTop: 8,
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.card,
  },
  placeholder: { flex: 1, backgroundColor: t.colors.hairline },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 8 },
  messageTitle: { ...type.headline, color: t.colors.ink, textAlign: 'center' },
  messageBody: { ...type.body, color: t.colors.ink2, textAlign: 'center' },
  reading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  hint: { ...type.body, color: t.colors.ink2, textAlign: 'center' },
  actions: { gap: 8 },
}));
