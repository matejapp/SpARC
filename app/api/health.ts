import { getApiBaseUrl } from '@/lib/config';

const TIMEOUT_MS = 8000;

export type HealthResult =
  | { ok: true; url: string }
  | { ok: false; url: string | null; reason: 'config' | 'unreachable' | 'timeout' | 'unhealthy'; detail: string };

// GET /health — anonymous and outside /api/v1 (D-023). 200 "Healthy" means the API is up and
// reaching the database; 503 means the API answered but the database did not.
// Returns a result instead of throwing: every outcome here is one the screen shows.
export async function checkHealth(): Promise<HealthResult> {
  let url: string;
  try {
    url = `${getApiBaseUrl()}/health`;
  } catch (e) {
    return { ok: false, url: null, reason: 'config', detail: (e as Error).message };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.ok) return { ok: true, url };
    return { ok: false, url, reason: 'unhealthy', detail: `HTTP ${response.status}` };
  } catch (e) {
    if (controller.signal.aborted) {
      return { ok: false, url, reason: 'timeout', detail: `No answer in ${TIMEOUT_MS / 1000} s` };
    }
    // React Native reports every transport failure — refused, firewalled, blocked by iOS
    // for plain HTTP — as the same TypeError, so the screen lists the usual causes.
    return { ok: false, url, reason: 'unreachable', detail: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
