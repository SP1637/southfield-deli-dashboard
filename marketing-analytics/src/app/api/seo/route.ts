/**
 * GET /api/seo?siteUrl=&startDate=&endDate=
 *
 * Fetches Google Search Console data using the same service account
 * that powers GA4. The service account must be added as a user in
 * Search Console → Settings → Users and permissions.
 *
 * Returns: summary KPIs, top queries, top pages, device breakdown, country breakdown
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const siteUrl   = searchParams.get("siteUrl")   ?? process.env.SEARCH_CONSOLE_SITE_URL;
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate   = searchParams.get("endDate")   ?? "today";

  if (!siteUrl) {
    return NextResponse.json({ error: "siteUrl required — add SEARCH_CONSOLE_SITE_URL to env vars", demo: true, data: getDemoData() });
  }

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not configured", demo: true, data: getDemoData() });
  }

  const cacheKey = buildCacheKey("seo", { siteUrl, startDate, endDate });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, fetchedAt: new Date().toISOString() });

  try {
    const { google } = await import("googleapis");
    const credentials = JSON.parse(saJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const sc = google.searchconsole({ version: "v1", auth });

    // Convert relative dates to absolute
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

    // Run all queries in parallel
    const [queriesRes, pagesRes, devicesRes, countriesRes] = await Promise.all([
      sc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ["query"],   rowLimit: 20, dataState: "final" } }),
      sc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ["page"],    rowLimit: 15, dataState: "final" } }),
      sc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ["device"],  rowLimit: 5,  dataState: "final" } }),
      sc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ["country"], rowLimit: 10, dataState: "final" } }),
    ]);

    const mapRows = (rows: any[] | null | undefined) =>
      (rows ?? []).map((r: any) => ({
        key:         r.keys?.[0] ?? "",
        clicks:      r.clicks      ?? 0,
        impressions: r.impressions ?? 0,
        ctr:         r.ctr         ?? 0,
        position:    r.position    ?? 0,
      }));

    const queries   = mapRows(queriesRes.data.rows);
    const pages     = mapRows(pagesRes.data.rows);
    const devices   = mapRows(devicesRes.data.rows);
    const countries = mapRows(countriesRes.data.rows);

    // Summary totals
    const totals = queries.reduce(
      (acc, r) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions }),
      { clicks: 0, impressions: 0 }
    );
    const avgCtr      = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const avgPosition = queries.length > 0 ? queries.reduce((s, r) => s + r.position, 0) / queries.length : 0;

    const data = { totals: { ...totals, avgCtr, avgPosition }, queries, pages, devices, countries };
    setCache(cacheKey, data);

    return NextResponse.json({ data, cached: false, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Search Console]", err.message);
    // Return demo data on error so the page still renders
    return NextResponse.json({ data: getDemoData(), demo: true, error: err.message, fetchedAt: new Date().toISOString() });
  }
}

function getDemoData() {
  const queries = [
    { key: "marketing analytics dashboard", clicks: 1240, impressions: 18400, ctr: 0.0674, position: 3.2 },
    { key: "ga4 funnel analysis",           clicks:  890, impressions: 14200, ctr: 0.0627, position: 4.1 },
    { key: "ecommerce conversion tracking", clicks:  760, impressions: 12800, ctr: 0.0594, position: 5.3 },
    { key: "google analytics 4 dashboard",  clicks:  640, impressions: 11200, ctr: 0.0571, position: 6.8 },
    { key: "marketing attribution model",   clicks:  520, impressions:  9600, ctr: 0.0542, position: 7.4 },
    { key: "kpi tracking software",         clicks:  480, impressions:  8800, ctr: 0.0545, position: 8.1 },
    { key: "sales funnel dashboard",        clicks:  420, impressions:  8200, ctr: 0.0512, position: 9.2 },
    { key: "marketing intelligence tool",   clicks:  380, impressions:  7400, ctr: 0.0514, position: 10.5 },
    { key: "ga4 ecommerce report",          clicks:  310, impressions:  6800, ctr: 0.0456, position: 12.3 },
    { key: "campaign roi dashboard",        clicks:  280, impressions:  6200, ctr: 0.0452, position: 13.8 },
  ];
  const pages = [
    { key: "/overview",     clicks: 2840, impressions: 42000, ctr: 0.0676, position: 4.2 },
    { key: "/funnel",       clicks: 1620, impressions: 28000, ctr: 0.0579, position: 5.8 },
    { key: "/attribution",  clicks: 1240, impressions: 22000, ctr: 0.0564, position: 6.4 },
    { key: "/traffic",      clicks:  980, impressions: 18000, ctr: 0.0544, position: 7.1 },
    { key: "/",             clicks:  860, impressions: 15000, ctr: 0.0573, position: 5.2 },
  ];
  const devices = [
    { key: "DESKTOP", clicks: 4820, impressions: 68000, ctr: 0.0709, position: 6.2 },
    { key: "MOBILE",  clicks: 2140, impressions: 34000, ctr: 0.0629, position: 7.8 },
    { key: "TABLET",  clicks:  360, impressions:  5600, ctr: 0.0643, position: 7.1 },
  ];
  const countries = [
    { key: "gbr", clicks: 3200, impressions: 42000, ctr: 0.0762, position: 5.4 },
    { key: "usa", clicks: 2100, impressions: 30000, ctr: 0.0700, position: 6.1 },
    { key: "ind", clicks:  640, impressions: 10000, ctr: 0.0640, position: 8.2 },
    { key: "can", clicks:  480, impressions:  7200, ctr: 0.0667, position: 7.3 },
    { key: "aus", clicks:  380, impressions:  5800, ctr: 0.0655, position: 7.8 },
  ];
  const totals = { clicks: 7320, impressions: 107600, avgCtr: 0.068, avgPosition: 6.8 };
  return { totals, queries, pages, devices, countries };
}
