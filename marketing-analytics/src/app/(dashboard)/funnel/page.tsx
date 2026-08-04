"use client";

import { useState } from "react";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { subDays } from "date-fns";
import { RefreshCw, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelVisualization } from "@/components/dashboard/funnel-visualization";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { useGA4Funnel } from "@/hooks/use-ga4-funnel";
import { toGA4DateString, formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import {
  DEMO_FUNNEL_KPIS, DEMO_FUNNEL_STEPS, DEMO_FUNNEL_TIMESERIES,
  DEMO_DONUT, DEMO_CHANNEL_ROWS,
} from "@/lib/demo-data";
import type { ChannelRow } from "@/types";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";

const CHANNEL_COLUMNS: Column<ChannelRow>[] = [
  { key: "sourceMedium",         label: "Source / Medium",   format: "string",   sortable: false },
  { key: "totalUsers",           label: "Total Users",        format: "number" },
  { key: "newUsers",             label: "New Users",          format: "number" },
  { key: "pageViews",            label: "Page Views",         format: "number" },
  { key: "addsToCart",           label: "Adds to Cart",       format: "number" },
  { key: "checkouts",            label: "Checkouts",          format: "number" },
  { key: "paymentInfoAdds",      label: "Payment Info",       format: "number" },
  { key: "purchases",            label: "Purchases",          format: "number" },
  { key: "grossPurchaseRevenue", label: "Revenue",            format: "currency" },
];

// ── Device funnel demo data ───────────────────────────────────────────────────
const DEVICE_FUNNEL = [
  {
    device: "Mobile", color: "#f59e0b", icon: "📱",
    users: 38200, addToCart: 5730, checkout: 3055, purchase: 1528,
    cartRate: 15.0, checkoutRate: 53.3, purchaseRate: 50.0, convRate: 4.0,
  },
  {
    device: "Desktop", color: "#6366f1", icon: "🖥️",
    users: 24600, addToCart: 4428, checkout: 2706, purchase: 1599,
    cartRate: 18.0, checkoutRate: 61.1, purchaseRate: 59.1, convRate: 6.5,
  },
  {
    device: "Tablet", color: "#10b981", icon: "📋",
    users:  7200, addToCart:  936, checkout:  504, purchase:  216,
    cartRate: 13.0, checkoutRate: 53.8, purchaseRate: 42.9, convRate: 3.0,
  },
];

// ── Campaign funnel demo data ─────────────────────────────────────────────────
const CAMPAIGN_ROWS = [
  { campaign: "Summer Sale 2026",          medium: "cpc",      users: 18400, addToCart: 4232, checkout: 2484, purchases: 1472, revenue: 88320, convRate: 8.0 },
  { campaign: "Brand Awareness Q2",        medium: "display",  users: 14200, addToCart: 1562, checkout:  710, purchases:  355, revenue: 21300, convRate: 2.5 },
  { campaign: "Retargeting — Cart Abandoners", medium: "cpc", users:  9800, addToCart: 3920, checkout: 2940, purchases: 1960, revenue:117600, convRate:20.0 },
  { campaign: "Email — New Arrivals",      medium: "email",    users:  8600, addToCart: 2408, checkout: 1634, purchases:  946, revenue: 56760, convRate:11.0 },
  { campaign: "Influencer — Spring Drop",  medium: "social",   users:  7200, addToCart:  864, checkout:  432, purchases:  216, revenue: 12960, convRate: 3.0 },
  { campaign: "Google Shopping",           medium: "cpc",      users:  6400, addToCart: 1792, checkout: 1152, purchases:  768, revenue: 46080, convRate:12.0 },
  { campaign: "YouTube Pre-Roll",          medium: "video",    users:  5800, addToCart:  522, checkout:  232, purchases:   87, revenue:  5220, convRate: 1.5 },
  { campaign: "Loyalty Email — VIP",       medium: "email",    users:  4200, addToCart: 1680, checkout: 1260, purchases:  882, revenue: 52920, convRate:21.0 },
];

export default function FunnelPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useGA4Property();
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 29)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Funnel({ ...filters, propertyId });

  const isDemo = !session || ga4.isError || !ga4.data;
  const kpis        = ga4.data?.data.kpis        ?? DEMO_FUNNEL_KPIS;
  const funnelSteps = ga4.data?.data.funnelSteps ?? DEMO_FUNNEL_STEPS;
  const timeSeries  = ga4.data?.data.timeSeries  ?? DEMO_FUNNEL_TIMESERIES;
  const donut       = ga4.data?.data.donut       ?? DEMO_DONUT;
  const channelRows = ga4.data?.data.channelRows ?? DEMO_CHANNEL_ROWS;
  const loading     = ga4.isLoading && !!session;

  // Organic vs Paid split from channel rows
  const organicRows = channelRows.filter((r) => /organic|seo/i.test(r.sourceMedium));
  const paidRows    = channelRows.filter((r) => /cpc|paid|adwords|ppc/i.test(r.sourceMedium));
  const emailRows   = channelRows.filter((r) => /email/i.test(r.sourceMedium));
  const socialRows  = channelRows.filter((r) => /facebook|instagram|twitter|tiktok|social|linkedin/i.test(r.sourceMedium));

  function sumRows(rows: ChannelRow[]) {
    return rows.reduce((acc, r) => ({
      users: acc.users + r.totalUsers,
      purchases: acc.purchases + r.purchases,
      revenue: acc.revenue + r.grossPurchaseRevenue,
      addToCart: acc.addToCart + r.addsToCart,
      checkout: acc.checkout + r.checkouts,
    }), { users: 0, purchases: 0, revenue: 0, addToCart: 0, checkout: 0 });
  }

  const organicSum = sumRows(organicRows.length ? organicRows : DEMO_CHANNEL_ROWS.slice(0, 2));
  const paidSum    = sumRows(paidRows.length    ? paidRows    : DEMO_CHANNEL_ROWS.slice(2, 4));

  return (
    <>
      <PageHeader
        title="Sales Funnel"
        tabs={[
          { key: "overview",   label: "Overview" },
          { key: "device",     label: "By Device" },
          { key: "campaign",   label: "By Campaign" },
          { key: "org-vs-paid",label: "Organic vs Paid" },
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

      <FilterBar filters={filters} onChange={setFilters} show={["campaign", "sourceMedium"]} />

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (<>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total Users"           value={kpis.totalUsers}           delta={kpis.totalUsersDelta}           loading={loading} />
          <KpiCard label="Purchases"             value={kpis.purchases}             delta={kpis.purchasesDelta}             loading={loading} />
          <KpiCard label="Total Purchasers"      value={kpis.totalPurchasers}      delta={kpis.totalPurchasersDelta}      loading={loading} />
          <KpiCard label="First-Time Purchasers" value={kpis.firstTimePurchasers}  delta={kpis.firstTimePurchasersDelta}  loading={loading} />
          <KpiCard label="Gross Revenue"         value={kpis.grossPurchaseRevenue} delta={kpis.grossPurchaseRevenueDelta} format="currency" loading={loading} />
        </div>
        <FunnelVisualization steps={funnelSteps} loading={loading} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TimeSeriesChart title="Dynamics by Period — Total Users" data={timeSeries} color="#6366f1" loading={loading} />
          <DonutChart title="Purchases by Source / Medium" data={donut} loading={loading} />
        </div>
        <DataTable<ChannelRow>
          title="Source / Medium Performance"
          columns={CHANNEL_COLUMNS}
          rows={channelRows}
          defaultSortKey="totalUsers"
          loading={loading}
        />
      </>)}

      {/* ── TAB: BY DEVICE ── */}
      {activeTab === "device" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DEVICE_FUNNEL.map((d) => (
              <Card key={d.device}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-xl">{d.icon}</span>
                    {d.device}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">{formatCompact(d.users)} users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Add to Cart",  value: d.addToCart, rate: d.cartRate,     color: d.color },
                    { label: "Checkout",     value: d.checkout,  rate: d.checkoutRate, color: d.color },
                    { label: "Purchase",     value: d.purchase,  rate: d.purchaseRate, color: d.color },
                  ].map((step) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{step.label}</span>
                        <span className="font-semibold">{formatCompact(step.value)} · {step.rate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${step.rate}%`, background: step.color }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between text-xs">
                    <span className="text-muted-foreground">Overall Conv. Rate</span>
                    <span className="font-bold" style={{ color: d.color }}>{d.convRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Side-by-side funnel comparison chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Funnel Step Comparison by Device</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { step: "Add to Cart", Mobile: 15.0, Desktop: 18.0, Tablet: 13.0 },
                    { step: "Checkout",    Mobile: 8.0,  Desktop: 11.0, Tablet: 7.0  },
                    { step: "Purchase",    Mobile: 4.0,  Desktop: 6.5,  Tablet: 3.0  },
                  ]}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="step" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
                  <Bar dataKey="Mobile"  fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="Desktop" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="Tablet"  fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                {[{ l: "Mobile", c: "#f59e0b" }, { l: "Desktop", c: "#6366f1" }, { l: "Tablet", c: "#10b981" }].map((d) => (
                  <span key={d.l} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: d.c }} />{d.l}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insight callout */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold">💡 Key Insight</p>
            <p className="text-muted-foreground mt-1">
              Desktop users convert at <strong>6.5%</strong> — 62% higher than mobile (<strong>4.0%</strong>).
              Optimising your mobile checkout flow could unlock significant revenue. Consider streamlining
              the mobile payment step, which sees the steepest drop-off.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: BY CAMPAIGN ── */}
      {activeTab === "campaign" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Active Campaigns", value: String(CAMPAIGN_ROWS.length) },
              { label: "Total Attributed Users", value: formatCompact(CAMPAIGN_ROWS.reduce((s, r) => s + r.users, 0)) },
              { label: "Total Purchases", value: formatCompact(CAMPAIGN_ROWS.reduce((s, r) => s + r.purchases, 0)) },
              { label: "Total Revenue", value: formatCurrency(CAMPAIGN_ROWS.reduce((s, r) => s + r.revenue, 0)) },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign Funnel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Campaign", "Medium", "Users", "Add to Cart", "Checkout", "Purchases", "Revenue", "Conv. Rate"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...CAMPAIGN_ROWS].sort((a, b) => b.revenue - a.revenue).map((row, i) => {
                      const mediumColors: Record<string, string> = {
                        cpc: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                        email: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                        social: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
                        display: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
                        video: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                      };
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium max-w-[200px] truncate" title={row.campaign}>{row.campaign}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mediumColors[row.medium] ?? "bg-muted text-muted-foreground"}`}>
                              {row.medium}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.users)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.addToCart)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.checkout)}</td>
                          <td className="px-4 py-2.5 tabular-nums font-medium">{formatCompact(row.purchases)}</td>
                          <td className="px-4 py-2.5 tabular-nums font-semibold">{formatCurrency(row.revenue)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-bold tabular-nums ${row.convRate >= 10 ? "text-emerald-600" : row.convRate >= 5 ? "text-blue-600" : "text-muted-foreground"}`}>
                              {row.convRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by campaign bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Revenue by Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[...CAMPAIGN_ROWS].sort((a, b) => b.revenue - a.revenue).map((r) => ({
                    name: r.campaign.length > 22 ? r.campaign.slice(0, 22) + "…" : r.campaign,
                    revenue: r.revenue,
                    conv: r.convRate,
                  }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={48} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, n: string) => [n === "revenue" ? formatCurrency(v) : `${v}%`, n === "revenue" ? "Revenue" : "Conv. Rate"]} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {CAMPAIGN_ROWS.map((_, i) => (
                      <Cell key={i} fill={["#6366f1","#10b981","#f59e0b","#8b5cf6","#ec4899","#3b82f6","#ef4444","#14b8a6"][i % 8]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: ORGANIC vs PAID ── */}
      {activeTab === "org-vs-paid" && (
        <div className="space-y-5">
          {/* Side-by-side KPI cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[
              { label: "Organic", color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800", data: organicSum, icon: "🌱" },
              { label: "Paid",    color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800",   data: paidSum,    icon: "💰" },
            ].map((ch) => (
              <div key={ch.label} className={`rounded-xl border p-5 ${ch.bg}`}>
                <p className="text-sm font-bold flex items-center gap-2 mb-4">
                  {ch.icon} {ch.label} Traffic
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Users",     value: formatCompact(ch.data.users) },
                    { label: "Purchases", value: formatCompact(ch.data.purchases) },
                    { label: "Revenue",   value: formatCurrency(ch.data.revenue) },
                    { label: "Conv. Rate",value: `${ch.data.users > 0 ? ((ch.data.purchases / ch.data.users) * 100).toFixed(1) : "0.0"}%` },
                  ].map((k) => (
                    <div key={k.label}>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: ch.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Funnel comparison chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Funnel Comparison — Organic vs Paid vs Email vs Social</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { step: "Add to Cart", Organic: organicSum.users > 0 ? ((organicSum.addToCart/organicSum.users)*100).toFixed(1) : 12.4, Paid: paidSum.users > 0 ? ((paidSum.addToCart/paidSum.users)*100).toFixed(1) : 18.2, Email: 28.4, Social: 9.8 },
                    { step: "Checkout",    Organic: organicSum.users > 0 ? ((organicSum.checkout/organicSum.users)*100).toFixed(1)  : 6.8,  Paid: paidSum.users > 0 ? ((paidSum.checkout/paidSum.users)*100).toFixed(1)   : 10.4, Email: 19.0, Social: 4.2 },
                    { step: "Purchase",    Organic: organicSum.users > 0 ? ((organicSum.purchases/organicSum.users)*100).toFixed(1) : 2.5,  Paid: paidSum.users > 0 ? ((paidSum.purchases/paidSum.users)*100).toFixed(1)  : 4.2,  Email: 11.6, Social: 2.0 },
                  ]}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="step" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [`${Number(v).toFixed(1)}%`]} />
                  <Bar dataKey="Organic" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Paid"    fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Email"   fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Social"  fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                {[{l:"Organic",c:"#10b981"},{l:"Paid",c:"#6366f1"},{l:"Email",c:"#f59e0b"},{l:"Social",c:"#ec4899"}].map((d) => (
                  <span key={d.l} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: d.c }} />{d.l}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel breakdown table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Channel Group Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Channel Group", "Users", "Add to Cart", "Purchases", "Revenue", "Conv. Rate", "Revenue Share"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { group: "🌱 Organic Search", users: organicSum.users || 15600, addToCart: organicSum.addToCart || 1872, purchases: organicSum.purchases || 390, revenue: organicSum.revenue || 23400, color: "#10b981" },
                      { group: "💰 Paid Search",    users: paidSum.users    || 38200, addToCart: paidSum.addToCart    || 5730, purchases: paidSum.purchases    || 1604, revenue: paidSum.revenue    || 96240, color: "#6366f1" },
                      { group: "✉️ Email",          users: 18400, addToCart: 5244, purchases: 1840, revenue: 110400, color: "#f59e0b" },
                      { group: "📱 Organic Social", users: 12300, addToCart: 1107, purchases:  246, revenue: 14760,  color: "#ec4899" },
                      { group: "📣 Paid Social",    users:  9800, addToCart:  980, purchases:  196, revenue: 11760,  color: "#3b82f6" },
                      { group: "🔗 Referral",       users:  6200, addToCart:  744, purchases:  186, revenue: 11160,  color: "#14b8a6" },
                      { group: "🎯 Direct",         users: 27500, addToCart: 3300, purchases:  990, revenue: 59400,  color: "#8b5cf6" },
                    ].map((r, i, arr) => {
                      const totalRev = arr.reduce((s, x) => s + x.revenue, 0);
                      const conv = ((r.purchases / r.users) * 100).toFixed(1);
                      const share = ((r.revenue / totalRev) * 100).toFixed(1);
                      return (
                        <tr key={r.group} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium">{r.group}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.users)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.addToCart)}</td>
                          <td className="px-4 py-2.5 tabular-nums font-medium">{formatCompact(r.purchases)}</td>
                          <td className="px-4 py-2.5 tabular-nums font-semibold">{formatCurrency(r.revenue)}</td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: r.color }}>{conv}%</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${share}%`, background: r.color }} />
                              </div>
                              <span className="text-xs tabular-nums w-10 text-right">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      </PageContent>

      {shareOpen && (
        <SharePanel title="Sales Funnel" onClose={() => setShareOpen(false)} />
      )}
    </>
  );
}
