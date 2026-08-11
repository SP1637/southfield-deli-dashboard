/**
 * GET /api/ga4/items?propertyId=&startDate=&endDate=&itemName=
 *
 * Returns:
 *  - Item-level funnel aggregates (items viewed → added → checked out → purchased)
 *  - Time series (items viewed by day)
 *  - Item table rows
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";
import { buildGA4Client } from "@/lib/ga4/service-account";
import { transformItemRows, transformTimeSeries } from "@/lib/ga4/transformers";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get("propertyId") ?? process.env.GA4_PROPERTY_ID;
  const startDate = searchParams.get("startDate") ?? "7daysAgo";
  const endDate = searchParams.get("endDate") ?? "today";
  const itemName = searchParams.get("itemName") ?? undefined;

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const cacheKey = buildCacheKey("items", { propertyId, startDate, endDate, itemName });
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, fetchedAt: new Date().toISOString() });

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({ demo: true, cached: false, fetchedAt: new Date().toISOString() });
  }

  const property = `properties/${propertyId}`;
  const client = buildGA4Client();

  const itemFilter = itemName
    ? { filter: { fieldName: "itemName", stringFilter: { matchType: "CONTAINS" as const, value: itemName } } }
    : undefined;

  try {
    const [summaryRes, timeSeriesRes, itemTableRes] = await Promise.all([
      // Aggregate totals across all items (or filtered by itemName)
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "itemsViewed" },
          { name: "itemsAddedToCart" },
          { name: "itemsCheckedOut" },
          { name: "itemsPurchased" },
          { name: "itemRevenue" },
        ],
        ...(itemFilter && { dimensionFilter: itemFilter }),
      }),

      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "itemsViewed" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        ...(itemFilter && { dimensionFilter: itemFilter }),
      }),

      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "itemName" }],
        metrics: [
          { name: "itemsViewed" },
          { name: "itemsAddedToCart" },
          { name: "itemsCheckedOut" },
          { name: "itemsPurchased" },
          { name: "itemRevenue" },
        ],
        orderBys: [{ metric: { metricName: "itemsViewed" }, desc: true }],
        limit: 25,
        ...(itemFilter && { dimensionFilter: itemFilter }),
      }),
    ]);

    const s = summaryRes[0].rows?.[0]?.metricValues ?? [];
    const viewed = parseFloat(s[0]?.value ?? "0");
    const addedToCart = parseFloat(s[1]?.value ?? "0");
    const checkedOut = parseFloat(s[2]?.value ?? "0");
    const purchased = parseFloat(s[3]?.value ?? "0");
    const revenue = parseFloat(s[4]?.value ?? "0");

    const funnelSummary = {
      itemsViewed: viewed,
      itemsAddedToCart: addedToCart,
      itemsCheckedOut: checkedOut,
      itemsPurchased: purchased,
      grossItemRevenue: revenue,
      viewsToCart: viewed > 0 ? addedToCart / viewed : 0,
      viewsToCheckout: viewed > 0 ? checkedOut / viewed : 0,
      viewsToPurchase: viewed > 0 ? purchased / viewed : 0,
      cartToCheckout: addedToCart > 0 ? checkedOut / addedToCart : 0,
      checkoutToPurchase: checkedOut > 0 ? purchased / checkedOut : 0,
    };

    const timeSeries = transformTimeSeries(timeSeriesRes[0].rows as any ?? []);
    const itemRows = transformItemRows(itemTableRes[0].rows as any ?? []);

    const result = { funnelSummary, timeSeries, itemRows };
    setCache(cacheKey, result);

    return NextResponse.json({ data: result, cached: false, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[GA4 Items]", err.message);
    return NextResponse.json({ demo: true, error: err.message, fetchedAt: new Date().toISOString() });
  }
}
