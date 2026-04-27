/**
 * OAuth provider configuration for each data-source connector.
 * Routes /api/connect/[provider] and /api/connect/callback/[provider] use this.
 */

export type OAuthProviderId =
  | "google_ads"
  | "meta_ads"
  | "shopify"
  | "linkedin_ads"
  | "tiktok_ads"
  | "pinterest_ads";

export interface OAuthProvider {
  name: string;
  /** static URL or function that receives extra params (e.g. Shopify shop domain) */
  authUrl: string | ((extra: Record<string, string>) => string);
  /** env var name for the client/app ID */
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  /** additional query params to append to the auth URL */
  extraAuthParams?: Record<string, string>;
  /** Shopify needs a shop domain; LinkedIn uses different scope delimiter */
  scopeDelimiter?: string;
  /** set true if this provider needs a custom domain as extra input (Shopify) */
  requiresDomain?: boolean;
}

export const OAUTH_PROVIDERS: Record<OAuthProviderId, OAuthProvider> = {
  google_ads: {
    name: "Google Ads",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  meta_ads: {
    name: "Meta Ads",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    scopes: ["ads_read", "business_management"],
  },
  shopify: {
    name: "Shopify",
    authUrl: (extra) =>
      `https://${extra.shop ?? "YOUR-STORE"}.myshopify.com/admin/oauth/authorize`,
    clientIdEnv: "SHOPIFY_API_KEY",
    clientSecretEnv: "SHOPIFY_API_SECRET",
    scopes: ["read_orders", "read_products", "read_analytics", "read_customers"],
    requiresDomain: true,
  },
  linkedin_ads: {
    name: "LinkedIn Ads",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scopes: ["r_ads", "r_ads_reporting"],
  },
  tiktok_ads: {
    name: "TikTok Ads",
    authUrl: "https://business-api.tiktok.com/portal/auth",
    clientIdEnv: "TIKTOK_APP_ID",
    clientSecretEnv: "TIKTOK_APP_SECRET",
    scopes: [],
  },
  pinterest_ads: {
    name: "Pinterest Ads",
    authUrl: "https://www.pinterest.com/oauth/",
    clientIdEnv: "PINTEREST_APP_ID",
    clientSecretEnv: "PINTEREST_APP_SECRET",
    scopes: ["ads:read", "catalogs:read"],
  },
};

/** Returns undefined if the required env var is not set */
export function getClientId(providerId: OAuthProviderId): string | undefined {
  const envKey = OAUTH_PROVIDERS[providerId].clientIdEnv;
  return process.env[envKey] || undefined;
}
