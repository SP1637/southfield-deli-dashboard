/**
 * GET /api/shopify?startDate=&endDate=
 *
 * Fetches Shopify orders, revenue, and product data.
 *
 * Required env vars (once credentials are added):
 *   SHOPIFY_STORE_DOMAIN   — e.g. mystore.myshopify.com
 *   SHOPIFY_ACCESS_TOKEN   — Admin API access token
 *
 * OR via OAuth (if user connected via /api/connect/shopify):
 *   access_token stored in Supabase connected_integrations
 *   metadata.shopDomain stored alongside it
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getIntegration } from "@/lib/supabase";
import { buildCacheKey, getCached, setCache } from "@/lib/ga4/client";

export interface ShopifyMetrics {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  returningCustomerRate: number;
  topProducts: { id: string; title: string; revenue: number; units: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  currency: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate") ?? "30daysAgo";
  const endDate   = searchParams.get("endDate")   ?? "today";

  // ── Resolve token + shop domain ───────────────────────────────────────────
  let accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  let shopDomain  = process.env.SHOPIFY_STORE_DOMAIN;

  // Try Supabase first (OAuth-connected user)
  try {
    if (session.user?.email) {
      const user = await getUserByEmail(session.user.email);
      if (user) {
        const integration = await getIntegration(user.id, "shopify");
        if (integration?.access_token) {
          accessToken = integration.access_token;
          shopDomain  = (integration.metadata?.shopDomain as string) ?? shopDomain;
        }
      }
    }
  } catch {}

  if (!accessToken || !shopDomain) {
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "shopify" });
  }

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

  const cacheKey = buildCacheKey("shopify", { shopDomain, start, end });
  const cached   = getCached(cacheKey);
  if (cached) return NextResponse.json({ data: cached, cached: true, platform: "shopify" });

  const domain   = shopDomain.replace(/\.myshopify\.com$/, "") + ".myshopify.com";
  const baseUrl  = `https://${domain}/admin/api/2024-01`;
  const headers  = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };

  try {
    // Fetch orders in date range
    const ordersRes = await fetch(
      `${baseUrl}/orders.json?status=any&created_at_min=${start}T00:00:00Z&created_at_max=${end}T23:59:59Z&limit=250&fields=id,created_at,total_price,customer,line_items,financial_status`,
      { headers }
    );
    if (!ordersRes.ok) throw new Error(`Shopify orders ${ordersRes.status}`);
    const { orders } = await ordersRes.json();

    // Fetch top products by revenue
    const productsRes = await fetch(
      `${baseUrl}/products.json?limit=50&fields=id,title,variants`,
      { headers }
    );
    const { products = [] } = productsRes.ok ? await productsRes.json() : {};

    // Process orders
    const paidOrders = (orders as any[]).filter(o => o.financial_status !== "refunded");
    const revenue    = paidOrders.reduce((s: number, o: any) => s + parseFloat(o.total_price ?? "0"), 0);
    const orderCount = paidOrders.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    // Returning customer rate
    const customerIds = paidOrders.map((o: any) => o.customer?.id).filter(Boolean);
    const uniqueCustomers = new Set(customerIds).size;
    const returningCustomerRate = uniqueCustomers > 0
      ? (customerIds.length - uniqueCustomers) / customerIds.length
      : 0;

    // Revenue by day
    const dayMap: Record<string, { revenue: number; orders: number }> = {};
    for (const order of paidOrders) {
      const day = (order.created_at as string).slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { revenue: 0, orders: 0 };
      dayMap[day].revenue += parseFloat(order.total_price ?? "0");
      dayMap[day].orders  += 1;
    }
    const revenueByDay = Object.entries(dayMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products by revenue
    const productRevMap: Record<string, { title: string; revenue: number; units: number }> = {};
    for (const order of paidOrders) {
      for (const item of (order.line_items ?? []) as any[]) {
        const pid = String(item.product_id);
        if (!productRevMap[pid]) productRevMap[pid] = { title: item.title ?? "Unknown", revenue: 0, units: 0 };
        productRevMap[pid].revenue += parseFloat(item.price ?? "0") * (item.quantity ?? 1);
        productRevMap[pid].units   += item.quantity ?? 1;
      }
    }
    const topProducts = Object.entries(productRevMap)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const result: ShopifyMetrics = {
      revenue, orders: orderCount, avgOrderValue, returningCustomerRate,
      topProducts, revenueByDay, currency: "GBP",
    };

    setCache(cacheKey, result);
    return NextResponse.json({ data: result, platform: "shopify", fetchedAt: new Date().toISOString() });

  } catch (err: any) {
    console.error("[Shopify]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), platform: "shopify", error: err.message });
  }
}

function getDemoData(): ShopifyMetrics {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      revenue: 4200 + Math.round(Math.random() * 3800),
      orders:  12 + Math.round(Math.random() * 18),
    };
  });
  return {
    revenue: 287450, orders: 1284, avgOrderValue: 223.9, returningCustomerRate: 0.38,
    topProducts: [
      { id: "p1", title: "Premium Bundle",      revenue: 84200, units: 320 },
      { id: "p2", title: "Starter Kit",         revenue: 62100, units: 840 },
      { id: "p3", title: "Pro Subscription",    revenue: 48400, units: 280 },
      { id: "p4", title: "Add-on Pack",         revenue: 32100, units: 520 },
      { id: "p5", title: "Enterprise License",  revenue: 28800, units: 48  },
    ],
    revenueByDay,
    currency: "GBP",
  };
}
