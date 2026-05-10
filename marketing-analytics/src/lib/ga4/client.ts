/**
 * GA4 Data API client — wraps @google-analytics/data with per-request auth.
 *
 * We pass the user's OAuth access_token from NextAuth so that each API call is
 * scoped to the authenticated user's own GA4 properties.  For server-side
 * service-account scenarios swap in a JSON key file via GOOGLE_APPLICATION_CREDENTIALS.
 */
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";

/**
 * @deprecated DO NOT USE — this function is broken dead code.
 * `auth.fromAPIKey("")` creates an API-key-based auth client; manually patching
 * `.credentials` afterwards is not a supported pattern and will NOT authenticate.
 * Use `buildGA4Client()` from `service-account.ts` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getGA4Client(_accessToken: string): BetaAnalyticsDataClient {
  throw new Error(
    "getGA4Client is deprecated and broken. Use buildGA4Client() from service-account.ts"
  );
}

/**
 * In-memory cache for GA4 API responses.
 * Key = stable request fingerprint, Value = { data, expiresAt }
 *
 * For production, replace with Redis or Vercel KV for shared caching.
 */
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function buildCacheKey(endpoint: string, params: object): string {
  return `${endpoint}:${JSON.stringify(params)}`;
}
