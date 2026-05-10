/**
 * GET /api/ads/tiktok?startDate=&endDate=
 *
 * Required:
 *   TIKTOK_ACCESS_TOKEN or token_tiktok_ads cookie
 *   TIKTOK_ADVERTISER_ID
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

  const cookieToken  = await readToken("tiktok_ads");
  const accessToken  = cookieToken ?? process.env.TIKTOK_ACCESS_TOKEN;
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;

  if (!accessToken || !advertiserId) {
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "tiktok_ads" });
  }

  const cacheKey = buildCacheKey("ads_tiktok", { advertiserId, startDate, endDate });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, platform: "tiktok_ads" });

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

    const reportRes = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?" +
      new URLSearchParams({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_CAMPAIGN",
        dimensions: JSON.stringify(["campaign_id"]),
        metrics: JSON.stringify([
          "spend", "impressions", "clicks", "conversion", "value", "campaign_name",
          "campaign_status", "objective_type",
        ]),
        start_date: start,
        end_date: end,
        page_size: "50",
      }).toString(),
      {
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!reportRes.ok) throw new Error(`TikTok API ${reportRes.status}`);
    const json = await reportRes.json();
    if (json.code !== 0) throw new Error(json.message ?? "TikTok API error");

    const rows: any[] = json.data?.list ?? [];

    const campaigns: AdCampaign[] = rows.map((r: any) => {
      const d = r.dimensions ?? {};
      const m = r.metrics ?? {};
      const spend       = parseFloat(m.spend ?? "0");
      const conversions = parseFloat(m.conversion ?? "0");
      const convValue   = parseFloat(m.value ?? "0");
      const impressions = parseInt(m.impressions ?? "0");
      const clicks      = parseInt(m.clicks ?? "0");

      return {
        id:       d.campaign_id ?? String(Math.random()),
        name:     m.campaign_name ?? "TikTok Campaign",
        platform: "tiktok_ads" as const,
        status:   m.campaign_status === "ENABLE" ? "ENABLED" : "PAUSED",
        objective: m.objective_type ?? "TRAFFIC",
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
    return NextResponse.json({ data: campaigns, platform: "tiktok_ads", fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[TikTok Ads]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "tiktok_ads", error: err.message });
  }
}

function getDemoData(): AdCampaign[] {
  return [
    { id: "tt1", name: "Product Launch — In-Feed Ads",    platform: "tiktok_ads", status: "ENABLED", objective: "CONVERSIONS",  spend: 2400,  impressions: 1240000, clicks: 24800, ctr: 0.020, conversions: 198, conversionValue: 8900,  roas: 3.71, cpa: 12.1, currency: "USD" },
    { id: "tt2", name: "Brand Awareness — TopView",       platform: "tiktok_ads", status: "ENABLED", objective: "REACH",        spend: 3200,  impressions: 2800000, clicks: 28000, ctr: 0.010, conversions: 84,  conversionValue: 2520,  roas: 0.79, cpa: 38.1, currency: "USD" },
    { id: "tt3", name: "Retargeting — Video Viewers",     platform: "tiktok_ads", status: "ENABLED", objective: "CONVERSIONS",  spend: 1600,  impressions: 420000,  clicks: 12600, ctr: 0.030, conversions: 248, conversionValue: 12400, roas: 7.75, cpa: 6.45, currency: "USD" },
    { id: "tt4", name: "Hashtag Challenge Spark Ads",     platform: "tiktok_ads", status: "PAUSED",  objective: "ENGAGEMENT",   spend: 1800,  impressions: 1800000, clicks: 18000, ctr: 0.010, conversions: 48,  conversionValue: 1440,  roas: 0.80, cpa: 37.5, currency: "USD" },
  ];
}
