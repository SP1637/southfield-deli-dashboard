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
  | "pinterest_ads"
  | "snapchat_ads"
  | "bing_ads"
  | "salesforce";

export interface OAuthProvider {
  name: string;
  /** static URL or function that receives extra params (e.g. Shopify shop domain) */
  authUrl: string | ((extra: Record<string, string>) => string);
  /** URL to exchange the authorization code for an access token */
  tokenUrl: string;
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
    tokenUrl: "https://oauth2.googleapis.com/token",
    // Use dedicated Google Ads OAuth client (separate from NextAuth login client)
    // The Ads API requires a client approved in Google Ads API Center
    clientIdEnv: "GOOGLE_ADS_CLIENT_ID",
    clientSecretEnv: "GOOGLE_ADS_CLIENT_SECRET",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  meta_ads: {
    name: "Meta Ads",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    scopes: ["ads_read", "business_management", "ads_management"],
  },
  shopify: {
    name: "Shopify",
    authUrl: (extra) =>
      `https://${extra.shop ?? "YOUR-STORE"}.myshopify.com/admin/oauth/authorize`,
    tokenUrl: "https://shopify.myshopify.com/admin/oauth/access_token",
    clientIdEnv: "SHOPIFY_API_KEY",
    clientSecretEnv: "SHOPIFY_API_SECRET",
    scopes: ["read_orders", "read_products", "read_analytics", "read_customers"],
    requiresDomain: true,
  },
  linkedin_ads: {
    name: "LinkedIn Ads",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scopes: ["r_ads", "r_ads_reporting"],
  },
  tiktok_ads: {
    name: "TikTok Ads",
    authUrl: "https://business-api.tiktok.com/portal/auth",
    tokenUrl: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    clientIdEnv: "TIKTOK_APP_ID",
    clientSecretEnv: "TIKTOK_APP_SECRET",
    scopes: [],
  },
  snapchat_ads: {
    name: "Snapchat Ads",
    authUrl: "https://accounts.snapchat.com/accounts/oauth2/auth",
    tokenUrl: "https://accounts.snapchat.com/accounts/oauth2/token",
    clientIdEnv: "SNAPCHAT_CLIENT_ID",
    clientSecretEnv: "SNAPCHAT_CLIENT_SECRET",
    scopes: ["snapchat-marketing-api"],
  },
  bing_ads: {
    name: "Microsoft / Bing Ads",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientIdEnv: "BING_CLIENT_ID",
    clientSecretEnv: "BING_CLIENT_SECRET",
    scopes: ["https://ads.microsoft.com/msads.manage", "offline_access"],
  },
  pinterest_ads: {
    name: "Pinterest Ads",
    authUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    clientIdEnv: "PINTEREST_APP_ID",
    clientSecretEnv: "PINTEREST_APP_SECRET",
    scopes: ["ads:read", "catalogs:read"],
  },
  salesforce: {
    name: "Salesforce",
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    clientIdEnv: "SALESFORCE_CLIENT_ID",
    clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
    scopes: ["api", "refresh_token"],
    extraAuthParams: { response_type: "code" },
  },
};

/** Returns undefined if the required env var is not set */
export function getClientId(providerId: OAuthProviderId): string | undefined {
  const envKey = OAUTH_PROVIDERS[providerId]?.clientIdEnv;
  return (envKey && process.env[envKey]) || undefined;
}

export function getClientSecret(providerId: OAuthProviderId): string | undefined {
  const envKey = OAUTH_PROVIDERS[providerId]?.clientSecretEnv;
  return (envKey && process.env[envKey]) || undefined;
}
