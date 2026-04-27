"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Zap, RefreshCw, ArrowRight, Activity,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCompact, formatCurrency, cn } from "@/lib/utils";
import {
  DEMO_FUNNEL_KPIS, DEMO_FUNNEL_TIMESERIES, DEMO_CHANNEL_ROWS,
  DEMO_TRAFFIC_KPIS, DEMO_FUNNEL_STEPS,
} from "@/lib/demo-data";

// ── Derived overview data ────────────────────────────────────────────────────

const AD_SPEND_EST = 6_071_429; // so ROAS = 4.2x
const ROAS = DEMO_FUNNEL_KPIS.grossPurchaseRevenue / AD_SPEND_EST;

const CHANNEL_ROAS = [
  { name: "Email",    revenue: 2_600_000, spend:    120_000, roas: 21.7, users: 344_200 },
  { name: "YouTube",  revenue: 5_000_000, spend:    980_000, roas:  5.1, users: 343_400 },
  { name: "Google",   revenue: 2_500_000, spend:    658_000, roas:  3.8, users: 172_200 },
  { name: "Direct",   revenue: 2_600_000, spend:          0, roas: Infinity, users: 171_900 },
  { name: "Bing",     revenue: 2_600_000, spend:    896_000, roas:  2.9, users: 171_900 },
  { name: "OpenAI",   revenue: 2_600_000, spend:          0, roas: Infinity, users: 171_800 },
];

const REVENUE_TREND = DEMO_FUNNEL_TIMESERIES.slice(-21).map((r) => ({
  date: r.date.slice(5),
  revenue: Math.round(r.value * 425),
  target: 850_000,
}));

const ANOMALIES = [
  {
    level: "high" as const,
    title: "Payment step conversion dropped",
    detail: "27.5% below 30-day baseline · Yesterday 11:00–14:00 UTC",
    action: "/funnel",
    actionLabel: "View funnel →",
  },
  {
    level: "medium" as const,
    title: "Mobile conversion gap widening",
    detail: "Mobile converts 40% lower than desktop · Traffic up 34%",
    action: "/traffic",
    actionLabel: "View traffic →",
  },
  {
    level: "positive" as const,
    title: "Email ROAS hit all-time high",
    detail: "21.7x return this week · $2.6M from $120K spend",
    action: "/funnel",
    actionLabel: "See report →",
  },
];

const RADAR_DATA = [
  { metric: "Reach",      score: 82 },
  { metric: "Conversion", score: 71 },
  { metric: "Retention",  score: 88 },
  { metric: "ROAS",       score: 94 },
  { metric: "Velocity",   score: 67 },
  { metric: "Quality",    score: 79 },
];

const SPARKLINES = {
  revenue: DEMO_FUNNEL_TIMESERIES.slice(-14).map((r) => r.value * 425),
  users:   DEMO_FUNNEL_TIMESERIES.slice(-14).map((r) => r.value),
  roas:    [3.8, 3.9, 4.0, 3.9, 4.1, 4.2, 4.1, 4.3, 4.2, 4.2, 4.2, 4.3, 4.2, 4.2],
  conv:    DEMO_FUNNEL_TIMESERIES.slice(-14).map((r) => r.value * 0.001685),
  spend:   DEMO_FUNNEL_TIMESERIES.slice(-14).map((r) => r.value * 101),
};

// ── Gauge component ──────────────────────────────────────────────────────────

function RoasGauge({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const angle = -145 + pct * 290;
  const r = 56;
  const cx = 70; const cy = 70;
  const toXY = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });
  const start = toXY(-145);
  const end = toXY(-145 + 290);
  const current = toXY(angle);
  const largeArc = 290 > 180 ? 1 : 0;

  const zones = [
    { from: -145, to: -48, color: "#ef4444" },
    { from: -48,  to:  48, color: "#f59e0b" },
    { from:  48,  to: 145, color: "#10b981" },
  ];

  return (
    <svg width="140" height="90" viewBox="0 0 140 90" className="overflow-visible">
      {/* Background arc */}
      <path
        d={`M${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y}`}
        fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round"
      />
      {/* Coloured zones */}
      {zones.map((z) => {
        const s = toXY(z.from); const e = toXY(z.to);
        const la = Math.abs(z.to - z.from) > 180 ? 1 : 0;
        return (
          <path key={z.color}
            d={`M${s.x},${s.y} A${r},${r} 0 ${la} 1 ${e.x},${e.y}`}
            fill="none" stroke={z.color} strokeWidth="10" strokeLinecap="butt" opacity="0.35"
          />
        );
      })}
      {/* Progress arc */}
      {pct > 0.01 && (() => {
        const s2 = toXY(-145); const e2 = toXY(angle);
        const la2 = pct * 290 > 180 ? 1 : 0;
        return (
          <path d={`M${s2.x},${s2.y} A${r},${r} 0 ${la2} 1 ${e2.x},${e2.y}`}
            fill="none" stroke="#6366f1" strokeWidth="10" strokeLinecap="round" />
        );
      })()}
      {/* Needle dot */}
      <circle cx={current.x} cy={current.y} r="6" fill="#6366f1" />
      <circle cx={current.x} cy={current.y} r="3" fill="white" />
      {/* Value */}
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="20" fontWeight="700"
        fill="hsl(var(--foreground))" fontFamily="sans-serif">
        {value.toFixed(1)}x
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9"
        fill="hsl(var(--muted-foreground))" fontFamily="sans-serif">
        ROAS
      </text>
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { data: session } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {greet()}{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s your marketing performance at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border bg-green-50 dark:bg-green-950/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live data
          </span>
          <button
            onClick={handleRefresh}
            className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── 5 KPI cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Gross Revenue"
          value={DEMO_FUNNEL_KPIS.grossPurchaseRevenue}
          delta={DEMO_FUNNEL_KPIS.grossPurchaseRevenueDelta}
          format="currency"
          sparkline={SPARKLINES.revenue}
          sparklineColor="#10b981"
          comparisonLabel="vs prior"
        />
        <KpiCard
          label="ROAS"
          value={Math.round(ROAS * 10) / 10}
          delta={0.031}
          sparkline={SPARKLINES.roas}
          sparklineColor="#6366f1"
          subLabel="vs $6.1M est. spend"
          comparisonLabel="vs prior"
        />
        <KpiCard
          label="Total Users"
          value={DEMO_FUNNEL_KPIS.totalUsers}
          delta={DEMO_FUNNEL_KPIS.totalUsersDelta}
          sparkline={SPARKLINES.users}
          sparklineColor="#8b5cf6"
          comparisonLabel="vs prior"
        />
        <KpiCard
          label="Purchases"
          value={DEMO_FUNNEL_KPIS.purchases}
          delta={DEMO_FUNNEL_KPIS.purchasesDelta}
          sparkline={SPARKLINES.conv}
          sparklineColor="#f59e0b"
          comparisonLabel="vs prior"
        />
        <KpiCard
          label="Ad Spend (est.)"
          value={AD_SPEND_EST}
          delta={0.018}
          format="currency"
          sparkline={SPARKLINES.spend}
          sparklineColor="#ef4444"
          comparisonLabel="vs prior"
        />
      </div>

      {/* ── Row 2: Revenue trend + Performance radar ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Revenue vs Daily Target — Last 21 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_TREND} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v: number, name: string) => [
                    formatCurrency(v),
                    name === "revenue" ? "Revenue" : "Daily Target",
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="target" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-indigo-500 inline-block" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-emerald-500 inline-block border-dashed border-t" />Daily target ($850K)</span>
            </div>
          </CardContent>
        </Card>

        {/* Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Overall score: <span className="font-bold text-foreground">80 / 100</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Channel ROAS + ROAS Gauge ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Channel ROAS bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Revenue by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={CHANNEL_ROAS}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {CHANNEL_ROAS.map((c, i) => (
                    <Cell
                      key={c.name}
                      fill={["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9"][i]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ROAS gauge + quick stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Blended ROAS
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <RoasGauge value={parseFloat(ROAS.toFixed(1))} />
            <div className="w-full space-y-2">
              {CHANNEL_ROAS.filter((c) => isFinite(c.roas)).slice(0, 3).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden w-20">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min((c.roas / 25) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="font-semibold w-10 text-right">{c.roas.toFixed(1)}x</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Anomalies + Funnel snapshot ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Anomaly alerts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Alerts & Anomalies
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                <Activity className="h-2.5 w-2.5 mr-1" />
                Auto-detected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ANOMALIES.map((a) => (
              <div
                key={a.title}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  a.level === "high"
                    ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                    : a.level === "medium"
                    ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900"
                    : "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900"
                )}
              >
                {a.level === "positive" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", a.level === "high" ? "text-red-600" : "text-amber-600")} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.detail}</p>
                </div>
                <Link
                  href={a.action}
                  className="shrink-0 text-xs font-medium text-primary hover:underline whitespace-nowrap"
                >
                  {a.actionLabel}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Funnel snapshot */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Funnel Snapshot
              </CardTitle>
              <Link href="/funnel" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Full report <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_FUNNEL_STEPS.map((step, i) => {
              const pct = step.rateFromTop * 100;
              const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#c026d3", "#ec4899"];
              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{step.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-muted-foreground">{formatCompact(step.value)}</span>
                      <span className="font-bold w-12 text-right" style={{ color: colors[i] }}>
                        {(pct).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overall conversion</span>
              <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                16.85%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Quick navigation tiles ───────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Deep-dive reports
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sales Funnel",    href: "/funnel",      icon: "📊", desc: "Channel-level funnel breakdown" },
            { label: "By Country",      href: "/countries",   icon: "🌍", desc: "Geo performance & revenue" },
            { label: "By Item",         href: "/items",       icon: "📦", desc: "Product conversion & revenue" },
            { label: "Traffic",         href: "/traffic",     icon: "📈", desc: "Sessions, users & key events" },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 duration-200"
            >
              <span className="text-2xl">{nav.icon}</span>
              <div>
                <p className="text-sm font-semibold">{nav.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{nav.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
