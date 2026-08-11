"use client";

import Link from "next/link";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  Percent, Target, UserPlus, Gem, Share2, Zap, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Demo data ─────────────────────────────────────────────────────────────────

const REVENUE_TREND = [
  { month: "Feb", revenue: 281000, orders: 2840, profit: 89000 },
  { month: "Mar", revenue: 304000, orders: 3120, profit: 96000 },
  { month: "Apr", revenue: 289000, orders: 2950, profit: 88000 },
  { month: "May", revenue: 318000, orders: 3280, profit: 102000 },
  { month: "Jun", revenue: 342000, orders: 3540, profit: 112000 },
  { month: "Jul", revenue: 334000, orders: 3420, profit: 108000 },
];

const CHANNEL_REVENUE = [
  { channel: "Google Ads",  revenue: 128400, color: "#4285F4" },
  { channel: "Meta Ads",    revenue: 89200,  color: "#1877F2" },
  { channel: "Organic",     revenue: 62100,  color: "#10b981" },
  { channel: "Email",       revenue: 42000,  color: "#f59e0b" },
  { channel: "Direct",      revenue: 18300,  color: "#8b5cf6" },
  { channel: "TikTok",      revenue: 12800,  color: "#010101" },
];

const MODULES = [
  { label: "Revenue",               href: "/revenue",               icon: DollarSign, value: "£334.2k", delta: +12.4, up: true,  color: "text-emerald-500" },
  { label: "Orders",                href: "/orders",                icon: ShoppingCart,value: "3,420",  delta: +8.2,  up: true,  color: "text-blue-500" },
  { label: "Profit",                href: "/profit",                icon: TrendingUp,  value: "£108k",  delta: +14.1, up: true,  color: "text-emerald-500" },
  { label: "Margin",                href: "/margin",                icon: Percent,     value: "32.3%",  delta: +1.4,  up: true,  color: "text-emerald-500" },
  { label: "ROAS",                  href: "/roas",                  icon: Target,      value: "4.21×",  delta: +8.1,  up: true,  color: "text-emerald-500" },
  { label: "CAC",                   href: "/cac",                   icon: UserPlus,    value: "£38.40", delta: +22.3, up: false, color: "text-red-500" },
  { label: "LTV",                   href: "/ltv",                   icon: Gem,         value: "£284",   delta: +6.8,  up: true,  color: "text-emerald-500" },
  { label: "Revenue Attribution",   href: "/revenue-attribution",   icon: Share2,      value: "8 paths",delta: 0,     up: true,  color: "text-muted-foreground" },
  { label: "Forecast",              href: "/forecasts",             icon: TrendingUp,  value: "£380k",  delta: +13.8, up: true,  color: "text-primary" },
  { label: "Revenue Opportunities", href: "/revenue-opportunities", icon: Zap,         value: "+£42k",  delta: 0,     up: true,  color: "text-amber-500" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function RevenueIntelligencePage() {
  const totalRevenue = "£334,200";
  const totalProfit = "£108,000";
  const margin = "32.3%";
  const ltv = "£284";

  return (
    <>
      <PageHeader title="Revenue Intelligence" />
      <PageContent>

        {/* ── Hero tagline ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-bold text-primary">Executives care about revenue. Not clicks.</p>
            <p className="text-xs text-muted-foreground">Every metric here traces back to one question: are we making money?</p>
          </div>
        </div>

        {/* ── 4 hero KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue", value: totalRevenue, delta: "+12.4%", up: true,  icon: DollarSign },
            { label: "Gross Profit",  value: totalProfit,  delta: "+14.1%", up: true,  icon: TrendingUp },
            { label: "Margin",        value: margin,       delta: "+1.4pp", up: true,  icon: Percent },
            { label: "LTV",           value: ltv,          delta: "+6.8%",  up: true,  icon: Gem },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
                <p className="text-2xl font-bold">{k.value}</p>
                <span className={cn("text-xs font-semibold flex items-center gap-0.5", k.up ? "text-emerald-500" : "text-red-500")}>
                  {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {k.delta}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Revenue trend chart ── */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">Revenue & Profit Trend</p>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-primary inline-block" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-500 inline-block" /> Profit</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_TREND} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`£${v.toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: "#6366f1" }} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profGrad)" dot={{ r: 3, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Revenue by channel ── */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold mb-4">Revenue by Channel</p>
          <div className="space-y-3">
            {CHANNEL_REVENUE.map((c) => {
              const pct = Math.round((c.revenue / CHANNEL_REVENUE.reduce((a, b) => a + b.revenue, 0)) * 100);
              return (
                <div key={c.channel} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{c.channel}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                  <span className="text-xs font-semibold w-16 text-right">£{(c.revenue / 1000).toFixed(1)}k</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Module grid ── */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">All Revenue Modules</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
                  {m.delta !== 0 && (
                    <span className={cn("text-[10px] font-semibold", m.up ? "text-emerald-500" : "text-red-500")}>
                      {m.delta > 0 ? "+" : ""}{m.delta}%
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

      </PageContent>
    </>
  );
}
