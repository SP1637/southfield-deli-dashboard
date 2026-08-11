/**
 * GET /api/ads/linkedin?startDate=&endDate=
 *
 * Required:
 *   LINKEDIN_ACCESS_TOKEN or token_linkedin_ads cookie
 *   LINKEDIN_AD_ACCOUNT_ID  (numeric account ID, without "urn:li:sponsoredAccount:")
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
  const startDate    = searchParams.get("startDate") ?? "30daysAgo";
  const endDate      = searchParams.get("endDate")   ?? "today";

  const cookieToken  = await readToken("linkedin_ads");
  const accessToken  = cookieToken ?? process.env.LINKEDIN_ACCESS_TOKEN;
  const accountId    = process.env.LINKEDIN_AD_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "linkedin_ads" });
  }

  const cacheKey = buildCacheKey("ads_linkedin", { accountId, startDate, endDate });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, platform: "linkedin_ads" });

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
    const start = resolveDate(startDate).split("-").map(Number);
    const end   = resolveDate(endDate).split("-").map(Number);

    const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

    // Fetch campaigns
    const campaignsRes = await fetch(
      `https://api.linkedin.com/v2/adCampaigns?q=search&search.account.values[0]=${accountUrn}&count=50`,
      { headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" } }
    );
    if (!campaignsRes.ok) throw new Error(`LinkedIn campaigns ${campaignsRes.status}`);
    const campaignsJson = await campaignsRes.json();
    const campaignList: any[] = campaignsJson.elements ?? [];

    // Fetch analytics
    const analyticsRes = await fetch(
      `https://api.linkedin.com/v2/adAnalytics?` +
      `q=analytics&pivot=CAMPAIGN&accounts=${accountUrn}` +
      `&dateRange.start.year=${start[0]}&dateRange.start.month=${start[1]}&dateRange.start.day=${start[2]}` +
      `&dateRange.end.year=${end[0]}&dateRange.end.month=${end[1]}&dateRange.end.day=${end[2]}` +
      `&fields=pivotValues,costInUsd,impressions,clicks,externalWebsiteConversions,externalWebsitePostClickConversions`,
      { headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" } }
    );
    if (!analyticsRes.ok) throw new Error(`LinkedIn analytics ${analyticsRes.status}`);
    const analyticsJson = await analyticsRes.json();
    const analyticsMap: Record<string, any> = {};
    for (const el of (analyticsJson.elements ?? [])) {
      const key = el.pivotValues?.[0];
      if (key) analyticsMap[key] = el;
    }

    const campaigns: AdCampaign[] = campaignList.map((c: any) => {
      const urn = c.id ?? "";
      const analytics = analyticsMap[`urn:li:sponsoredCampaign:${urn}`] ?? {};
      const spend       = parseFloat(analytics.costInUsd ?? "0");
      const impressions = analytics.impressions ?? 0;
      const clicks      = analytics.clicks ?? 0;
      const conversions = analytics.externalWebsiteConversions ?? 0;

      return {
        id:       String(urn),
        name:     c.name ?? "LinkedIn Campaign",
        platform: "linkedin_ads" as const,
        status:   c.status === "ACTIVE" ? "ENABLED" : "PAUSED",
        objective: c.objectiveType ?? "WEBSITE_TRAFFIC",
        spend,
        impressions,
        clicks,
        ctr:      impressions > 0 ? clicks / impressions : 0,
        conversions,
        conversionValue: 0, // LinkedIn doesn't report revenue value
        roas:     0,
        cpa:      conversions > 0 ? spend / conversions : 0,
        currency: "USD",
      };
    });

    setCache(cacheKey, campaigns);
    return NextResponse.json({ data: campaigns, platform: "linkedin_ads", fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[LinkedIn Ads]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "linkedin_ads", error: err.message });
  }
}

function getDemoData(): AdCampaign[] {
  return [
    { id: "li1", name: "B2B Lead Gen — Decision Makers",   platform: "linkedin_ads", status: "ENABLED", objective: "LEAD_GENERATION",  spend: 2800,  impressions: 82000,  clicks: 1640, ctr: 0.020, conversions: 48,  conversionValue: 0, roas: 0, cpa: 58.3,  currency: "USD" },
    { id: "li2", name: "Sponsored Content — Product Post", platform: "linkedin_ads", status: "ENABLED", objective: "WEBSITE_TRAFFIC",  spend: 1400,  impressions: 64000,  clicks: 1920, ctr: 0.030, conversions: 28,  conversionValue: 0, roas: 0, cpa: 50.0,  currency: "USD" },
    { id: "li3", name: "InMail — Enterprise Outreach",     platform: "linkedin_ads", status: "PAUSED",  objective: "LEAD_GENERATION",  spend: 960,   impressions: 12000,  clicks: 480,  ctr: 0.040, conversions: 18,  conversionValue: 0, roas: 0, cpa: 53.3,  currency: "USD" },
  ];
}
