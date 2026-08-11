"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart2, TrendingUp, TrendingDown, Target, ArrowRight,
  AlertTriangle, CheckCircle2, Zap, RefreshCw, Bell,
  DollarSign, Users, ShoppingCart, MousePointerClick,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiMonitorBoard } from "@/components/dashboard/ai-monitor-board";
import { GoalTracker } from "@/components/dashboard/goal-tracker";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

// ── Platform summary data (cross-channel command centre) ──────────────────────

const PLATFORMS = [
  {
    key: "google-ads",
    name: "Google Ads",
    icon: "🔵",
    color: "#4285F4",
    href: "/ads",
    status: "live" as const,
    kpis: [
      { label: "Spend",   value: "$8,420",  delta: +0.142, up: false }, // up: false = spend increase can be neutral
      { label: "ROAS",    value: "5.2×",    delta: +0.18,  up: true  },
      { label: "Clicks",  value: "44.8k",   delta: -0.83,  up: false },
      { label: "Conv.",   value: "1,284",   delta: +1.48,  up: true  },
    ],
  },
  {
    key: "meta",
    name: "Meta Ads",
    icon: "📘",
    color: "#1877F2",
    href: "/ads",
    status: "live" as const,
    kpis: [
      { label: "Spend",   value: "$5,240",  delta: +0.082, up: false },
      { label: "ROAS",    value: "3.8×",    delta: +0.06,  up: true  },
      { label: "Reach",   value: "599.6k",  delta: +7.32,  up: true  },
      { label: "Conv.",   value: "621",     delta: -0.12,  up: false },
    ],
  },
  {
    key: "tiktok",
    name: "TikTok Ads",
    icon: "🎵",
    color: "#010101",
    href: "/ads",
    status: "live" as const,
    kpis: [
      { label: "Spend",   value: "$1,840",  delta: +0.22,  up: false },
      { label: "ROAS",    value: "2.9×",    delta: +0.34,  up: true  },
      { label: "Views",   value: "2.1M",    delta: +0.94,  up: true  },
      { label: "Conv.",   value: "148",     delta: +0.62,  up: true  },
    ],
  },
  {
    key: "ga4",
    name: "GA4 Analytics",
    icon: "📊",
    color: "#E37400",
    href: "/overview",
    status: "live" as const,
    kpis: [
      { label: "Users",    value: "70.2k",  delta: +0.12,  up: true  },
      { label: "Revenue",  value: "$74.1k", delta: +0.087, up: true  },
      { label: "Purchases",value: "2,418",  delta: +0.09,  up: true  },
      { label: "Conv. %",  value: "3.4%",   delta: -0.004, up: false },
    ],
  },
  {
    key: "seo",
    name: "SEO / Search Console",
    icon: "🔍",
    color: "#34A853",
    href: "/seo",
    status: "live" as const,
    kpis: [
      { label: "Clicks",   value: "38.2k",  delta: +0.14,  up: true  },
      { label: "Impressions",value:"312k",  delta: +0.09,  up: true  },
      { label: "Avg CTR",  value: "12.3%",  delta: +0.018, up: true  },
      { label: "Avg Pos.", value: "8.4",    delta: -0.6,   up: true  }, // lower pos = better
    ],
  },
  {
    key: "email",
    name: "Email Marketing",
    icon: "✉️",
    color: "#f59e0b",
    href: "/traffic",
    status: "live" as const,
    kpis: [
      { label: "Sent",      value: "42.6k", delta: +0.08,  up: true  },
      { label: "Open Rate", value: "28.4%", delta: +0.024, up: true  },
      { label: "Click Rate",value: "6.8%",  delta: -0.004, up: false },
      { label: "Revenue",   value: "$60.7k",delta: +0.14,  up: true  },
    ],
  },
];

// ── Blended KPIs ──────────────────────────────────────────────────────────────

const BLENDED = [
  { label: "Total Ad Spend",   value: "$16.7k",  delta: "+14.2%", icon: DollarSign,       color: "#6366f1", trend: "up" },
  { label: "Blended ROAS",     value: "4.44×",   delta: "+12.3%", icon: TrendingUp,        color: "#10b981", trend: "up" },
  { label: "Total Revenue",    value: "$74.1k",  delta: "+8.7%",  icon: BarChart2,         color: "#10b981", trend: "up" },
  { label: "Blended CPA",      value: "$14.20",  delta: "-8.4%",  icon: Target,            color: "#10b981", trend: "down-good" },
  { label: "Total Conversions",value: "2,418",   delta: "+9.0%",  icon: ShoppingCart,      color: "#8b5cf6", trend: "up" },
  { label: "Total Users",      value: "70.2k",   delta: "+12.0%", icon: Users,             color: "#3b82f6", trend: "up" },
  { label: "Avg Conv. Rate",   value: "3.4%",    delta: "-0.4pp", icon: MousePointerClick, color: "#f59e0b", trend: "down" },
];

// ── Revenue by platform ───────────────────────────────────────────────────────

const REVENUE_BY_PLATFORM = [
  { name: "Google Ads",    revenue: 43800, spend: 8420, roas: 5.2, color: "#4285F4" },
  { name: "Meta Ads",      revenue: 19920, spend: 5240, roas: 3.8, color: "#1877F2" },
  { name: "Email",         revenue: 60720, spend:  400, roas: 151, color: "#f59e0b" },
  { name: "Organic SEO",   revenue: 23400, spend:    0, roas: Infinity, color: "#34A853" },
  { name: "TikTok Ads",    revenue:  5336, spend: 1840, roas: 2.9, color: "#010101" },
  { name: "Direct",        revenue: 59400, spend:    0, roas: Infinity, color: "#8b5cf6" },
];

// ── Weekly blended revenue trend ──────────────────────────────────────────────

const WEEKLY_TREND = [
  { week: "W1", revenue: 10200, spend: 2100 },
  { week: "W2", revenue: 11800, spend: 2300 },
  { week: "W3", revenue: 9600,  spend: 2050 },
  { week: "W4", revenue: 13400, spend: 2600 },
  { week: "W5", revenue: 12800, spend: 2480 },
  { week: "W6", revenue: 15200, spend: 2800 },
  { week: "W7", revenue: 14600, spend: 2720 },
  { week: "W8", revenue: 16800, spend: 2950 },
];

// ── Cross-channel alerts ──────────────────────────────────────────────────────

const ALERTS = [
  { level: "positive" as const, platform: "Google Ads 🔵", title: "ROAS up 18% this week", detail: "Performance Max campaigns driving strong returns. Consider increasing budget by 15%.", href: "/ads" },
  { level: "high"     as const, platform: "Meta Ads 📘",   title: "Conversions down 12% — budget pacing risk", detail: "iOS attribution changes affecting Meta conversion tracking. Review event setup in Events Manager.", href: "/budget" },
  { level: "positive" as const, platform: "TikTok 🎵",     title: "Video views hit 2.1M — best day ever", detail: "UGC creative format outperforming branded content by 3×. Scale the winning ad sets.", href: "/ads" },
  { level: "medium"   as const, platform: "SEO 🔍",        title: "3 high-value keywords slipped to page 2", detail: "\"running shoes\" (pos 11), \"yoga mat uk\" (pos 12) need content refresh.", href: "/seo" },
  { level: "positive" as const, platform: "Email ✉️",      title: "Klaviyo abandoned cart flow +£18k MoM", detail: "Flow is performing above benchmark. A/B test subject lines for further lift.", href: "/traffic" },
];

// ── Goal data ─────────────────────────────────────────────────────────────────

const GOAL_DATA = {
  revenue:  74100,
  users:    70200,
  roas:     0.034,
};

// ── Components ────────────────────────────────────────────────────────────────

function DeltaBadge({ delta, suffix = "%" }: { delta: number; suffix?: string }) {
  const isPos = delta >= 0;
  return (
    <span className={cn("text-[11px] font-semibold flex items-center gap-0.5", isPos ? "text-emerald-600" : "text-red-500")}>
      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPos ? "+" : ""}{typeof delta === "number" ? (Math.abs(delta) > 1 ? delta.toFixed(0) : (delta * 100).toFixed(1)) : delta}{suffix}
    </span>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <>
      <PageHeader
        title="Home"
        actions={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        }
      />

      <PageContent>

        {/* ── AI Captain Board ── */}
        <AiMonitorBoard
          userName={session?.user?.name ?? undefined}
          dayRange={7}
        />

        {/* ── Blended KPIs ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Blended Performance — All Channels
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {BLENDED.map((k) => {
              const Icon = k.icon;
              const isGood = k.trend === "up" || k.trend === "down-good";
              return (
                <div key={k.label} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="rounded-md p-1" style={{ background: k.color + "18" }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: k.color }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums leading-none">{k.value}</p>
                  <p className={cn("text-[11px] font-semibold mt-1", isGood ? "text-emerald-600" : "text-red-500")}>
                    {k.delta}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Platform cards ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Platform Snapshot
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PLATFORMS.map((p) => (
              <Link key={p.key} href={p.href} className="group block">
                <div className="rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5">
                  {/* Platform header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Connected
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>

                  {/* KPI grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {p.kpis.map((k) => (
                      <div key={k.label} className="rounded-lg bg-muted/40 px-3 py-2">
                        <p className="text-[10px] text-muted-foreground">{k.label}</p>
                        <p className="text-sm font-bold tabular-nums mt-0.5">{k.value}</p>
                        <span className={cn("text-[10px] font-semibold flex items-center gap-0.5 mt-0.5",
                          k.up ? "text-emerald-600" : "text-red-500"
                        )}>
                          {k.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {(Math.abs(k.delta) > 1 ? `${k.delta > 0 ? "+" : ""}${k.delta.toFixed(0)}` : `${k.delta > 0 ? "+" : ""}${(k.delta * 100).toFixed(1)}`)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Revenue by platform + Weekly trend ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Revenue by platform */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Revenue by Platform — Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  layout="vertical"
                  data={[...REVENUE_BY_PLATFORM].sort((a, b) => b.revenue - a.revenue)}
                  margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(v: number, n: string) => [formatCurrency(v), "Revenue"]}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {REVENUE_BY_PLATFORM.map((r, i) => (
                      <Cell key={i} fill={r.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly blended trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Weekly Revenue vs Spend — Last 8 Weeks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={WEEKLY_TREND} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="homeRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="homeSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, n: string) => [formatCurrency(v), n === "revenue" ? "Revenue" : "Ad Spend"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#homeRevGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="spend"   stroke="#f59e0b" fill="url(#homeSpendGrad)" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-indigo-500 inline-block" />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-amber-500 inline-block" />Ad Spend</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Cross-channel alerts + Goal tracker ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" />
                  Cross-Channel Alerts
                </CardTitle>
                <Link href="/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
                  All alerts <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {ALERTS.map((a, i) => (
                <Link key={i} href={a.href}>
                  <div className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 hover:opacity-80 transition-opacity cursor-pointer",
                    a.level === "high"     ? "border-red-200    bg-red-50    dark:bg-red-950/20    dark:border-red-900"    :
                    a.level === "medium"   ? "border-amber-200  bg-amber-50  dark:bg-amber-950/20  dark:border-amber-900"  :
                                             "border-green-200  bg-green-50  dark:bg-green-950/20  dark:border-green-900"
                  )}>
                    {a.level === "positive"
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      : a.level === "high"
                      ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{a.platform}</p>
                      <p className="text-sm font-semibold leading-tight mt-0.5">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{a.detail}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Goal tracker */}
          <GoalTracker
            actual={{
              revenue: GOAL_DATA.revenue,
              users:   GOAL_DATA.users,
              roas:    GOAL_DATA.roas,
            }}
          />
        </div>

        {/* ── Quick nav to platform deep-dives ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Deep-Dive Reports
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "All Campaigns",   href: "/ads",        icon: "📣", desc: "Ads across all platforms" },
              { label: "Sales Funnel",    href: "/funnel",     icon: "📊", desc: "Channel conversion funnel" },
              { label: "Traffic",         href: "/traffic",    icon: "📈", desc: "Sessions & acquisition" },
              { label: "By Country",      href: "/countries",  icon: "🌍", desc: "Geo revenue & users" },
              { label: "SEO",             href: "/seo",        icon: "🔍", desc: "Search Console insights" },
              { label: "Attribution",     href: "/attribution",icon: "🎯", desc: "Cross-channel credit" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className="group flex flex-col gap-2 rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="text-2xl">{nav.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{nav.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{nav.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </PageContent>
    </>
  );
}
