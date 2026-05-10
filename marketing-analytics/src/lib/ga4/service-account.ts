/**
 * Service-account helpers for GA4 API access.
 *
 * All GA4 data is fetched server-side using the service account stored in
 * GOOGLE_SERVICE_ACCOUNT_JSON. This removes the need for users to grant
 * the analytics.readonly OAuth scope, so any Google account can sign in
 * without Google app verification.
 *
 * Setup for each client:
 *   1. Give the client the service account email (getServiceAccountEmail()).
 *   2. Client adds that email as a Viewer in GA4 Admin → Property Access Management.
 *   3. Client copies their GA4 Property ID and pastes it in the dashboard.
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { JWT } from "google-auth-library";

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  [key: string]: unknown;
}

function getCredentials(): ServiceAccountCredentials {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set. " +
        "Add it in Vercel → Project → Settings → Environment Variables."
    );
  }
  try {
    return JSON.parse(json) as ServiceAccountCredentials;
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. " +
        "Paste the full contents of the service account key file."
    );
  }
}

/**
 * Returns a GA4 Data API client authenticated with the service account.
 * Use this in /api/ga4/* routes instead of the user OAuth token.
 */
export function buildGA4Client(): BetaAnalyticsDataClient {
  const credentials = getCredentials();
  return new BetaAnalyticsDataClient({ credentials });
}

/**
 * Returns a googleapis JWT auth client for the Analytics Admin API.
 * Used by /api/ga4/properties to list properties the service account can access.
 */
export function buildAdminJWT(): JWT {
  const credentials = getCredentials();
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

/**
 * Returns the service account email from the JSON env var,
 * or a placeholder message if not configured.
 */
export function getServiceAccountEmail(): string {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return "service-account@your-project.iam.gserviceaccount.com";
  try {
    return (JSON.parse(json) as ServiceAccountCredentials).client_email ?? "(unknown)";
  } catch {
    return "(invalid JSON)";
  }
}
