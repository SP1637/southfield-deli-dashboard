/**
 * GET /api/ga4/traffic?propertyId=&startDate=&endDate=&channelGroup=&deviceCategory=
 *
 * Returns:
 *  - Traffic KPIs (total users, new users, sessions, key events)
 *  - Daily traffic time series (users + key events)
 *  - Daily traffic by channel (multi-series)
 *  - Weekly totals for last 6 months
 *  - Monthly totals for last 12 months
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { buildGA4Client } from "@/lib/ga4/service-account";
import { transformTimeSeries, transformTrafficByChannel } from "@/lib/ga4/transformers";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get("propertyId") ?? process.env.GA4_PROPERTY_ID;
  const startDate = searchParams.get("startDate") ?? "60daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  const channelGroup = searchParams.get("channelGroup") ?? undefined;
  const deviceCategory = searchParams.get("deviceCategory") ?? undefined;

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const cacheKey = buildCacheKey("traffic", { propertyId, startDate, endDate, channelGroup, deviceCategory });
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, fetchedAt: new Date().toISOString() });

  const property = `properties/${propertyId}`;
  const client = buildGA4Client();

  const filters: object[] = [];
  if (channelGroup) filters.push({ filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT" as const, value: channelGroup } } });
  if (deviceCategory) filters.push({ filter: { fieldName: "deviceCategory", stringFilter: { matchType: "EXACT" as const, value: deviceCategory } } });
  const dimensionFilter = filters.length === 1 ? filters[0] : filters.length > 1 ? { andGroup: { expressions: filters } } : undefined;

  try {
    const [kpiRes, dailyRes, channelRes, weeklyRes, monthlyRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "keyEvents" },
        ],
        ...(dimensionFilter && { dimensionFilter }),
      }),

      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }, { name: "keyEvents" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        ...(dimensionFilter && { dimensionFilter }),
      }),

      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        ...(dimensionFilter && { dimensionFilter }),
      }),

      // Weekly: last 26 weeks (6 months)
      client.runReport({
        property,
        dateRanges: [{ startDate: "26weeksAgo", endDate: "today" }],
        dimensions: [{ name: "yearWeek" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "yearWeek" } }],
        ...(dimensionFilter && { dimensionFilter }),
      }),

      // Monthly: last 12 months
      client.runReport({
        property,
        dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "yearMonth" } }],
        ...(dimensionFilter && { dimensionFilter }),
      }),
    ]);

    const kRow = kpiRes[0].rows?.[0]?.metricValues ?? [];
    const kpis = {
      totalUsers: parseFloat(kRow[0]?.value ?? "0"),
      newUsers: parseFloat(kRow[1]?.value ?? "0"),
      sessions: parseFloat(kRow[2]?.value ?? "0"),
      keyEvents: parseFloat(kRow[3]?.value ?? "0"),
    };

    const dailyTimeSeries = transformTimeSeries(dailyRes[0].rows as any ?? [], 0, 1);
    const byChannel = transformTrafficByChannel(channelRes[0].rows as any ?? []);

    const weekly = (weeklyRes[0].rows ?? []).map((r: any) => ({
      week: r.dimensionValues[0].value,
      totalUsers: parseFloat(r.metricValues[0].value),
    }));

    const monthly = (monthlyRes[0].rows ?? []).map((r: any) => ({
      month: r.dimensionValues[0].value,
      totalUsers: parseFloat(r.metricValues[0].value),
    }));

    const result = { kpis, dailyTimeSeries, byChannel, weekly, monthly };
    setCache(cacheKey, result);

    return NextResponse.json({ data: result, cached: false, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[GA4 Traffic]", err.message);
    return NextResponse.json({ error: err.message ?? "GA4 API error" }, { status: 500 });
  }
}
