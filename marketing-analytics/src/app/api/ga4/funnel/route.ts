/**
 * GET /api/ga4/funnel?propertyId=&startDate=&endDate=&campaign=&sourceMedium=
 *
 * Builds the funnel from five separate event-count runReport calls (one per step).
 * This avoids the alpha-only runFunnelReport constraint and works with any GA4 property.
 *
 * Returns: kpis, funnelSteps, timeSeries, channelRows, donut
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { buildGA4Client } from "@/lib/ga4/service-account";
import { transformChannelRows, transformTimeSeries } from "@/lib/ga4/transformers";

/** Build a GA4 dimensionFilter for a single event name */
function eventFilter(eventName: string) {
  return {
    filter: {
      fieldName: "eventName",
      stringFilter: { matchType: "EXACT" as const, value: eventName },
    },
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get("propertyId") ?? process.env.GA4_PROPERTY_ID;
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  const campaign = searchParams.get("campaign") ?? undefined;
  const sourceMedium = searchParams.get("sourceMedium") ?? undefined;

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const cacheKey = buildCacheKey("funnel", { propertyId, startDate, endDate, campaign, sourceMedium });
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, fetchedAt: new Date().toISOString() });

  const property = `properties/${propertyId}`;
  const client = buildGA4Client();
  const dateRanges = [{ startDate, endDate }];

  // Build optional session-level filters
  const sessionFilters: object[] = [];
  if (campaign) {
    sessionFilters.push({
      filter: { fieldName: "sessionCampaignName", stringFilter: { matchType: "CONTAINS" as const, value: campaign } },
    });
  }
  if (sourceMedium) {
    sessionFilters.push({
      filter: { fieldName: "sessionSourceMedium", stringFilter: { matchType: "CONTAINS" as const, value: sourceMedium } },
    });
  }

  // The funnel filter must AND session-level conditions with the event condition.
  // We handle this by applying the session filter on the channel table query,
  // and computing funnel step counts from individual event totals.
  const sessionFilter =
    sessionFilters.length === 1
      ? sessionFilters[0]
      : sessionFilters.length > 1
      ? { andGroup: { expressions: sessionFilters } }
      : undefined;

  const FUNNEL_EVENTS = [
    "page_view",
    "add_to_cart",
    "begin_checkout",
    "add_payment_info",
    "purchase",
  ] as const;

  const FUNNEL_LABELS = ["Page Views", "Adds to Cart", "Checkouts", "Payment Info", "Purchases"];

  try {
    // Run all queries in parallel for performance
    const [kpiRes, ...funnelEventResults] = await Promise.all([
      // ── KPI summary (current + comparison period) ────────────────────────
      client.runReport({
        property,
        dateRanges: [
          { startDate, endDate },
          {
            startDate: startDate === "30daysAgo" ? "60daysAgo" : `${startDate}+30d`,
            endDate: startDate === "30daysAgo" ? "31daysAgo" : startDate,
          },
        ],
        dimensions: [{ name: "dateRange" }],
        metrics: [
          { name: "totalUsers" },
          { name: "transactions" },
          { name: "totalPurchasers" },
          { name: "newUsers" },
          { name: "purchaseRevenue" },
        ],
        ...(sessionFilter ? { dimensionFilter: sessionFilter } : {}),
      } as any),

      // ── One report per funnel event (active users who triggered the event) ─
      ...FUNNEL_EVENTS.map((eventName) =>
        client.runReport({
          property,
          dateRanges,
          metrics: [{ name: "activeUsers" }],
          dimensionFilter: sessionFilter
            ? { andGroup: { expressions: [eventFilter(eventName), sessionFilter] } }
            : eventFilter(eventName),
        } as any)
      ),
    ]);

    // ── Also run time series + channel in parallel ────────────────────────
    const [timeSeriesRes, channelRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }, { name: "purchaseRevenue" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        ...(sessionFilter ? { dimensionFilter: sessionFilter } : {}),
      } as any),

      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "addToCarts" },
          { name: "checkouts" },
          { name: "transactions" },
          { name: "purchaseRevenue" },
        ],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: 20,
        ...(sessionFilter ? { dimensionFilter: sessionFilter } : {}),
      } as any),
    ]);

    // ── Extract KPIs ────────────────────────────────────────────────────────
    const kpiRows = (kpiRes as any)[0]?.rows ?? [];
    const kpiCurrent = kpiRows.find((r: any) => r.dimensionValues?.[0]?.value === "date_range_0")?.metricValues ?? kpiRows[0]?.metricValues ?? [];
    const kpiPrev = kpiRows.find((r: any) => r.dimensionValues?.[0]?.value === "date_range_1")?.metricValues ?? kpiRows[1]?.metricValues ?? kpiCurrent;

    const delta = (cur: any, prev: any) => {
      const c = parseFloat(cur?.value ?? "0");
      const p = parseFloat(prev?.value ?? "1") || 1;
      return (c - p) / p;
    };

    const kpis = {
      totalUsers: parseFloat(kpiCurrent[0]?.value ?? "0"),
      purchases: parseFloat(kpiCurrent[1]?.value ?? "0"),
      totalPurchasers: parseFloat(kpiCurrent[2]?.value ?? "0"),
      firstTimePurchasers: parseFloat(kpiCurrent[3]?.value ?? "0"),
      grossPurchaseRevenue: parseFloat(kpiCurrent[4]?.value ?? "0"),
      totalUsersDelta: delta(kpiCurrent[0], kpiPrev[0]),
      purchasesDelta: delta(kpiCurrent[1], kpiPrev[1]),
      totalPurchasersDelta: delta(kpiCurrent[2], kpiPrev[2]),
      firstTimePurchasersDelta: delta(kpiCurrent[3], kpiPrev[3]),
      grossPurchaseRevenueDelta: delta(kpiCurrent[4], kpiPrev[4]),
    };

    // ── Build funnel steps from event-count results ──────────────────────
    const stepValues = funnelEventResults.map(
      (r: any) => parseFloat(r[0]?.rows?.[0]?.metricValues?.[0]?.value ?? "0")
    );
    const top = stepValues[0] || 1;
    const funnelSteps = stepValues.map((value, i) => ({
      name: FUNNEL_LABELS[i],
      eventName: FUNNEL_EVENTS[i],
      value,
      rateFromTop: value / top,
      rateFromPrev: i === 0 ? null : value / (stepValues[i - 1] || 1),
    }));

    // ── Time series & channel rows ────────────────────────────────────────
    // value = totalUsers, value2 = purchaseRevenue (used by overview revenue chart)
    const timeSeries = transformTimeSeries((timeSeriesRes as any)[0]?.rows ?? [], 0, 1);
    const channelRows = transformChannelRows((channelRes as any)[0]?.rows ?? []);

    const donut = channelRows.slice(0, 9).map((r) => ({
      name: r.sourceMedium,
      value: r.purchases,
    }));

    const result = { kpis, funnelSteps, timeSeries, channelRows, donut };
    setCache(cacheKey, result);

    return NextResponse.json({ data: result, cached: false, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[GA4 Funnel]", err.message);
    return NextResponse.json({ error: err.message ?? "GA4 API error" }, { status: 500 });
  }
}
