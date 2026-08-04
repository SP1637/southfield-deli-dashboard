"use client";

import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Sliders,
  ShoppingCart, BarChart3, Calendar, Zap, ArrowRight, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const FORECAST_DATA = [
  { month: "Feb", actual: 281,  forecast: null,  low: null,  high: null  },
  { month: "Mar", actual: 304,  forecast: null,  low: null,  high: null  },
  { month: "Apr", actual: 289,  forecast: null,  low: null,  high: null  },
  { month: "May", actual: 318,  forecast: null,  low: null,  high: null  },
  { month: "Jun", actual: 342,  forecast: null,  low: null,  high: null  },
  { month: "Jul", actual: 334,  forecast: 334,   low: 334,   high: 334   },
  { month: "Aug", actual: null, forecast: 351,   low: 332,   high: 370   },
  { month: "Sep", actual: null, forecast: 368,   low: 344,   high: 392   },
  { month: "Oct", actual: null, forecast: 389,   low: 359,   high: 419   },
  { month: "Nov", actual: null, forecast: 421,   low: 385,   high: 457   },
  { month: "Dec", actual: null, forecast: 458,   low: 414,   high: 502   },
];

const SEASONALITY = [
  { month: "Jan", index: 72 }, { month: "Feb", index: 68 },
  { month: "Mar", index: 81 }, { month: "Apr", index: 85 },
  { month: "May", index: 92 }, { month: "Jun", index: 96 },
  { month: "Jul", index: 88 }, { month: "Aug", index: 91 },
  { month: "Sep", index: 94 }, { month: "Oct", index: 108 },
  { month: "Nov", index: 138 }, { month: "Dec", index: 162 },
];

const MODULES = [
  { label: "Revenue Forecast",   href: "/revenue-forecast",   icon: DollarSign,  value: "£458k",   sub: "Dec projection",  color: "text-primary" },
  { label: "Lead Forecast",      href: "/lead-forecast",      icon: Users,       value: "4,820",   sub: "Next 30 days",    color: "text-blue-500" },
  { label: "Budget Forecast",    href: "/budget-forecast",    icon: Sliders,     value: "£112k",   sub: "Required spend",  color: "text-violet-500" },
  { label: "Sales Forecast",     href: "/sales-forecast",     icon: ShoppingCart,value: "3,940",   sub: "Units / month",   color: "text-emerald-500" },
  { label: "Demand Forecast",    href: "/demand-forecast",    icon: BarChart3,   value: "+14%",    sub: "Demand lift",     color: "text-amber-500" },
  { label: "Seasonality",        href: "/seasonality",        icon: Calendar,    value: "Q4 +62%", sub: "vs annual avg",   color: "text-pink-500" },
  { label: "Predictive Trends",  href: "/predictive-trends",  icon: Zap,         value: "3 trends",sub: "Emerging",        color: "text-emerald-500" },
];

const HEADLINE_KPIS = [
  { label: "Revenue (Aug forecast)", value: "£351k", delta: "+5.1%", up: true },
  { label: "Q4 Peak (Dec forecast)", value: "£458k", delta: "+37%",  up: true },
  { label: "Forecast Accuracy",      value: "93.2%", delta: "+1.8pp",up: true },
  { label: "Confidence Band",        value: "±11%",  delta: "30-day", up: true },
];

export default function ForecastIntelligencePage() {
  const now = "Jul";

  return (
    <>
      <PageHeader title="Forecast Intelligence" />
      <PageContent>

        {/* ── Hero ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-bold text-primary">Executives love forecasts.</p>
            <p className="text-xs text-muted-foreground">Every number here is a prediction with a confidence band — not a guess.</p>
          </div>
        </div>

        {/* ── 4 KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {HEADLINE_KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
              <p className="text-2xl font-bold">{k.value}</p>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", k.up ? "text-emerald-500" : "text-red-500")}>
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {k.delta}
              </span>
            </div>
          ))}
        </div>

        {/* ── Revenue forecast chart ── */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">Revenue Forecast</p>
              <p className="text-xs text-muted-foreground">Actual (Feb–Jul) · Forecast with confidence band (Aug–Dec)</p>
            </div>
            <Link href="/revenue-forecast" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Full forecast <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-primary inline-block" /> Actual</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-primary/40 inline-block border border-primary/50 border-dashed" /> Forecast</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-primary/10 inline-block" /> Confidence band</span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={FORECAST_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}k`} domain={[200, 520]} />
              <Tooltip formatter={(v: number, name: string) => [`£${v}k`, name === "high" ? "Upper" : name === "low" ? "Lower" : name === "forecast" ? "Forecast" : "Actual"]} />
              <ReferenceLine x={now} stroke="hsl(var(--border))" strokeDasharray="4 4" label={{ value: "Today", position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              {/* Confidence band */}
              <Area type="monotone" dataKey="high" stroke="transparent" fill="url(#bandGrad)" connectNulls />
              <Area type="monotone" dataKey="low"  stroke="transparent" fill="white" fillOpacity={1} connectNulls />
              {/* Forecast line */}
              <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 3" fill="transparent" dot={{ r: 3, fill: "#6366f1" }} connectNulls />
              {/* Actual line */}
              <Area type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#actualGrad)" dot={{ r: 3, fill: "#6366f1" }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Seasonality strip ── */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold">Seasonality Index</p>
              <p className="text-xs text-muted-foreground">100 = average. Q4 spikes are predictable — plan budget accordingly.</p>
            </div>
            <Link href="/seasonality" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Details <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {SEASONALITY.map((s) => {
              const pct = (s.index / 165) * 100;
              const isCurrent = s.month === "Jul";
              const isHigh = s.index >= 130;
              return (
                <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: "48px" }}>
                    <div
                      className={cn("w-full rounded-t-sm transition-all", isCurrent ? "bg-primary" : isHigh ? "bg-amber-500" : "bg-muted-foreground/30")}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{s.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-primary inline-block" /> Current</span>
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-amber-500 inline-block" /> Peak season</span>
          </div>
        </div>

        {/* ── Module grid ── */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">All Forecast Modules</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.label}
                  href={m.href}
                  className="group rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn("h-4 w-4", m.color)} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-tight">{m.label}</p>
                  <p className="text-lg font-bold">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground">{m.sub}</p>
                </Link>
              );
            })}
          </div>
        </div>

      </PageContent>
    </>
  );
}
