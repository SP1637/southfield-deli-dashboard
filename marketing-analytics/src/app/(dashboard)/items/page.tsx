"use client";

import { useState } from "react";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { subDays } from "date-fns";
import { Share2, TrendingUp, TrendingDown, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { useGA4Items } from "@/hooks/use-ga4-items";
import { toGA4DateString, formatCompact, formatPercent, formatCurrency } from "@/lib/utils";
import { DEMO_ITEM_FUNNEL, DEMO_ITEM_TIMESERIES, DEMO_ITEM_ROWS } from "@/lib/demo-data";
import type { ItemRow } from "@/types";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Column definitions ────────────────────────────────────────────────────────

const ITEM_COLUMNS: Column<ItemRow>[] = [
  { key: "itemName",          label: "Item Name",       format: "string",   sortable: false },
  { key: "itemsViewed",       label: "Items Viewed",    format: "number" },
  { key: "itemsAddedToCart",  label: "Added to Cart",   format: "number" },
  { key: "itemsCheckedOut",   label: "Checked Out",     format: "number" },
  { key: "itemsPurchased",    label: "Purchased",       format: "number" },
  { key: "grossItemRevenue",  label: "Revenue",         format: "currency" },
];

const STEP_COLORS = ["bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-pink-500"];
const BAR_MAX_H = 140;

const REVENUE_BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#f97316", "#eab308",
  "#22c55e", "#14b8a6",
];

// ── Trend demo data ───────────────────────────────────────────────────────────

const TRENDING_UP = [
  { name: "Artisan Sourdough Loaf",   viewsLast7: 3820, viewsPrev7: 2940, delta: 0.30 },
  { name: "Cold Brew Coffee (32oz)",   viewsLast7: 2610, viewsPrev7: 1980, delta: 0.32 },
  { name: "Avocado Toast Kit",         viewsLast7: 1940, viewsPrev7: 1420, delta: 0.37 },
  { name: "Smoked Salmon Platter",     viewsLast7: 1280, viewsPrev7: 940,  delta: 0.36 },
];

const TRENDING_DOWN = [
  { name: "Classic Rye Bread",         viewsLast7: 880,  viewsPrev7: 1340, delta: -0.34 },
  { name: "Drip Coffee Bag (12oz)",    viewsLast7: 540,  viewsPrev7: 820,  delta: -0.34 },
  { name: "Plain Croissant",           viewsLast7: 710,  viewsPrev7: 960,  delta: -0.26 },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useGA4Property();
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("funnel");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 6)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Items({ ...filters, propertyId });
  const f          = ga4.data?.data.funnelSummary ?? DEMO_ITEM_FUNNEL;
  const timeSeries = ga4.data?.data.timeSeries    ?? DEMO_ITEM_TIMESERIES;
  const itemRows   = ga4.data?.data.itemRows      ?? DEMO_ITEM_ROWS;
  const loading    = ga4.isLoading && !!session;

  // ── Funnel steps ──────────────────────────────────────────────────────────

  const steps = [
    { name: "Items Viewed",    value: f.itemsViewed,       rate: 1,                  rateFromPrev: null },
    { name: "Added to Cart",   value: f.itemsAddedToCart,  rate: f.viewsToCart,       rateFromPrev: f.viewsToCart },
    { name: "Checked Out",     value: f.itemsCheckedOut,   rate: f.viewsToCheckout,   rateFromPrev: f.cartToCheckout },
    { name: "Purchased",       value: f.itemsPurchased,    rate: f.viewsToPurchase,   rateFromPrev: f.checkoutToPurchase },
  ];
  const topValue = steps[0].value || 1;

  // ── Top Items calculations ────────────────────────────────────────────────

  const enrichedRows = itemRows.map((row) => ({
    ...row,
    convRate:     row.itemsViewed > 0 ? row.itemsPurchased    / row.itemsViewed : 0,
    cartRate:     row.itemsViewed > 0 ? row.itemsAddedToCart  / row.itemsViewed : 0,
    checkoutRate: row.itemsViewed > 0 ? row.itemsCheckedOut   / row.itemsViewed : 0,
    revenuePerView: row.itemsViewed > 0 ? row.grossItemRevenue / row.itemsViewed : 0,
  }));

  const top10ByRevenue = [...enrichedRows]
    .sort((a, b) => b.grossItemRevenue - a.grossItemRevenue)
    .slice(0, 10);

  const revenueBarData = top10ByRevenue.map((r) => ({
    name: r.itemName.length > 18 ? r.itemName.slice(0, 16) + "…" : r.itemName,
    fullName: r.itemName,
    revenue: r.grossItemRevenue,
  }));

  // ── Revenue Analysis ──────────────────────────────────────────────────────

  const totalRevenue   = itemRows.reduce((s, r) => s + r.grossItemRevenue, 0);
  const avgItemRevenue = itemRows.length > 0 ? totalRevenue / itemRows.length : 0;
  const totalPurchases = itemRows.reduce((s, r) => s + r.itemsPurchased, 0);
  const avgOrderValue  = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
  const bestSeller     = [...itemRows].sort((a, b) => b.grossItemRevenue - a.grossItemRevenue)[0];

  const starItems = top10ByRevenue.slice(0, 3).map((item, i) => ({
    ...item,
    insight: i === 0
      ? `Top earner — drives ${formatPercent(item.grossItemRevenue / totalRevenue)} of total revenue.`
      : i === 1
      ? `Strong performer with ${formatPercent(item.convRate)} purchase conversion.`
      : `High cart rate (${formatPercent(item.cartRate)}) — worth featuring in promotions.`,
  }));

  return (
    <>
      <PageHeader
        title="Sales by Item"
        tabs={[
          { key: "funnel",   label: "Funnel" },
          { key: "top",      label: "Top Items" },
          { key: "revenue",  label: "Revenue Analysis" },
          { key: "trends",   label: "Item Trends" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        }
      />
      <PageContent>

        <FilterBar filters={filters} onChange={setFilters} show={[]} />

        {/* ── TAB: Funnel ─────────────────────────────────────────────────── */}
        {activeTab === "funnel" && (
          <>
            <div className="rounded-lg border bg-card p-6">
              <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Funnel</p>

              <div className="flex items-end">
                {steps.map((step, i) => {
                  const barH = Math.max(Math.round((step.value / topValue) * BAR_MAX_H), 8);
                  return (
                    <div key={step.name} className="flex flex-1 items-end">
                      <div className="flex flex-1 flex-col items-center">
                        <span className="mb-1.5 text-sm font-bold tabular-nums">{formatCompact(step.value)}</span>
                        <div className={`w-full rounded-t-sm ${STEP_COLORS[i]}`} style={{ height: `${barH}px` }} />
                        <p className="mt-2 text-center text-xs font-medium leading-tight px-1">{step.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-indigo-600">{formatPercent(step.rate)}</p>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex w-8 shrink-0 flex-col items-center pb-[52px]">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {step.rateFromPrev !== null ? formatPercent(step.rateFromPrev, 0) : ""}
                          </span>
                          <svg width="16" height="10" viewBox="0 0 16 10" className="text-muted-foreground/50 mt-0.5">
                            <path d="M0 5 H12 M8 1 L14 5 L8 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="ml-6 flex flex-col items-center justify-end pb-[52px]">
                  <p className="text-xs text-muted-foreground">Gross item revenue</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(f.grossItemRevenue)}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3">
                {[
                  { label: "Views → Cart",     rate: f.viewsToCart },
                  { label: "Views → Checkout", rate: f.viewsToCheckout },
                  { label: "Views → Purchase", rate: f.viewsToPurchase },
                ].map((c) => (
                  <div key={c.label} className="text-center">
                    <p className="text-[10px] text-muted-foreground">{c.label}</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums">{formatPercent(c.rate)}</p>
                  </div>
                ))}
              </div>
            </div>

            <TimeSeriesChart title="Dynamics — Items Viewed" data={timeSeries} color="#f59e0b" loading={loading} />

            <DataTable<ItemRow>
              title="Item Performance"
              columns={ITEM_COLUMNS}
              rows={itemRows}
              defaultSortKey="itemsViewed"
              loading={loading}
            />
          </>
        )}

        {/* ── TAB: Top Items ───────────────────────────────────────────────── */}
        {activeTab === "top" && (
          <>
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold">Top 10 Items by Revenue</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueBarData} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number, _: string, entry: { payload?: { fullName?: string } }) => [
                      formatCurrency(v),
                      entry.payload?.fullName ?? "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {revenueBarData.map((_, idx) => (
                      <Cell key={idx} fill={REVENUE_BAR_COLORS[idx % REVENUE_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="text-sm font-semibold">Item Performance — Extended Metrics</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Item Name</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Viewed</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Conv. Rate</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cart Rate</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Checkout Rate</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Rev / View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedRows
                      .sort((a, b) => b.grossItemRevenue - a.grossItemRevenue)
                      .map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-medium max-w-[200px] truncate">{row.itemName}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums">{formatCompact(row.itemsViewed)}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums font-semibold">{formatCurrency(row.grossItemRevenue)}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums">
                            <span className={row.convRate >= 0.05 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                              {formatPercent(row.convRate)}
                            </span>
                          </td>
                          <td className="text-right px-4 py-2.5 tabular-nums">{formatPercent(row.cartRate)}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums">{formatPercent(row.checkoutRate)}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums text-indigo-600 font-medium">
                            {formatCurrency(row.revenuePerView)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Revenue Analysis ────────────────────────────────────────── */}
        {activeTab === "revenue" && (
          <>
            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Revenue",       value: formatCurrency(totalRevenue),   sub: "Last 7 days" },
                { label: "Avg Revenue / Item",   value: formatCurrency(avgItemRevenue), sub: `Across ${itemRows.length} items` },
                { label: "Avg Order Value",      value: formatCurrency(avgOrderValue),  sub: `${formatCompact(totalPurchases)} orders` },
                { label: "Best Seller",          value: bestSeller?.itemName ?? "—",    sub: bestSeller ? formatCurrency(bestSeller.grossItemRevenue) : "" },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-xl font-bold tracking-tight truncate">{k.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Revenue by item bar */}
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold">Revenue Distribution — Top 10 Items</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number, _: string, entry: { payload?: { fullName?: string } }) => [
                      formatCurrency(v),
                      entry.payload?.fullName ?? "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {revenueBarData.map((_, idx) => (
                      <Cell key={idx} fill={REVENUE_BAR_COLORS[idx % REVENUE_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Star items */}
            <div>
              <p className="mb-3 text-sm font-semibold flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" />
                Star Items — Top 3 Revenue Drivers
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {starItems.map((item, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-950 dark:text-amber-300">
                        #{i + 1}
                      </span>
                      <p className="text-sm font-semibold leading-tight truncate">{item.itemName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.grossItemRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Conv. Rate</p>
                        <p className="text-sm font-bold">{formatPercent(item.convRate)}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t pt-2">{item.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Item Trends ─────────────────────────────────────────────── */}
        {activeTab === "trends" && (
          <>
            <TimeSeriesChart title="Items Viewed — 7-Day Trend" data={timeSeries} color="#6366f1" loading={loading} />

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Trending Up */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-emerald-50 dark:bg-emerald-950/20">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Trending Up</p>
                  <span className="ml-auto text-[11px] text-muted-foreground">vs. previous 7 days</span>
                </div>
                <div className="divide-y">
                  {TRENDING_UP.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatCompact(item.viewsPrev7)} → {formatCompact(item.viewsLast7)} views
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600">
                          +{formatPercent(item.delta)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Down */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-red-50 dark:bg-red-950/20">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Trending Down</p>
                  <span className="ml-auto text-[11px] text-muted-foreground">vs. previous 7 days</span>
                </div>
                <div className="divide-y">
                  {TRENDING_DOWN.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatCompact(item.viewsPrev7)} → {formatCompact(item.viewsLast7)} views
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-sm font-bold text-red-500">
                          {formatPercent(item.delta)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Note card */}
                <div className="px-4 pb-3 pt-2 border-t bg-muted/20">
                  <p className="text-[11px] text-muted-foreground">
                    Declining items may benefit from a featured placement or promotion. Check inventory levels before deprioritizing.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary insight row */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Rising Items",    value: TRENDING_UP.length,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                { label: "Declining Items", value: TRENDING_DOWN.length,  color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20" },
                { label: "Stable Items",    value: itemRows.length - TRENDING_UP.length - TRENDING_DOWN.length, color: "text-muted-foreground", bg: "bg-muted/30" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">out of {itemRows.length} tracked items</p>
                </div>
              ))}
            </div>
          </>
        )}

      </PageContent>

      {shareOpen && (
        <SharePanel
          title="Sales by Item"
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
