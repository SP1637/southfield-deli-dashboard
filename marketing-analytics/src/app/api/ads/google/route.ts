/**
 * GET /api/ads/google?startDate=&endDate=&customerId=
 *
 * Fetches Google Ads campaign performance via the Google Ads API.
 * Uses the same service account credentials as GA4 + a developer token.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — same service account used for GA4
 *   GOOGLE_ADS_DEVELOPER_TOKEN   — from Google Ads API Center
 *   GOOGLE_ADS_CUSTOMER_ID       — 10-digit account ID (no dashes)
 *
 * OR via OAuth (if user connected Google Ads via /api/connect/google_ads):
 *   token_google_ads cookie       — stored after OAuth callback
 *   GOOGLE_ADS_DEVELOPER_TOKEN   — still required
 *   GOOGLE_ADS_CUSTOMER_ID       — still required
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { readToken } from "@/lib/token-store";

export interface AdCampaign {
  id: string;
  name: string;
  platform: "google_ads" | "meta_ads" | "tiktok_ads" | "snapchat_ads" | "linkedin_ads" | "bing_ads";
  status: "ENABLED" | "PAUSED" | "REMOVED";
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionValue: number;
  roas: number;
  cpa: number;
  currency: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const startDate  = searchParams.get("startDate") ?? "30daysAgo";
  const endDate    = searchParams.get("endDate")   ?? "today";
  const customerId = searchParams.get("customerId") ?? process.env.GOOGLE_ADS_CUSTOMER_ID;

  const devToken   = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const saJson     = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  // Try OAuth token from cookie first, fall back to service account
  const oauthToken = await readToken("google_ads");

  if ((!saJson && !oauthToken) || !devToken || !customerId) {
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "google_ads" });
  }

  const cacheKey = buildCacheKey("ads_google", { customerId, startDate, endDate });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, platform: "google_ads" });

  try {
    // Resolve relative dates
    const resolveDate = (d: string) => {
      if (d === "today") return new Date().toISOString().slice(0, 10);
      if (d.endsWith("daysAgo")) {
        const days = parseInt(d);
        const dt = new Date();
        dt.setDate(dt.getDate() - days);
        return dt.toISOString().slice(0, 10);
      }
      return d;
    };
    const start = resolveDate(startDate);
    const end   = resolveDate(endDate);

    let accessToken = oauthToken;

    if (!accessToken && saJson) {
      // Use service account to get an access token for Google Ads API
      const { google } = await import("googleapis");
      const credentials = JSON.parse(saJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/adwords"],
      });
      const client = await auth.getClient() as any;
      const tokenResponse = await client.getAccessToken();
      accessToken = tokenResponse.token;
    }

    if (!accessToken) throw new Error("No access token available");

    // Google Ads API query via REST
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;

    const cleanId = customerId.replace(/-/g, "");
    const apiRes = await fetch(
      `https://googleads.googleapis.com/v17/customers/${cleanId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": devToken,
          "Content-Type": "application/json",
          ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
            ? { "login-customer-id": process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
            : {}),
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Google Ads API ${apiRes.status}: ${errText.slice(0, 200)}`);
    }

    const json = await apiRes.json();
    const rows: any[] = json.results ?? [];

    const campaigns: AdCampaign[] = rows.map((r: any) => {
      const metrics = r.metrics ?? {};
      const spend  = (metrics.costMicros ?? 0) / 1_000_000;
      const impressions = metrics.impressions ?? 0;
      const clicks = metrics.clicks ?? 0;
      const conversions = metrics.conversions ?? 0;
      const conversionValue = metrics.conversionsValue ?? 0;

      return {
        id:       String(r.campaign?.id ?? ""),
        name:     r.campaign?.name ?? "Unknown Campaign",
        platform: "google_ads",
        status:   (r.campaign?.status ?? "ENABLED") as AdCampaign["status"],
        objective: r.campaign?.advertisingChannelType ?? "SEARCH",
        spend,
        impressions,
        clicks,
        ctr:       impressions > 0 ? clicks / impressions : 0,
        conversions,
        conversionValue,
        roas:     spend > 0 ? conversionValue / spend : 0,
        cpa:      conversions > 0 ? spend / conversions : 0,
        currency: "USD",
      };
    });

    setCache(cacheKey, campaigns);
    return NextResponse.json({ data: campaigns, platform: "google_ads", fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Google Ads]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "google_ads", error: err.message });
  }
}

function getDemoData(): AdCampaign[] {
  return [
    { id: "g1", name: "Brand Search — Exact",     platform: "google_ads", status: "ENABLED", objective: "SEARCH",   spend: 4820,  impressions: 184000, clicks: 9200, ctr: 0.050, conversions: 328, conversionValue: 21400, roas: 4.44, cpa: 14.7, currency: "USD" },
    { id: "g2", name: "Non-Brand Search — BMM",   platform: "google_ads", status: "ENABLED", objective: "SEARCH",   spend: 3200,  impressions: 142000, clicks: 6400, ctr: 0.045, conversions: 198, conversionValue: 11800, roas: 3.69, cpa: 16.2, currency: "USD" },
    { id: "g3", name: "Shopping — All Products",  platform: "google_ads", status: "ENABLED", objective: "SHOPPING", spend: 2640,  impressions: 220000, clicks: 8800, ctr: 0.040, conversions: 248, conversionValue: 13200, roas: 5.00, cpa: 10.6, currency: "USD" },
    { id: "g4", name: "Display Remarketing",      platform: "google_ads", status: "ENABLED", objective: "DISPLAY",  spend: 1480,  impressions: 680000, clicks: 4080, ctr: 0.006, conversions: 82,  conversionValue: 4100,  roas: 2.77, cpa: 18.0, currency: "USD" },
    { id: "g5", name: "Performance Max",          platform: "google_ads", status: "ENABLED", objective: "PERFORMANCE_MAX", spend: 3800, impressions: 320000, clicks: 12800, ctr: 0.040, conversions: 412, conversionValue: 24200, roas: 6.37, cpa: 9.2, currency: "USD" },
    { id: "g6", name: "YouTube Video Ads",        platform: "google_ads", status: "PAUSED",  objective: "VIDEO",    spend: 860,   impressions: 520000, clicks: 3120, ctr: 0.006, conversions: 38,  conversionValue: 1400,  roas: 1.63, cpa: 22.6, currency: "USD" },
  ];
}
