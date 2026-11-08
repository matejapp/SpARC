import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { MAX_QR_TEXT_LENGTH } from '@/api/receipts';
import { ModalHeader } from '@/components/ModalHeader';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { useReceiptDraft, useReceiptPhotoDraft } from '@/hooks/useReceipts';
import { formatAmount } from '@/lib/money';
import { shrinkForUpload } from '@/lib/receiptPhoto';
import { makeStyles, radii, spacing, type, useTheme } from '@/lib/theme';
import type { ReceiptDraftResponse } from '@/types/api';

const NOT_A_RECEIPT = "This isn't a fiscal receipt code. Scan the QR code printed on the receipt.";

type Mode = 'qr' | 'photo';

// Capture a receipt (F-08, D-045, D-048), opened from the add form. First the QR code: the API
// decodes it and looks the receipt up. A receipt whose code won't read is photographed instead
// and read by OCR on the server. Either way the add form opens with the draft to review.
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
  const qrDraft = useReceiptDraft();
  const photoDraft = useReceiptPhotoDraft();
  const camera = useRef<CameraView>(null);
  const [mode, setMode] = useState<Mode>('qr');
  const [torch, setTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [capturing, setCapturing] = useState(false);
  // The photo stays in the app's private cache, shown here and uploaded; it never goes to the
  // camera roll.
  const [photo, setPhoto] = useState<string | null>(null);
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
    qrDraft.mutate(data, { onSuccess: openDraft });
  }

  async function takePhoto() {
    if (!camera.current || capturing) return;
    setCapturing(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.9, exif: false });
      setTorch(false);
      // Shrunk before it's shown, so the preview is exactly what gets uploaded.
      setPhoto(await shrinkForUpload(picture.uri, picture.width, picture.height));
    } catch {
      setLocalError("The photo couldn't be taken. Try again.");
    } finally {
      setCapturing(false);
    }
  }

  function retake() {
    photoDraft.reset();
    setLocalError(null);
    setPhoto(null);
  }

  function switchTo(next: Mode) {
    qrDraft.reset();
    photoDraft.reset();
    setLocalError(null);
    setPhoto(null);
    setTorch(false);
    locked.current = false;
    setMode(next);
  }

  function scanAgain() {
    qrDraft.reset();
    setLocalError(null);
    locked.current = false;
  }

  const openDraft = (result: ReceiptDraftResponse) =>
    router.replace({ pathname: '/add', params: draftParams(result, mode) });
  const byHand = () => router.replace('/add');

  const granted = permission?.granted === true;
  const draft = mode === 'qr' ? qrDraft : photoDraft;
  const error = localError ?? (draft.error ? scanErrorMessage(draft.error) : null);
  const live = granted && !cameraFailed && !photo;
  const scanning = mode === 'qr' && live && !qrDraft.isPending && !error;
  // A photo that can't be read (422) needs a new photo; anything else may work on a second try.
  const unreadable = photoDraft.error instanceof ApiError && photoDraft.error.status === 422;

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
      <ModalHeader title={mode === 'qr' ? 'Scan a receipt' : 'Photograph the receipt'} />

      <View style={[styles.viewport, mode === 'photo' && styles.viewportPhoto]}>
        {permission === null ? (
          <View style={styles.placeholder} accessibilityLabel="Checking camera access" />
        ) : !granted ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>Camera access</Text>
            <Text style={styles.messageBody}>
              {permission.canAskAgain
                ? "SpARC uses the camera to read a receipt. Nothing is saved to your photos."
                : 'Camera access is off for SpARC. Turn it on in Settings, or enter the expense by hand.'}
            </Text>
          </View>
        ) : cameraFailed ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>The camera didn't start</Text>
            <Text style={styles.messageBody}>Close this and try again, or enter the expense by hand.</Text>
          </View>
        ) : photo ? (
          <Image
            source={{ uri: photo }}
            resizeMode="contain"
            style={StyleSheet.absoluteFill}
            accessibilityLabel="The photo you took"
          />
        ) : (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch && live}
            barcodeScannerSettings={mode === 'qr' ? { barcodeTypes: ['qr'] } : undefined}
            // Off while a code is being read, an error is shown, or a photo is being taken.
            onBarcodeScanned={scanning ? onScanned : undefined}
            onCameraReady={() => setCameraReady(true)}
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
      ) : error ? (
        <ErrorBanner message={error} />
      ) : scanning ? (
        <Text style={styles.hint}>Point the camera at the QR code printed at the bottom of the receipt.</Text>
      ) : mode === 'photo' && live ? (
        <Text style={styles.hint}>Lay the receipt flat in good light, with all of it in the frame.</Text>
      ) : mode === 'photo' && photo ? (
        <Text style={styles.hint}>Check the total and date are sharp before you use it.</Text>
      ) : null}

      {mode === 'qr' ? <View style={styles.flex} /> : null}

      <View style={styles.actions}>
        {permission !== null && !granted ? (
          permission.canAskAgain ? (
            <Button label="Allow camera" tall onPress={() => requestPermission()} />
          ) : (
            <Button label="Open Settings" tall onPress={() => Linking.openSettings()} />
          )
        ) : cameraFailed ? null : mode === 'qr' ? (
          error ? (
            <Button label="Scan again" tall onPress={scanAgain} />
          ) : (
            <Button
              label={torch ? 'Light off' : 'Light on'}
              variant="secondary"
              disabled={!scanning}
              onPress={() => setTorch((on) => !on)}
            />
          )
        ) : photo ? (
          unreadable ? (
            <Button label="Retake" tall onPress={retake} />
          ) : (
            <>
              <Button
                label={photoDraft.isError ? 'Try again' : 'Use photo'}
                tall
                loading={photoDraft.isPending}
                loadingLabel="Reading…"
                onPress={() => photoDraft.mutate(photo, { onSuccess: openDraft })}
              />
              <Button label="Retake" variant="secondary" disabled={photoDraft.isPending} onPress={retake} />
            </>
          )
        ) : (
          <>
            <Button
              label="Take photo"
              tall
              loading={capturing}
              disabled={!cameraReady}
              onPress={takePhoto}
            />
            <Button
              label={torch ? 'Light off' : 'Light on'}
              variant="secondary"
              onPress={() => setTorch((on) => !on)}
            />
          </>
        )}
        {granted && !cameraFailed && !draft.isPending ? (
          mode === 'qr' ? (
            <Button label="No QR code? Take a photo" variant="link" onPress={() => switchTo('photo')} />
          ) : (
            <Button label="Scan the QR code instead" variant="link" onPress={() => switchTo('qr')} />
          )
        ) : null}
        <Button label="Enter by hand" variant="link" onPress={byHand} />
      </View>
    </View>
  );
}

/**
 * The draft as the add form's route params, which are strings. The amount goes as the text the
 * form would show ("1.250,50"), so the form parses it like anything typed — no number crosses
 * as a float string, and the screen does no arithmetic. A photo may leave the amount or the
 * date out; the form leaves those for the user.
 */
function draftParams(d: ReceiptDraftResponse, source: Mode): Record<string, string> {
  const params: Record<string, string> = { receipt: '1', source };
  if (d.amount !== null) params.amount = formatAmount(d.amount);
  if (d.occurredOn) params.occurredOn = d.occurredOn;
  if (d.storeName) params.store = d.storeName;
  if (d.locationName) params.location = d.locationName;
  if (d.receiptNumber) params.receiptNumber = d.receiptNumber;
  if (d.existingTransactionId) params.existingId = d.existingTransactionId;
  if (d.suggestedCategoryId) params.categoryId = d.suggestedCategoryId;
  return params;
}

/** The API's own words for a refused code or photo (on `text` / `photo`); otherwise the usual. */
function scanErrorMessage(error: Error): string {
  if (error instanceof ApiError) return error.fieldErrors.text ?? error.fieldErrors.photo ?? error.message;
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
  // A receipt is long and narrow: in photo mode the viewfinder takes the height that's left.
  viewportPhoto: { flex: 1, aspectRatio: undefined },
  placeholder: { flex: 1, backgroundColor: t.colors.hairline },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 8 },
  messageTitle: { ...type.headline, color: t.colors.ink, textAlign: 'center' },
  messageBody: { ...type.body, color: t.colors.ink2, textAlign: 'center' },
  reading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  hint: { ...type.body, color: t.colors.ink2, textAlign: 'center' },
  actions: { gap: 8 },
}));
