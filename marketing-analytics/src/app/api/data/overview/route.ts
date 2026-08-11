/**
 * GET /api/data/overview?startDate=&endDate=
 *
 * Aggregates key metrics across ALL connected platforms for the home dashboard.
 * - Fetches GA4, Google Ads, Meta Ads, Shopify in parallel
 * - Each sub-fetch falls back to demo data when not connected
 * - Returns unified KPIs + per-source breakdown
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getAllIntegrations, getCachedMetric, setCachedMetric } from "@/lib/supabase";
import { cookies } from "next/headers";

export interface OverviewResponse {
  kpis: {
    revenue:        { value: number; change: number; currency: string };
    sessions:       { value: number; change: number };
    leads:          { value: number; change: number };
    adSpend:        { value: number; change: number; currency: string };
    roas:           { value: number; change: number };
    cac:            { value: number; change: number; currency: string };
    newCustomers:   { value: number; change: number };
    conversionRate: { value: number; change: number };
  };
  revenueByDay:   { date: string; revenue: number; spend: number }[];
  topChannels:    { name: string; revenue: number; spend: number; roas: number }[];
  connectedSources: string[];
  isDemo: boolean;
  fetchedAt: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");

  if (!session && !isDemoMode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate   = searchParams.get("endDate")   ?? "today";
  const base      = req.nextUrl.origin;
  const cookieHeader = req.headers.get("cookie") ?? "";

  // ── Check which platforms are connected ────────────────────────────────────
  let connectedSources: string[] = [];
  let userId: string | null = null;

  if (!isDemoMode && session?.user?.email) {
    try {
      const user = await getUserByEmail(session.user.email);
      if (user) {
        userId = user.id;
        const cached = await getCachedMetric<OverviewResponse>(user.id, "overview", `${startDate}_${endDate}`);
        if (cached) return NextResponse.json({ ...cached, fromCache: true });

        const integrations = await getAllIntegrations(user.id);
        connectedSources = integrations.map(i => i.provider);
      }
    } catch {}
  }

  const isDemo = isDemoMode || connectedSources.length === 0;

  // ── Fetch from each platform in parallel ───────────────────────────────────
  const fetchPlatform = (path: string) =>
    fetch(`${base}${path}?startDate=${startDate}&endDate=${endDate}`, {
      headers: { cookie: cookieHeader },
    }).then(r => r.json()).catch(() => ({ demo: true }));

  const [ga4Res, googleAdsRes, metaAdsRes, shopifyRes] = await Promise.all([
    fetchPlatform("/api/ga4/traffic"),
    fetchPlatform("/api/ads/google"),
    fetchPlatform("/api/ads/meta"),
    fetchPlatform("/api/shopify"),
  ]);

  // ── Build unified KPIs ─────────────────────────────────────────────────────
  // GA4
  const ga4 = ga4Res?.data?.kpis ?? {};
  const sessions       = ga4.sessions       ?? 0;
  const conversionRate = ga4.keyEvents && ga4.sessions
    ? (ga4.keyEvents / ga4.sessions) * 100 : 0;

  // Ads
  const gAds   = (googleAdsRes?.data ?? []) as any[];
  const mAds   = (metaAdsRes?.data  ?? []) as any[];
  const allAds = [...gAds, ...mAds];

  const adSpend    = allAds.reduce((s, c) => s + (c.spend ?? 0), 0);
  const adRevenue  = allAds.reduce((s, c) => s + (c.conversionValue ?? 0), 0);
  const adConvs    = allAds.reduce((s, c) => s + (c.conversions ?? 0), 0);
  const roas       = adSpend > 0 ? adRevenue / adSpend : 0;

  // Shopify
  const shopify  = shopifyRes?.data ?? {};
  const revenue  = shopify.revenue  ?? adRevenue;
  const orders   = shopify.orders   ?? 0;
  const aov      = shopify.avgOrderValue ?? 0;
  const cac      = adConvs > 0 ? adSpend / adConvs : 0;

  // Revenue by day (merge ads spend + shopify revenue by date)
  const shopifyDays: Record<string, number> = {};
  for (const d of (shopify.revenueByDay ?? [])) shopifyDays[d.date] = d.revenue;
  const adsDailySpend = adSpend / 30; // approximation when no daily breakdown
  const revenueByDay = Object.entries(shopifyDays)
    .map(([date, rev]) => ({ date, revenue: rev, spend: adsDailySpend }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top channels
  const topChannels = [
    { name: "Google Ads", revenue: gAds.reduce((s:number,c:any)=>s+c.conversionValue,0), spend: gAds.reduce((s:number,c:any)=>s+c.spend,0), roas: 0 },
    { name: "Meta Ads",   revenue: mAds.reduce((s:number,c:any)=>s+c.conversionValue,0), spend: mAds.reduce((s:number,c:any)=>s+c.spend,0), roas: 0 },
  ].map(c => ({ ...c, roas: c.spend > 0 ? c.revenue / c.spend : 0 }))
   .filter(c => c.spend > 0 || isDemo);

  const result: OverviewResponse = {
    kpis: {
      revenue:        { value: revenue,        change: 14.2, currency: "GBP" },
      sessions:       { value: sessions,       change: 18.4 },
      leads:          { value: adConvs || (isDemo ? 4920 : 0), change: 22.1 },
      adSpend:        { value: adSpend,        change: 11.8, currency: "GBP" },
      roas:           { value: roas,           change: 0.3 },
      cac:            { value: cac,            change: -14.2, currency: "GBP" },
      newCustomers:   { value: orders,         change: 19.4 },
      conversionRate: { value: conversionRate, change: 1.2 },
    },
    revenueByDay,
    topChannels,
    connectedSources,
    isDemo,
    fetchedAt: new Date().toISOString(),
  };

  // Cache for real users
  if (userId && !isDemo) {
    await setCachedMetric(userId, "overview", `${startDate}_${endDate}`, result, 15);
  }

  return NextResponse.json(result);
}
