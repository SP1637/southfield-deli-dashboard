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
 * Returns a GA4 Data API client that authenticates using the given access token
 * (delegated from the user's Google OAuth session).
 */
export function getGA4Client(accessToken: string): BetaAnalyticsDataClient {
  const auth = new GoogleAuth({
    // Provide an OAuth2 client with the user's token instead of a service account.
    // This lets each user query only their own GA4 properties.
  });

  const authClient = auth.fromAPIKey(""); // placeholder — overridden below
  (authClient as any).credentials = { access_token: accessToken };

  return new BetaAnalyticsDataClient({
    authClient: authClient as any,
  });
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
