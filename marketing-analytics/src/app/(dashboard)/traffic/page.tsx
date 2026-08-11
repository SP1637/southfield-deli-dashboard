"use client";

import { useState } from "react";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { subDays } from "date-fns";
import { Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TimeSeriesChart, ChannelTimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { useGA4Traffic } from "@/hooks/use-ga4-traffic";
import { toGA4DateString, formatCompact, formatCurrency, cn } from "@/lib/utils";
import {
  DEMO_TRAFFIC_KPIS, DEMO_TRAFFIC_DAILY,
  DEMO_TRAFFIC_BY_CHANNEL, DEMO_WEEKLY, DEMO_MONTHLY,
} from "@/lib/demo-data";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";

// ── Channel definitions ───────────────────────────────────────────────────────

const CHANNELS = [
  { key: "all",       label: "All Traffic",     color: "#6366f1", icon: "📊" },
  { key: "organic",   label: "Google / Organic", color: "#4285F4", icon: "🔍" },
  { key: "direct",    label: "Direct",           color: "#8b5cf6", icon: "🎯" },
  { key: "paid",      label: "Paid Search",      color: "#10b981", icon: "💰" },
  { key: "email",     label: "Email",            color: "#f59e0b", icon: "✉️" },
  { key: "social",    label: "Organic Social",   color: "#ec4899", icon: "📱" },
  { key: "paid-social",label: "Paid Social",     color: "#3b82f6", icon: "📣" },
  { key: "referral",  label: "Referral",         color: "#14b8a6", icon: "🔗" },
];

// ── Per-channel demo data ─────────────────────────────────────────────────────

const CHANNEL_DATA: Record<string, {
  kpis: { users: number; newUsers: number; sessions: number; bounceRate: number; avgDuration: string; convRate: number; revenue: number };
  sources: { name: string; users: number; sessions: number; color: string }[];
  topPages: { page: string; sessions: number; bounceRate: string; duration: string }[];
  trend: { date: string; value: number }[];
  insight: string;
}> = {
  organic: {
    kpis: { users: 38200, newUsers: 34000, sessions: 45840, bounceRate: 38.4, avgDuration: "3m 12s", convRate: 4.2, revenue: 96240 },
    sources: [
      { name: "google / organic",  users: 32400, sessions: 38880, color: "#4285F4" },
      { name: "bing / organic",    users:  3800, sessions:  4560, color: "#008373" },
      { name: "yahoo / organic",   users:  1200, sessions:  1440, color: "#6001D2" },
      { name: "duckduckgo / organic",users:  800, sessions:   960, color: "#DE5833" },
    ],
    topPages: [
      { page: "/products/running-shoes",    sessions: 9200, bounceRate: "28.4%", duration: "2m 44s" },
      { page: "/collections/new-in",        sessions: 7400, bounceRate: "34.2%", duration: "2m 10s" },
      { page: "/blog/best-running-gear",    sessions: 6800, bounceRate: "22.4%", duration: "4m 18s" },
      { page: "/products/yoga-mat",         sessions: 5200, bounceRate: "30.6%", duration: "2m 02s" },
      { page: "/blog/training-tips-2026",   sessions: 4600, bounceRate: "19.8%", duration: "5m 12s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 2400 + Math.round(Math.random() * 800) })),
    insight: "Organic search is your highest-quality traffic source. Blog content drives 38% of organic sessions — consider expanding your content calendar for high-intent keywords.",
  },
  direct: {
    kpis: { users: 27500, newUsers: 12000, sessions: 33000, bounceRate: 28.6, avgDuration: "3m 52s", convRate: 3.6, revenue: 59400 },
    sources: [
      { name: "Direct / None",       users: 24200, sessions: 29040, color: "#8b5cf6" },
      { name: "Dark Social (est.)",   users:  2400, sessions:  2880, color: "#7c3aed" },
      { name: "Bookmarked Pages",    users:   900, sessions:  1080, color: "#a78bfa" },
    ],
    topPages: [
      { page: "/",                   sessions: 11000, bounceRate: "42.4%", duration: "1m 08s" },
      { page: "/checkout",           sessions:  6600, bounceRate: "12.2%", duration: "4m 20s" },
      { page: "/account",            sessions:  4400, bounceRate: "18.6%", duration: "2m 48s" },
      { page: "/cart",               sessions:  3960, bounceRate: "22.8%", duration: "1m 52s" },
      { page: "/products",           sessions:  3300, bounceRate: "34.0%", duration: "1m 36s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 1800 + Math.round(Math.random() * 600) })),
    insight: "Direct traffic indicates strong brand recall. High returning-user rate (56%) shows loyal customers — ideal for loyalty programme and email capture campaigns.",
  },
  paid: {
    kpis: { users: 18400, newUsers: 16800, sessions: 22080, bounceRate: 44.2, avgDuration: "1m 48s", convRate: 5.5, revenue: 60720 },
    sources: [
      { name: "google / cpc",        users: 14200, sessions: 17040, color: "#4285F4" },
      { name: "bing / cpc",          users:  2600, sessions:  3120, color: "#008373" },
      { name: "google / pmax",       users:  1200, sessions:  1440, color: "#34A853" },
      { name: "google / shopping",   users:   400, sessions:   480, color: "#FBBC05" },
    ],
    topPages: [
      { page: "/products/running-shoes",   sessions: 6624, bounceRate: "38.4%", duration: "2m 02s" },
      { page: "/sale",                     sessions: 4416, bounceRate: "42.8%", duration: "1m 34s" },
      { page: "/collections/new-in",       sessions: 3312, bounceRate: "40.2%", duration: "1m 52s" },
      { page: "/products/yoga-mat",        sessions: 2208, bounceRate: "44.6%", duration: "1m 44s" },
      { page: "/checkout",                 sessions: 1987, bounceRate: "11.2%", duration: "3m 58s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 1200 + Math.round(Math.random() * 600) })),
    insight: "Paid Search drives the highest conversion rate at 5.5%. Google CPC dominates spend (77%). Consider allocating more budget to Google Shopping which shows strong ROAS.",
  },
  email: {
    kpis: { users: 15600, newUsers: 3200, sessions: 18720, bounceRate: 18.4, avgDuration: "4m 12s", convRate: 6.5, revenue: 60720 },
    sources: [
      { name: "klaviyo / email",     users: 9200, sessions: 11040, color: "#f59e0b" },
      { name: "mailchimp / email",   users: 4200, sessions:  5040, color: "#FFE01B" },
      { name: "hubspot / email",     users: 1400, sessions:  1680, color: "#FF7A59" },
      { name: "omnisend / email",    users:  800, sessions:   960, color: "#6C47FF" },
    ],
    topPages: [
      { page: "/sale",                      sessions: 5616, bounceRate: "14.2%", duration: "3m 48s" },
      { page: "/new-arrivals",              sessions: 3744, bounceRate: "18.8%", duration: "4m 12s" },
      { page: "/account/order-history",    sessions: 2808, bounceRate: "22.4%", duration: "2m 36s" },
      { page: "/products/running-shoes",   sessions: 1872, bounceRate: "16.4%", duration: "3m 02s" },
      { page: "/checkout",                 sessions: 1683, bounceRate: "10.2%", duration: "5m 18s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 800 + Math.round(Math.random() * 600) })),
    insight: "Email is your highest-intent channel with 6.5% conversion rate and lowest bounce rate (18.4%). Klaviyo flows account for 59% of email sessions — expand abandoned cart sequences.",
  },
  social: {
    kpis: { users: 12300, newUsers: 11500, sessions: 14760, bounceRate: 52.4, avgDuration: "1m 24s", convRate: 2.0, revenue: 14760 },
    sources: [
      { name: "instagram / organic", users: 5200, sessions: 6240, color: "#E1306C" },
      { name: "facebook / organic",  users: 3800, sessions: 4560, color: "#1877F2" },
      { name: "tiktok / organic",    users: 1800, sessions: 2160, color: "#010101" },
      { name: "twitter / organic",   users:  900, sessions: 1080, color: "#1DA1F2" },
      { name: "pinterest / organic", users:  600, sessions:  720, color: "#E60023" },
    ],
    topPages: [
      { page: "/products/running-shoes",    sessions: 4428, bounceRate: "46.2%", duration: "1m 48s" },
      { page: "/collections/trending",      sessions: 2952, bounceRate: "52.8%", duration: "1m 22s" },
      { page: "/",                          sessions: 2214, bounceRate: "62.4%", duration: "0m 48s" },
      { page: "/products/yoga-mat",         sessions: 1476, bounceRate: "48.6%", duration: "1m 36s" },
      { page: "/blog/style-guide-summer",   sessions: 1328, bounceRate: "38.4%", duration: "2m 54s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 700 + Math.round(Math.random() * 400) })),
    insight: "Organic social drives awareness but has lower intent. Instagram leads (42%) — video content and Reels are performing well. Focus on driving traffic to high-converting landing pages.",
  },
  "paid-social": {
    kpis: { users: 9800, newUsers: 8900, sessions: 11760, bounceRate: 58.2, avgDuration: "1m 12s", convRate: 2.0, revenue: 11760 },
    sources: [
      { name: "facebook / cpc",      users: 4400, sessions: 5280, color: "#1877F2" },
      { name: "instagram / cpc",     users: 3200, sessions: 3840, color: "#E1306C" },
      { name: "tiktok / paid",       users: 1400, sessions: 1680, color: "#010101" },
      { name: "snapchat / paid",     users:  800, sessions:   960, color: "#FFFC00" },
    ],
    topPages: [
      { page: "/sale",                      sessions: 3528, bounceRate: "52.4%", duration: "1m 22s" },
      { page: "/products/running-shoes",    sessions: 2352, bounceRate: "56.8%", duration: "1m 14s" },
      { page: "/collections/new-in",        sessions: 1764, bounceRate: "60.2%", duration: "1m 04s" },
      { page: "/",                          sessions: 1176, bounceRate: "64.8%", duration: "0m 52s" },
      { page: "/products/yoga-mat",         sessions:  941, bounceRate: "54.4%", duration: "1m 18s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 500 + Math.round(Math.random() * 400) })),
    insight: "Paid social has a higher bounce rate than other paid channels. Facebook CPC drives 45% of paid social spend. Consider testing UGC creative formats which typically reduce bounce rates by 20-30%.",
  },
  referral: {
    kpis: { users: 6200, newUsers: 5400, sessions: 7440, bounceRate: 32.4, avgDuration: "2m 48s", convRate: 3.1, revenue: 11532 },
    sources: [
      { name: "trustpilot.com",     users: 1800, sessions: 2160, color: "#00B67A" },
      { name: "google.com",         users: 1200, sessions: 1440, color: "#4285F4" },
      { name: "reddit.com",         users:  900, sessions: 1080, color: "#FF4500" },
      { name: "affiliate-partner.com", users: 700, sessions:  840, color: "#a855f7" },
      { name: "stylemag.co.uk",     users:  600, sessions:  720, color: "#ec4899" },
      { name: "other referrals",    users: 1000, sessions: 1200, color: "#94a3b8" },
    ],
    topPages: [
      { page: "/",                          sessions: 2232, bounceRate: "38.4%", duration: "1m 52s" },
      { page: "/products/running-shoes",    sessions: 1488, bounceRate: "28.6%", duration: "3m 04s" },
      { page: "/collections/new-in",        sessions:  893, bounceRate: "32.8%", duration: "2m 28s" },
      { page: "/sale",                      sessions:  744, bounceRate: "36.4%", duration: "2m 12s" },
      { page: "/about",                     sessions:  669, bounceRate: "44.2%", duration: "1m 38s" },
    ],
    trend: Array.from({ length: 14 }, (_, i) => ({ date: `Day ${i + 1}`, value: 350 + Math.round(Math.random() * 250) })),
    insight: "Referral traffic from Trustpilot shows strong purchase intent (2nd highest conv. rate across channels). Building more review partnerships and affiliate relationships could scale this effectively.",
  },
};

export default function TrafficPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useGA4Property();
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 51)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Traffic({ ...filters, propertyId });
  const kpis      = ga4.data?.data.kpis            ?? DEMO_TRAFFIC_KPIS;
  const daily     = ga4.data?.data.dailyTimeSeries  ?? DEMO_TRAFFIC_DAILY;
  const byChannel = ga4.data?.data.byChannel        ?? DEMO_TRAFFIC_BY_CHANNEL;
  const weekly    = ga4.data?.data.weekly           ?? DEMO_WEEKLY;
  const monthly   = ga4.data?.data.monthly          ?? DEMO_MONTHLY;
  const loading   = ga4.isLoading && !!session;

  const dailyUsers     = daily.map((r) => ({ date: r.date, value: r.value }));
  const dailyKeyEvents = daily.map((r) => ({ date: r.date, value: r.value2 ?? 0 }));
  const weeklyChartData  = weekly.map((w) => ({ label: w.week, value: w.totalUsers }));
  const monthlyChartData = monthly.map((m) => ({
    label: typeof m.month === "string" && m.month.length === 6
      ? new Date(`${m.month.slice(0, 4)}-${m.month.slice(4)}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
      : m.month,
    value: m.totalUsers,
  }));

  const ch = CHANNEL_DATA[activeTab];
  const activeCh = CHANNELS.find((c) => c.key === activeTab)!;

  return (
    <>
      <PageHeader
        title="Traffic"
        tabs={CHANNELS.map((c) => ({ key: c.key, label: c.label }))}
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

      <FilterBar filters={filters} onChange={setFilters} show={["channelGroup", "deviceCategory"]} />

      {/* ── TAB: ALL TRAFFIC ── */}
      {activeTab === "all" && (<>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Users" value={kpis.totalUsers} delta={0.12} loading={loading} />
          <KpiCard label="New Users"   value={kpis.newUsers}   delta={0.08} loading={loading} />
          <KpiCard label="Sessions"    value={kpis.sessions}   delta={0.15} loading={loading} />
          <KpiCard label="Key Events"  value={kpis.keyEvents}  delta={0.21} loading={loading} />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Traffic</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TimeSeriesChart title="Daily Traffic — Total Users"   data={dailyUsers}     color="#6366f1" loading={loading} />
            <TimeSeriesChart title="Daily Key Events"              data={dailyKeyEvents} color="#f59e0b" loading={loading} />
          </div>
        </div>

        <ChannelTimeSeriesChart title="Daily Traffic by Channel" data={byChannel} loading={loading} />

        {/* Channel summary table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Channel Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Channel", "Users", "Sessions", "Bounce Rate", "Avg Duration", "Conv. Rate", "Revenue"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHANNELS.filter((c) => c.key !== "all").map((ch) => {
                    const d = CHANNEL_DATA[ch.key];
                    return (
                      <tr
                        key={ch.key}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => setActiveTab(ch.key)}
                      >
                        <td className="px-4 py-2.5 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: ch.color }} />
                            {ch.icon} {ch.label}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(d.kpis.users)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(d.kpis.sessions)}</td>
                        <td className={cn("px-4 py-2.5 font-medium", d.kpis.bounceRate > 50 ? "text-red-600" : d.kpis.bounceRate > 35 ? "text-amber-600" : "text-emerald-600")}>
                          {d.kpis.bounceRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.kpis.avgDuration}</td>
                        <td className="px-4 py-2.5 font-bold" style={{ color: ch.color }}>{d.kpis.convRate.toFixed(1)}%</td>
                        <td className="px-4 py-2.5 tabular-nums font-semibold">{formatCurrency(d.kpis.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Weekly and Monthly Trends</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weekly Traffic — Last 6 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={40} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
                    <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Traffic — Last 12 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </>)}

      {/* ── CHANNEL-SPECIFIC TABS ── */}
      {activeTab !== "all" && ch && (
        <div className="space-y-5">
          {/* Channel badge */}
          <div className="flex items-center gap-3 rounded-xl border px-5 py-3" style={{ borderColor: activeCh.color + "44", background: activeCh.color + "11" }}>
            <span className="text-2xl">{activeCh.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: activeCh.color }}>{activeCh.label}</p>
              <p className="text-xs text-muted-foreground">Channel-level performance breakdown · Last 52 days</p>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Users",        value: formatCompact(ch.kpis.users) },
              { label: "New Users",    value: formatCompact(ch.kpis.newUsers) },
              { label: "Sessions",     value: formatCompact(ch.kpis.sessions) },
              { label: "Bounce Rate",  value: `${ch.kpis.bounceRate.toFixed(1)}%` },
              { label: "Avg Duration", value: ch.kpis.avgDuration },
              { label: "Conv. Rate",   value: `${ch.kpis.convRate.toFixed(1)}%` },
              { label: "Revenue",      value: formatCurrency(ch.kpis.revenue) },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
                <p className="text-base font-bold mt-0.5">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Traffic trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Daily Users — {activeCh.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={ch.trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={activeCh.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={activeCh.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
                  <Area type="monotone" dataKey="value" stroke={activeCh.color} fill={`url(#grad-${activeTab})`} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Sources within channel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sources within {activeCh.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ch.sources.map((s) => {
                  const maxUsers = ch.sources[0].users;
                  return (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate">{s.name}</span>
                        <span className="text-muted-foreground ml-2 shrink-0">{formatCompact(s.users)} users</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(s.users / maxUsers) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                  );
                })}
                {/* Pie-style breakdown chart */}
                <div className="pt-2">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart
                      layout="vertical"
                      data={ch.sources.map((s) => ({ name: s.name.split(" / ")[0], users: s.users, color: s.color }))}
                      margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
                      <Bar dataKey="users" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {ch.sources.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top landing pages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Top Landing Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ch.topPages.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground font-mono w-4 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-medium truncate">{p.page}</p>
                        <div className="flex gap-3 text-muted-foreground mt-0.5">
                          <span>{formatCompact(p.sessions)} sessions</span>
                          <span className={cn("font-medium", parseFloat(p.bounceRate) > 50 ? "text-red-500" : parseFloat(p.bounceRate) > 35 ? "text-amber-500" : "text-emerald-600")}>
                            {p.bounceRate} bounce
                          </span>
                          <span>{p.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insight */}
          <div className="rounded-xl border px-5 py-4" style={{ borderColor: activeCh.color + "44", background: activeCh.color + "08" }}>
            <p className="text-sm font-semibold flex items-center gap-2">
              <span>💡</span> Channel Insight
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{ch.insight}</p>
          </div>
        </div>
      )}

      </PageContent>

      {shareOpen && (
        <SharePanel title="Traffic" onClose={() => setShareOpen(false)} />
      )}
    </>
  );
}
