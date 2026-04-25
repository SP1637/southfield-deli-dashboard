/**
 * GET /api/ga4/countries?propertyId=&startDate=&endDate=&country=
 *
 * Returns:
 *  - KPI metrics
 *  - Funnel steps (same 5 events)
 *  - Time series (page views by day)
 *  - Country breakdown table
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { transformCountryRows, transformTimeSeries } from "@/lib/ga4/transformers";

function buildClient(accessToken: string) {
  const authClient = new GoogleAuth().fromAPIKey("") as any;
  authClient.credentials = { access_token: accessToken };
  return new BetaAnalyticsDataClient({ authClient });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get("propertyId") ?? process.env.GA4_PROPERTY_ID;
  const startDate = searchParams.get("startDate") ?? "7daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  const country = searchParams.get("country") ?? undefined;

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const cacheKey = buildCacheKey("countries", { propertyId, startDate, endDate, country });
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, fetchedAt: new Date().toISOString() });

  const property = `properties/${propertyId}`;
  const client = buildClient(accessToken);

  const countryFilter = country
    ? { filter: { fieldName: "country", stringFilter: { matchType: "EXACT" as const, value: country } } }
    : undefined;

  try {
    const [kpiRes, timeSeriesRes, countryTableRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [
          { startDate, endDate },
          { startDate: "14daysAgo", endDate: "8daysAgo" },
        ],
        metrics: [
          { name: "totalUsers" },
          { name: "transactions" },
          { name: "totalPurchasers" },
          { name: "newUsers" },
          { name: "purchaseRevenue" },
        ],
        ...(countryFilter && { dimensionFilter: countryFilter }),
      }),

      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        ...(countryFilter && { dimensionFilter: countryFilter }),
      }),

      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "country" }],
        metrics: [
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "addToCarts" },
          { name: "checkouts" },
          { name: "transactions" },
          { name: "transactions" },
          { name: "purchaseRevenue" },
        ],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: 20,
      }),
    ]);

    // Funnel totals from KPI row
    const cur = kpiRes[0].rows?.[0]?.metricValues ?? [];
    const prev = kpiRes[0].rows?.[1]?.metricValues ?? cur;
    const delta = (c: string, p: string) => (parseFloat(c) - parseFloat(p)) / (parseFloat(p) || 1);

    const kpis = {
      totalUsers: parseFloat(cur[0]?.value ?? "0"),
      purchases: parseFloat(cur[1]?.value ?? "0"),
      totalPurchasers: parseFloat(cur[2]?.value ?? "0"),
      firstTimePurchasers: parseFloat(cur[3]?.value ?? "0"),
      grossPurchaseRevenue: parseFloat(cur[4]?.value ?? "0"),
      totalUsersDelta: delta(cur[0]?.value ?? "0", prev[0]?.value ?? "1"),
      purchasesDelta: delta(cur[1]?.value ?? "0", prev[1]?.value ?? "1"),
      totalPurchasersDelta: delta(cur[2]?.value ?? "0", prev[2]?.value ?? "1"),
      firstTimePurchasersDelta: delta(cur[3]?.value ?? "0", prev[3]?.value ?? "1"),
      grossPurchaseRevenueDelta: delta(cur[4]?.value ?? "0", prev[4]?.value ?? "1"),
    };

    const timeSeries = transformTimeSeries(timeSeriesRes[0].rows as any ?? []);
    const countryRows = transformCountryRows(countryTableRes[0].rows as any ?? []);

    const result = { kpis, timeSeries, countryRows };
    setCache(cacheKey, result);

    return NextResponse.json({ data: result, cached: false, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[GA4 Countries]", err.message);
    return NextResponse.json({ error: err.message ?? "GA4 API error" }, { status: 500 });
  }
}
