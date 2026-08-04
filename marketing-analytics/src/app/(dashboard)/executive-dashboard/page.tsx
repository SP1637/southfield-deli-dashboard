"use client";

import {
  TrendingUp, TrendingDown, AlertTriangle, Zap,
  DollarSign, Target, BarChart2, Brain,
  CheckCircle2, XCircle, Clock, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Demo data ─────────────────────────────────────────────────────────────────

const BRIEFING = {
  headline: "Yesterday revenue increased 12%.",
  bullets: [
    { type: "positive" as const, text: "Meta generated the highest ROAS — 5.8× on retargeting campaigns." },
    { type: "negative" as const, text: "Google Ads underperformed — CPC up 22%, conversions down 9%." },
    { type: "positive" as const, text: "Email campaign generated £42k — best performing send this quarter." },
    { type: "warning" as const, text: "Two competitors launched promotions — monitor pricing this week." },
  ],
  recommendation: "Increase Meta budget by £500/day and pause underperforming Google search terms.",
};

const HEALTH_SCORES = [
  {
    label: "Business Health",
    score: 74,
    delta: +3,
    color: "#10b981",
    breakdown: [
      { label: "Revenue growth",    score: 82 },
      { label: "Profit margin",     score: 68 },
      { label: "Customer health",   score: 71 },
    ],
  },
  {
    label: "Marketing Health",
    score: 61,
    delta: -5,
    color: "#f59e0b",
    breakdown: [
      { label: "Channel efficiency", score: 58 },
      { label: "Audience growth",    score: 74 },
      { label: "Content performance",score: 52 },
    ],
  },
];

const REVENUE_TREND = [
  { day: "Mon", actual: 38200, forecast: 36000 },
  { day: "Tue", actual: 41500, forecast: 38000 },
  { day: "Wed", actual: 36800, forecast: 40000 },
  { day: "Thu", actual: 44200, forecast: 41000 },
  { day: "Fri", actual: 52100, forecast: 43000 },
  { day: "Sat", actual: 48600, forecast: 44000 },
  { day: "Sun", actual: 39400, forecast: 38000 },
];

const KPIS = [
  { label: "Revenue",      value: "£334.2k", delta: +12.4, up: true,  icon: DollarSign, sub: "vs last period" },
  { label: "ROI",          value: "4.2×",    delta: +8.1,  up: true,  icon: Target,     sub: "blended ROAS" },
  { label: "Forecast",     value: "£380k",   delta: +13.8, up: true,  icon: BarChart2,  sub: "next 30 days" },
  { label: "Ad Spend",     value: "£79.4k",  delta: +18.2, up: false, icon: TrendingUp, sub: "this period" },
];

const OPPORTUNITIES = [
  {
    title: "Scale Meta retargeting",
    detail: "5.8× ROAS — budget headroom available before saturation",
    impact: "+£18k/week",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Email winback sequence",
    detail: "4,200 lapsed customers — 34% avg open rate in segment",
    impact: "+£9.4k",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Organic SEO momentum",
    detail: "3 keywords ranking pg 2 — one push from page 1 traffic",
    impact: "+2.1k sessions",
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

const RISKS = [
  {
    title: "Google Ads efficiency dropping",
    detail: "CPC +22%, conversions –9% — review match types and negatives",
    severity: "high" as const,
    icon: AlertTriangle,
  },
  {
    title: "Two competitor promotions live",
    detail: "H&M and Zara running 20–30% off — monitor conversion rate",
    severity: "medium" as const,
    icon: AlertTriangle,
  },
  {
    title: "Checkout drop-off increased",
    detail: "Payment step abandonment at 74% — likely UX or payment issue",
    severity: "high" as const,
    icon: XCircle,
  },
];

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7} stroke="hsl(var(--muted))" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7}
        stroke={color} strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExecutiveDashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader title="Executive Dashboard" />
      <PageContent>

        {/* ── Morning briefing ── */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Executive Briefing</p>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground border rounded-full px-2 py-0.5">
                  <Clock className="h-2.5 w-2.5" /> Today
                </span>
              </div>
              <h2 className="text-xl font-bold mt-0.5">{greeting}. {BRIEFING.headline}</h2>
            </div>
          </div>

          <div className="space-y-2 pl-1">
            {BRIEFING.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center",
                  b.type === "positive" ? "bg-emerald-500/15" : b.type === "negative" ? "bg-red-500/15" : "bg-amber-500/15"
                )}>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    b.type === "positive" ? "bg-emerald-500" : b.type === "negative" ? "bg-red-500" : "bg-amber-500"
                  )} />
                </div>
                <p className="text-sm leading-snug">{b.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 flex items-start gap-3">
            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-0.5">Top Recommendation</p>
              <p className="text-sm font-medium">{BRIEFING.recommendation}</p>
            </div>
          </div>
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                <div className="flex items-center justify-between">
                  <span className={cn("flex items-center gap-0.5 text-xs font-semibold",
                    k.up ? "text-emerald-500" : "text-red-500"
                  )}>
                    {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {k.delta > 0 ? "+" : ""}{k.delta}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">{k.sub}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Health + Revenue chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Health scores */}
          <div className="space-y-3">
            {HEALTH_SCORES.map((h) => (
              <div key={h.label} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <ScoreRing score={h.score} color={h.color} size={72} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{h.score}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{h.label}</p>
                    <p className={cn("text-xs font-medium", h.delta > 0 ? "text-emerald-500" : "text-red-500")}>
                      {h.delta > 0 ? "+" : ""}{h.delta} vs last week
                    </p>
                    <div className="mt-2 space-y-1">
                      {h.breakdown.map((b) => (
                        <div key={b.label} className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${b.score}%`, background: h.color }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-20 truncate">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue vs Forecast chart */}
          <div className="lg:col-span-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold">Revenue vs Forecast</p>
                <p className="text-xs text-muted-foreground">This week — actual vs projected</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-primary inline-block" /> Actual</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-primary/30 inline-block border border-dashed border-primary/50" /> Forecast</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_TREND} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`£${v.toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                <Area type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} fill="url(#actual)" dot={{ r: 3, fill: "#6366f1" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Opportunities + Risks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Opportunities */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" /> Opportunities
              </p>
              <Link href="/opportunities" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {OPPORTUNITIES.map((o, i) => {
              const Icon = o.icon;
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", o.bg)}>
                    <Icon className={cn("h-4 w-4", o.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{o.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{o.detail}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 shrink-0">{o.impact}</span>
                </div>
              );
            })}
          </div>

          {/* Risks */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Risks
              </p>
              <Link href="/problems" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {RISKS.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className={cn(
                  "flex items-start gap-3 rounded-lg p-3",
                  r.severity === "high" ? "bg-red-500/5 border border-red-500/20" : "bg-amber-500/5 border border-amber-500/20"
                )}>
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", r.severity === "high" ? "text-red-500" : "text-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium leading-tight">{r.title}</p>
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                        r.severity === "high" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                      )}>{r.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{r.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-5 py-4 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold">Want the full causal breakdown?</p>
            <p className="text-xs text-muted-foreground">See exactly why revenue changed and get a prioritised action plan.</p>
          </div>
          <Link
            href="/executive-summary"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Open Decision Intelligence <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </PageContent>
    </>
  );
}
