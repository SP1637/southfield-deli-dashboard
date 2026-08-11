/**
 * GET /api/ads/meta?startDate=&endDate=
 *
 * Fetches Meta (Facebook/Instagram) Ads campaign performance.
 *
 * Required:
 *   Access token: META_ACCESS_TOKEN env var OR token_meta_ads cookie (from OAuth)
 *   Ad account:   META_AD_ACCOUNT_ID  (format: act_XXXXXXXXX)
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { readToken } from "@/lib/token-store";
import type { AdCampaign } from "../google/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const startDate   = searchParams.get("startDate") ?? "30daysAgo";
  const endDate     = searchParams.get("endDate")   ?? "today";

  // Token priority: OAuth cookie > env var
  const cookieToken = await readToken("meta_ads");
  const accessToken = cookieToken ?? process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "meta_ads" });
  }

  const cacheKey = buildCacheKey("ads_meta", { adAccountId, startDate, endDate });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, platform: "meta_ads" });

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

    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    // Fetch campaigns list
    const campaignsRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/campaigns?` +
      `fields=id,name,status,objective&limit=50&access_token=${accessToken}`
    );
    if (!campaignsRes.ok) throw new Error(`Meta campaigns ${campaignsRes.status}`);
    const campaignsJson = await campaignsRes.json();
    if (campaignsJson.error) throw new Error(campaignsJson.error.message);
    const campaignList: any[] = campaignsJson.data ?? [];

    if (campaignList.length === 0) {
      return NextResponse.json({ data: [], platform: "meta_ads", fetchedAt: new Date().toISOString() });
    }

    // Fetch insights for all campaigns in one batch call
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?` +
      `fields=campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,purchase_roas` +
      `&level=campaign&time_range={"since":"${start}","until":"${end}"}` +
      `&limit=50&access_token=${accessToken}`
    );
    if (!insightsRes.ok) throw new Error(`Meta insights ${insightsRes.status}`);
    const insightsJson = await insightsRes.json();
    const insights: any[] = insightsJson.data ?? [];

    // Map insights by campaign_id
    const insightMap: Record<string, any> = {};
    for (const ins of insights) insightMap[ins.campaign_id] = ins;

    const campaigns: AdCampaign[] = campaignList.map((c: any) => {
      const ins = insightMap[c.id] ?? {};
      const spend       = parseFloat(ins.spend ?? "0");
      const impressions = parseInt(ins.impressions ?? "0");
      const clicks      = parseInt(ins.clicks ?? "0");
      const convs       = (ins.actions ?? []).find((a: any) => a.action_type === "purchase")?.value ?? 0;
      const convValue   = parseFloat(
        (ins.action_values ?? []).find((a: any) => a.action_type === "purchase")?.value ?? "0"
      );

      return {
        id:       c.id,
        name:     c.name,
        platform: "meta_ads" as const,
        status:   c.status === "ACTIVE" ? "ENABLED" : c.status === "PAUSED" ? "PAUSED" : "REMOVED",
        objective: c.objective ?? "OUTCOME_TRAFFIC",
        spend,
        impressions,
        clicks,
        ctr:       impressions > 0 ? clicks / impressions : 0,
        conversions: parseFloat(String(convs)),
        conversionValue: convValue,
        roas:      spend > 0 ? convValue / spend : parseFloat(ins.purchase_roas?.[0]?.value ?? "0"),
        cpa:       parseFloat(String(convs)) > 0 ? spend / parseFloat(String(convs)) : 0,
        currency:  "USD",
      };
    });

    setCache(cacheKey, campaigns);
    return NextResponse.json({ data: campaigns, platform: "meta_ads", fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Meta Ads]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "meta_ads", error: err.message });
  }
}

function getDemoData(): AdCampaign[] {
  return [
    { id: "m1", name: "Retargeting — Website Visitors",  platform: "meta_ads", status: "ENABLED", objective: "OUTCOME_SALES",    spend: 3600,  impressions: 290000, clicks: 7540, ctr: 0.026, conversions: 412, conversionValue: 18900, roas: 5.25, cpa: 8.74,  currency: "USD" },
    { id: "m2", name: "Lookalike — Purchasers 1%",       platform: "meta_ads", status: "ENABLED", objective: "OUTCOME_SALES",    spend: 2800,  impressions: 410000, clicks: 5740, ctr: 0.014, conversions: 142, conversionValue: 7140,  roas: 2.55, cpa: 19.7,  currency: "USD" },
    { id: "m3", name: "Top of Funnel — Interest",        platform: "meta_ads", status: "ENABLED", objective: "OUTCOME_AWARENESS", spend: 1800,  impressions: 820000, clicks: 6560, ctr: 0.008, conversions: 64,  conversionValue: 2560,  roas: 1.42, cpa: 28.1,  currency: "USD" },
    { id: "m4", name: "Dynamic Product Ads",             platform: "meta_ads", status: "ENABLED", objective: "OUTCOME_SALES",    spend: 2200,  impressions: 180000, clicks: 5400, ctr: 0.030, conversions: 298, conversionValue: 14900, roas: 6.77, cpa: 7.38,  currency: "USD" },
    { id: "m5", name: "Instagram Stories — Brand",       platform: "meta_ads", status: "PAUSED",  objective: "OUTCOME_AWARENESS", spend: 620,   impressions: 340000, clicks: 2040, ctr: 0.006, conversions: 14,  conversionValue: 420,   roas: 0.68, cpa: 44.3,  currency: "USD" },
    { id: "m6", name: "Advantage+ Shopping",             platform: "meta_ads", status: "ENABLED", objective: "OUTCOME_SALES",    spend: 3100,  impressions: 240000, clicks: 7200, ctr: 0.030, conversions: 388, conversionValue: 21400, roas: 6.90, cpa: 7.99,  currency: "USD" },
  ];
}
