/**
 * GET /api/ads?startDate=&endDate=&platforms=google_ads,meta_ads,...
 *
 * Aggregates campaign data from all configured ad platforms in parallel.
 * Returns a unified campaign list, per-platform summaries, and blended KPIs.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AdCampaign } from "./google/route";

const PLATFORM_ROUTES: Record<string, string> = {
  google_ads:   "/api/ads/google",
  meta_ads:     "/api/ads/meta",
  tiktok_ads:   "/api/ads/tiktok",
  snapchat_ads: "/api/ads/snapchat",
  linkedin_ads: "/api/ads/linkedin",
};

export interface AdsResponse {
  campaigns: AdCampaign[];
  platforms: Record<string, { connected: boolean; demo: boolean; campaignCount: number; spend: number; revenue: number }>;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
    cpa: number;
    blendedCtr: number;
  };
  fetchedAt: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate   = searchParams.get("endDate")   ?? "today";
  // Use the request's own origin for internal fetches — do NOT rely on NEXTAUTH_URL
  // which may be the prod URL while this request comes from a preview deployment.
  const base = req.nextUrl.origin;

  // Optional platform filter
  const platformFilter = searchParams.get("platforms")?.split(",").filter(Boolean) ?? Object.keys(PLATFORM_ROUTES);

  // Fetch from each platform in parallel
  const platformResults = await Promise.allSettled(
    platformFilter.map(async (platform) => {
      const route = PLATFORM_ROUTES[platform];
      if (!route) return { platform, data: [], demo: true };

      const url = `${base}${route}?startDate=${startDate}&endDate=${endDate}`;
      // Pass auth cookies through
      const cookieHeader = req.headers.get("cookie") ?? "";
      const res = await fetch(url, {
        headers: { cookie: cookieHeader },
      });
      const json = await res.json();
      return {
        platform,
        data:  (json.data ?? []) as AdCampaign[],
        demo:  json.demo ?? false,
      };
    })
  );

  const allCampaigns: AdCampaign[] = [];
  const platformSummaries: AdsResponse["platforms"] = {};

  for (const result of platformResults) {
    if (result.status === "rejected") continue;
    const { platform, data, demo } = result.value;
    allCampaigns.push(...data);

    const pSpend   = data.reduce((s, c) => s + c.spend, 0);
    const pRevenue = data.reduce((s, c) => s + c.conversionValue, 0);

    platformSummaries[platform] = {
      connected:     !demo,
      demo,
      campaignCount: data.length,
      spend:         pSpend,
      revenue:       pRevenue,
    };
  }

  // Calculate blended totals
  const totals = allCampaigns.reduce(
    (acc, c) => ({
      spend:       acc.spend       + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks:      acc.clicks      + c.clicks,
      conversions: acc.conversions + c.conversions,
      revenue:     acc.revenue     + c.conversionValue,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  );

  const roas  = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const cpa   = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
  const blendedCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

  const response: AdsResponse = {
    campaigns: allCampaigns,
    platforms: platformSummaries,
    totals: { ...totals, roas, cpa, blendedCtr },
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
