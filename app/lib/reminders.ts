import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';

import { listOccurrences } from '@/api/occurrences';
import { addDays, atLocalHour, dueDay, todayIso } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { getSessionStatus, subscribeSession } from '@/lib/session';
import type { OccurrenceResponse } from '@/types/api';

// Bill reminders (F-06, D-036): local notifications at 09:00, 5 days and 1 day before a month is
// due. No server sends anything; the phone schedules them from the API's list of months.
//
// iOS keeps at most 64 pending local notifications, so only a rolling window is scheduled: the
// months due in the next WINDOW_DAYS, at most MAX_PENDING reminders. Rescheduling is cancel-all
// then schedule — idempotent, so it runs freely: on app start, on return to the foreground and
// after any change to a bill, a payment or a deleted bill expense.

const HOUR = 9;
const OFFSETS = [5, 1] as const; // days before the due date
const WINDOW_DAYS = 35; // a month due on day 35 has its first reminder on day 30
const MAX_PENDING = 60; // under iOS's 64, with room to spare
const CHANNEL = 'bills';

// A reminder that arrives while SpARC is open is still shown, as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Another user may sign in on this phone next: the last user's bills must not keep ringing.
subscribeSession(() => {
  if (getSessionStatus() === 'signedOut') {
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  }
});

// Android 8+ shows nothing outside a channel, and Android 13+ shows no permission prompt until
// one exists. iOS has no channels.
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Bill reminders',
    description: '5 days and 1 day before a bill is due',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function reminderId(occurrenceId: string, daysBefore: number) {
  return `bill:${occurrenceId}:${daysBefore}`;
}

function buildReminders(months: OccurrenceResponse[], now: Date): Notifications.NotificationRequestInput[] {
  const today = todayIso();
  return months
    .filter((o) => o.status === 'pending')
    .flatMap((o) =>
      OFFSETS.map((daysBefore) => ({
        o,
        daysBefore,
        at: atLocalHour(addDays(o.dueDate, -daysBefore), HOUR),
      })),
    )
    .filter((r) => r.at > now) // a moment already gone is not scheduled
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_PENDING)
    .map(({ o, daysBefore, at }) => ({
      identifier: reminderId(o.id, daysBefore),
      content: {
        title: daysBefore === 1 ? `${o.billName} is due tomorrow` : `${o.billName} is due in ${daysBefore} days`,
        body: `${formatMoney(o.amount, o.currency)} · due ${dueDay(o.dueDate, today)}`,
        data: { billId: o.billId },
      },
      trigger: triggerAt(at),
    }));
}

// iOS turns a DATE trigger into a countdown from now (UNTimeIntervalNotificationTrigger), which
// drifts from 09:00 when the clock or time zone changes. A calendar trigger matches the wall
// clock instead. Android's DATE trigger is already a wall-clock alarm; calendar triggers are
// iOS-only.
function triggerAt(at: Date): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'ios') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: at.getFullYear(),
      month: at.getMonth() + 1,
      day: at.getDate(),
      hour: at.getHours(),
      minute: at.getMinutes(),
      repeats: false,
    };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL };
}

let running: Promise<void> | null = null;
let again = false;

/**
 * Cancels every bill reminder and schedules the window again from the API. Calls that arrive
 * while one runs fold into a single rerun. Without permission, or signed out, it only cancels.
 * Failures are swallowed: reminders are a convenience, and the next trigger tries again.
 */
export function rescheduleReminders(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      try {
        await scheduleWindow();
      } catch {
        // Offline, or the session ended mid-way: keep what is scheduled; the next trigger retries.
      }
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

async function scheduleWindow() {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted || getSessionStatus() !== 'signedIn') {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  const today = todayIso();
  const months = await listOccurrences(today, addDays(today, WINDOW_DAYS));
  if (getSessionStatus() !== 'signedIn') return; // signed out while the list loaded

  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const request of buildReminders(months, new Date())) {
    await Notifications.scheduleNotificationAsync(request);
  }
}

/** A paid month rings no more (F-06.5), even before the reschedule that follows completes. */
export async function cancelMonthReminders(occurrenceId: string) {
  await Promise.all(
    OFFSETS.map((d) => Notifications.cancelScheduledNotificationAsync(reminderId(occurrenceId, d)).catch(() => {})),
  );
}

let offeredThisSession = false;

/**
 * Asks for permission with context (F-06.3): after the user saves a bill, once per app session,
 * while the system can still ask. "Not now" leaves the system prompt unused for later.
 * Resolves once the user has answered (or at once, when there is nothing to ask), so the caller
 * can close its screen afterwards: iOS drops an alert presented while a modal is dismissing.
 */
export async function offerReminders(): Promise<void> {
  const permission = await Notifications.getPermissionsAsync().catch(() => null);
  if (!permission) return;
  if (permission.granted) {
    void rescheduleReminders();
    return;
  }
  if (!permission.canAskAgain || offeredThisSession) return;
  offeredThisSession = true;
  const turnOn = await new Promise<boolean>((resolve) =>
    Alert.alert(
      'Remind you before bills are due?',
      'SpARC can send a reminder 5 days and 1 day before each bill, at 09:00.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Turn on', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }, // Android back button
    ),
  );
  if (turnOn) await turnOnReminders().catch(() => {});
}

/** The system prompt itself; the calendar's "Turn on reminders" calls it directly. */
export async function turnOnReminders() {
  await ensureChannel();
  const result = await Notifications.requestPermissionsAsync();
  permissionListeners.forEach((listener) => listener());
  if (result.granted) await rescheduleReminders();
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let lastOpened: string | null = null;

function openBill(response: Notifications.NotificationResponse) {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  // The same tap can arrive twice on a cold start: as the last response and through the listener.
  const key = `${response.notification.request.identifier}@${response.notification.date}`;
  if (key === lastOpened) return;
  lastOpened = key;
  const billId = response.notification.request.content.data?.billId;
  if (typeof billId === 'string' && UUID.test(billId)) {
    router.push({ pathname: '/bill/[id]', params: { id: billId } });
  }
}

/**
 * Mounted once, in the root layout. While signed in: schedules on start and on every return to
 * the foreground, and opens the bill a tapped reminder is about (F-06.4) — also when the tap
 * started the app. A tap while signed out is dropped: the bill belongs to whoever was signed in.
 */
export function useBillReminders(signedIn: boolean) {
  useEffect(() => {
    if (!signedIn) return;
    void rescheduleReminders();

    const last = Notifications.getLastNotificationResponse();
    if (last) {
      Notifications.clearLastNotificationResponse();
      openBill(last);
    }
    const taps = Notifications.addNotificationResponseReceivedListener(openBill);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void rescheduleReminders();
    });
    return () => {
      taps.remove();
      foreground.remove();
    };
  }, [signedIn]);
}

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

const permissionListeners = new Set<() => void>();

/**
 * The current permission, checked again whenever the app returns to the foreground — the user
 * may have changed it in Settings meanwhile. 'denied' means the system will not ask again.
 */
export function useReminderPermission(): ReminderPermission | null {
  const [value, setValue] = useState<ReminderPermission | null>(null);
  useEffect(() => {
    let alive = true;
    const check = () => {
      Notifications.getPermissionsAsync()
        .then((p) => {
          if (alive) setValue(p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied');
        })
        .catch(() => {});
    };
    check();
    permissionListeners.add(check);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      alive = false;
      permissionListeners.delete(check);
      sub.remove();
    };
  }, []);
  return value;
}
