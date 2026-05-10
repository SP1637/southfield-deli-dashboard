/**
 * GET /api/ads/status
 *
 * Returns which ad platforms are connected and how (oauth token vs env vars).
 * Used by the connect page and ads page to show real connection state.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readToken } from "@/lib/token-store";

const PLATFORM_ENV_CHECKS: Record<string, { token?: string; required: string[] }> = {
  google_ads: {
    required: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
  },
  meta_ads: {
    token: "META_ACCESS_TOKEN",
    required: ["META_AD_ACCOUNT_ID"],
  },
  tiktok_ads: {
    token: "TIKTOK_ACCESS_TOKEN",
    required: ["TIKTOK_ADVERTISER_ID"],
  },
  snapchat_ads: {
    token: "SNAPCHAT_ACCESS_TOKEN",
    required: ["SNAPCHAT_AD_ACCOUNT_ID"],
  },
  linkedin_ads: {
    token: "LINKEDIN_ACCESS_TOKEN",
    required: ["LINKEDIN_AD_ACCOUNT_ID"],
  },
  bing_ads: {
    token: "BING_ACCESS_TOKEN",
    required: ["BING_DEVELOPER_TOKEN", "BING_CUSTOMER_ID"],
  },
  google_search_console: {
    required: ["SEARCH_CONSOLE_SITE_URL", "GOOGLE_SERVICE_ACCOUNT_JSON"],
  },
  youtube: {
    required: ["YOUTUBE_CHANNEL_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"],
  },
  twitter_ads: {
    token: "TWITTER_BEARER_TOKEN",
    required: [],
  },
  salesforce: {
    token: "SALESFORCE_ACCESS_TOKEN",
    required: [],
  },
  ga4: {
    required: ["GOOGLE_SERVICE_ACCOUNT_JSON"],
  },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statuses: Record<string, {
    connected: boolean;
    method: "oauth" | "env" | "none";
    missingEnv?: string[];
  }> = {};

  for (const [platform, cfg] of Object.entries(PLATFORM_ENV_CHECKS)) {
    const oauthToken = await readToken(platform);

    const missingEnv: string[] = [];
    for (const envKey of cfg.required) {
      if (!process.env[envKey]) missingEnv.push(envKey);
    }
    const hasEnvToken = cfg.token ? !!process.env[cfg.token] : false;

    if (oauthToken) {
      statuses[platform] = { connected: true, method: "oauth" };
    } else if (hasEnvToken && missingEnv.length === 0) {
      statuses[platform] = { connected: true, method: "env" };
    } else if (missingEnv.length === 0 && cfg.required.length > 0) {
      // All required env vars set (no token var needed, e.g. GA4 service account)
      statuses[platform] = { connected: true, method: "env" };
    } else {
      statuses[platform] = {
        connected: false,
        method: "none",
        missingEnv: [...missingEnv, ...(cfg.token && !hasEnvToken && !oauthToken ? [cfg.token] : [])],
      };
    }
  }

  return NextResponse.json({ statuses });
}
