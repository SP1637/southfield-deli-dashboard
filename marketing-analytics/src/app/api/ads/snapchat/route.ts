/**
 * GET /api/ads/snapchat?startDate=&endDate=
 *
 * Required:
 *   SNAPCHAT_ACCESS_TOKEN or token_snapchat_ads cookie
 *   SNAPCHAT_AD_ACCOUNT_ID
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { readToken } from "@/lib/token-store";
import type { AdCampaign } from "../google/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const startDate    = searchParams.get("startDate") ?? "30daysAgo";
  const endDate      = searchParams.get("endDate")   ?? "today";

  const cookieToken  = await readToken("snapchat_ads");
  const accessToken  = cookieToken ?? process.env.SNAPCHAT_ACCESS_TOKEN;
  const adAccountId  = process.env.SNAPCHAT_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "snapchat_ads" });
  }

  const cacheKey = buildCacheKey("ads_snapchat", { adAccountId, startDate, endDate });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, platform: "snapchat_ads" });

  try {
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

    // Fetch campaigns
    const campaignsRes = await fetch(
      `https://adsapi.snapchat.com/v1/adaccounts/${adAccountId}/campaigns`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!campaignsRes.ok) throw new Error(`Snapchat campaigns ${campaignsRes.status}`);
    const campaignsJson = await campaignsRes.json();
    const campaignList: any[] = (campaignsJson.campaigns ?? []).map((c: any) => c.campaign);

    // Fetch stats per campaign
    const statsPromises = campaignList.slice(0, 20).map(async (c: any) => {
      try {
        const statsRes = await fetch(
          `https://adsapi.snapchat.com/v1/campaigns/${c.id}/stats?` +
          `granularity=TOTAL&fields=spend,impressions,swipes,conversions,purchase_value` +
          `&start_time=${start}T00:00:00Z&end_time=${end}T23:59:59Z`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!statsRes.ok) return { id: c.id, stats: {} };
        const json = await statsRes.json();
        return { id: c.id, stats: json.timeseries_stats?.[0]?.timeseries?.[0]?.stats ?? {} };
      } catch {
        return { id: c.id, stats: {} };
      }
    });

    const statsResults = await Promise.all(statsPromises);
    const statsMap: Record<string, any> = {};
    for (const r of statsResults) statsMap[r.id] = r.stats;

    const campaigns: AdCampaign[] = campaignList.map((c: any) => {
      const s = statsMap[c.id] ?? {};
      const spend       = (s.spend ?? 0) / 1_000_000; // micro-dollars
      const impressions = s.impressions ?? 0;
      const clicks      = s.swipes ?? 0;
      const conversions = s.conversions ?? 0;
      const convValue   = (s.purchase_value ?? 0) / 1_000_000;

      return {
        id:       c.id,
        name:     c.name,
        platform: "snapchat_ads" as const,
        status:   c.status === "ACTIVE" ? "ENABLED" : "PAUSED",
        objective: c.objective ?? "AWARENESS",
        spend,
        impressions,
        clicks,
        ctr:      impressions > 0 ? clicks / impressions : 0,
        conversions,
        conversionValue: convValue,
        roas:     spend > 0 ? convValue / spend : 0,
        cpa:      conversions > 0 ? spend / conversions : 0,
        currency: "USD",
      };
    });

    setCache(cacheKey, campaigns);
    return NextResponse.json({ data: campaigns, platform: "snapchat_ads", fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Snapchat Ads]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "snapchat_ads", error: err.message });
  }
}

function getDemoData(): AdCampaign[] {
  return [
    { id: "sc1", name: "Story Ads — Product Discovery",  platform: "snapchat_ads", status: "ENABLED", objective: "AWARENESS",    spend: 1200, impressions: 680000,  clicks: 8160,  ctr: 0.012, conversions: 64,  conversionValue: 2560,  roas: 2.13, cpa: 18.8, currency: "USD" },
    { id: "sc2", name: "Snap Ads — Retargeting",         platform: "snapchat_ads", status: "ENABLED", objective: "CONVERSIONS",  spend: 800,  impressions: 240000,  clicks: 4800,  ctr: 0.020, conversions: 96,  conversionValue: 4320,  roas: 5.40, cpa: 8.33, currency: "USD" },
    { id: "sc3", name: "Collection Ads — New Arrivals",  platform: "snapchat_ads", status: "PAUSED",  objective: "TRAFFIC",      spend: 640,  impressions: 420000,  clicks: 5040,  ctr: 0.012, conversions: 28,  conversionValue: 840,   roas: 1.31, cpa: 22.9, currency: "USD" },
  ];
}
