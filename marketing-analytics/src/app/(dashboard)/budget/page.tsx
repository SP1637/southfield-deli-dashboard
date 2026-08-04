"use client";

import { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Sparkles, Zap, Target, BarChart3, Clock, ArrowRight,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type PacingStatus = "ahead" | "on_pace" | "behind" | "overspent";

interface PlatformBudget {
  id: string;
  platform: string;
  color: string;
  monthlyBudget: number;
  spent: number;
  dailyAvg: number;
  projectedEOM: number;
  status: PacingStatus;
  daysLeft: number;
  dailyBudget: number;
  dailySeries: Array<{ day: string; actual: number; ideal: number }>;
  roas: number;
  revenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PACING_CONFIG: Record<PacingStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ahead:     { label: "Ahead of Pace",  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40",    icon: TrendingUp   },
  on_pace:   { label: "On Pace",        color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40",icon: CheckCircle2 },
  behind:    { label: "Behind Pace",    color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/40",  icon: TrendingDown },
  overspent: { label: "Over Budget",    color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/40",      icon: AlertCircle  },
};

function makeDailySeries(spent: number, budget: number, days = 31, daysLeft = 13) {
  const series: Array<{ day: string; actual: number; ideal: number }> = [];
  const daysPassed = days - daysLeft;
  const dailyIdeal = budget / days;
  const monthName = new Date().toLocaleString("default", { month: "long" });
  let cumActual = 0;
  for (let d = 1; d <= daysPassed; d++) {
    const variance = (Math.random() - 0.5) * dailyIdeal * 0.3;
    cumActual += dailyIdeal + variance;
    series.push({ day: `${monthName} ${d}`, actual: Math.round(Math.min(cumActual, spent)), ideal: Math.round(dailyIdeal * d) });
  }
  return series;
}

const PLATFORMS: PlatformBudget[] = [
  {
    id: "google",   platform: "Google Ads",  color: "#4285f4",
    monthlyBudget: 8200, spent: 6140, dailyAvg: 338, projectedEOM: 8916, daysLeft: 13, dailyBudget: 265,
    status: "ahead", roas: 4.44, revenue: 27261,
    dailySeries: makeDailySeries(6140, 8200),
  },
  {
    id: "meta",     platform: "Meta Ads",    color: "#0082fb",
    monthlyBudget: 4500, spent: 3100, dailyAvg: 172, projectedEOM: 4337, daysLeft: 13, dailyBudget: 145,
    status: "ahead", roas: 3.21, revenue: 9951,
    dailySeries: makeDailySeries(3100, 4500),
  },
  {
    id: "tiktok",   platform: "TikTok Ads",  color: "#fe2c55",
    monthlyBudget: 2400, spent: 1180, dailyAvg: 65, projectedEOM: 2028, daysLeft: 13, dailyBudget: 94,
    status: "behind", roas: 2.88, revenue: 3398,
    dailySeries: makeDailySeries(1180, 2400),
  },
  {
    id: "snapchat", platform: "Snapchat Ads",color: "#fffc00",
    monthlyBudget: 1200, spent: 880, dailyAvg: 48, projectedEOM: 1256, daysLeft: 13, dailyBudget: 39,
    status: "on_pace", roas: 1.52, revenue: 1338,
    dailySeries: makeDailySeries(880, 1200),
  },
  {
    id: "linkedin", platform: "LinkedIn Ads",color: "#0a66c2",
    monthlyBudget: 1500, spent: 1400, dailyAvg: 78, projectedEOM: 1614, daysLeft: 13, dailyBudget: 49,
    status: "overspent", roas: 0, revenue: 0,
    dailySeries: makeDailySeries(1400, 1500),
  },
];

const TOTAL = {
  budget:   PLATFORMS.reduce((s, p) => s + p.monthlyBudget, 0),
  spent:    PLATFORMS.reduce((s, p) => s + p.spent, 0),
  projected:PLATFORMS.reduce((s, p) => s + p.projectedEOM, 0),
  revenue:  PLATFORMS.reduce((s, p) => s + p.revenue, 0),
};

const AI_BUDGET_INSIGHTS = [
  { icon: AlertCircle, color: "text-red-500",    text: "LinkedIn is on track to overspend by $114. Reduce daily budget from $78 to $49 immediately." },
  { icon: TrendingDown,color: "text-amber-500",  text: "TikTok is underpacing — only 49% of budget used with 42% of month remaining. Increase daily cap by $29 or expect $372 unspent." },
  { icon: Zap,         color: "text-blue-500",   text: "Google is ahead of pace ($338/day vs $265 ideal). Lower daily cap by 15% or you'll overspend by $716 this month." },
  { icon: CheckCircle2,color: "text-emerald-500", text: "Snapchat is near-perfectly paced. No action needed — ROAS (1.52×) is below target though; consider pausing 2 ad sets." },
];

// ─── Components ───────────────────────────────────────────────────────────────
function BurnChart({ series, budget, color }: { series: PlatformBudget["dailySeries"]; budget: number; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <ComposedChart data={series} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" tick={false} />
        <YAxis hide />
        <Tooltip
          formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name === "actual" ? "Actual spend" : "Ideal pace"]}
          contentStyle={{ fontSize: 11 }}
        />
        <Area type="monotone" dataKey="actual" stroke={color}     fill={color + "22"} strokeWidth={2} />
        <Line  type="monotone" dataKey="ideal"  stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function PlatformCard({ p }: { p: PlatformBudget }) {
  const [open, setOpen] = useState(false);
  const cfg = PACING_CONFIG[p.status];
  const StatusIcon = cfg.icon;
  const spentPct = Math.round((p.spent / p.monthlyBudget) * 100);
  const daysElapsed = 31 - p.daysLeft;
  const idealPct = Math.round((daysElapsed / 31) * 100);
  const variance = p.spent - (p.monthlyBudget / 31) * daysElapsed;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <div>
              <p className="font-semibold text-foreground">{p.platform}</p>
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mt-1", cfg.bg, cfg.color)}>
                <StatusIcon className="h-3 w-3" /> {cfg.label}
              </span>
            </div>
          </div>
          <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Budget bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Spent: <span className="font-semibold text-foreground">${p.spent.toLocaleString()}</span></span>
            <span>Budget: <span className="font-semibold text-foreground">${p.monthlyBudget.toLocaleString()}</span></span>
          </div>
          <div className="relative h-2.5 rounded-full bg-muted overflow-visible">
            {/* Ideal position marker */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/50 z-10" style={{ left: `${idealPct}%` }} />
            {/* Actual spend */}
            <div className="h-full rounded-full" style={{ width: `${Math.min(spentPct, 100)}%`, backgroundColor: p.color, opacity: 0.85 }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{spentPct}% spent</span>
            <span>{idealPct}% ideal pace</span>
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Daily avg</p>
            <p className="text-sm font-bold text-foreground">${p.dailyAvg}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">EOM projection</p>
            <p className={cn("text-sm font-bold", p.projectedEOM > p.monthlyBudget * 1.05 ? "text-red-600" : p.projectedEOM < p.monthlyBudget * 0.9 ? "text-amber-600" : "text-emerald-600")}>
              ${p.projectedEOM.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-sm font-bold text-foreground">{p.roas > 0 ? `${p.roas}×` : "—"}</p>
          </div>
        </div>

        {/* Variance badge */}
        <div className={cn("mt-3 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center justify-between", variance > 0 ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300")}>
          <span>{variance > 0 ? `$${Math.abs(Math.round(variance)).toLocaleString()} ahead of pace` : `$${Math.abs(Math.round(variance)).toLocaleString()} behind pace`}</span>
          <span className="text-muted-foreground">{p.daysLeft} days left</span>
        </div>
      </div>

      {/* Expanded chart */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Daily Burn vs Ideal Pace</p>
          <BurnChart series={p.dailySeries} budget={p.monthlyBudget} color={p.color} />
          <div className="flex justify-end mt-2 gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: p.color }} /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block rounded bg-muted-foreground/50 border-dashed border-t-2 border-muted-foreground/50" /> Ideal</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const usedPct = Math.round((TOTAL.spent / TOTAL.budget) * 100);
  const projectedPct = Math.round((TOTAL.projected / TOTAL.budget) * 100);

  // Spend distribution bar chart data
  const distData = PLATFORMS.map((p) => ({ name: p.platform.replace(" Ads", ""), spend: p.spent, budget: p.monthlyBudget - p.spent }));

  return (
    <>
      <PageHeader
        title="Budget Pacing"
        actions={
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })} · {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} days remaining</p>
            <p className="text-xs text-muted-foreground mt-0.5">Last synced: {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        }
      />
      <PageContent>

      {/* Total budget card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Monthly Budget</p>
            <p className="text-3xl font-bold text-foreground">${TOTAL.budget.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-xl font-bold text-foreground">${TOTAL.spent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{usedPct}% of budget</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">EOM Forecast</p>
              <p className={cn("text-xl font-bold", TOTAL.projected > TOTAL.budget * 1.02 ? "text-red-600" : "text-emerald-600")}>
                ${TOTAL.projected.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{projectedPct}% of budget</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-emerald-600">${Math.round(TOTAL.revenue / 1000)}k</p>
              <p className="text-xs text-muted-foreground">{(TOTAL.revenue / TOTAL.spent).toFixed(2)}× ROAS</p>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="space-y-1.5">
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${usedPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span className="font-medium text-foreground">${TOTAL.spent.toLocaleString()} spent ({usedPct}%)</span>
            <span>${TOTAL.budget.toLocaleString()}</span>
          </div>
        </div>

        {/* Stacked distribution chart */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Spend Distribution</p>
          <div className="space-y-2">
            {distData.map((row, i) => {
              const total = row.spend + row.budget;
              const spendPct = (row.spend / total) * 100;
              const budgetPct = (row.budget / total) * 100;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-[58px] shrink-0 text-right truncate">{row.name}</span>
                  <div className="flex flex-1 h-5 rounded overflow-hidden">
                    <div className="h-full" style={{ width: `${spendPct}%`, backgroundColor: "#8b5cf6" }} />
                    <div className="h-full bg-muted" style={{ width: `${budgetPct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-[56px] shrink-0 text-right">${(row.spend/1000).toFixed(1)}k</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-500 inline-block" /> Spent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted inline-block" /> Remaining</span>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">AI Budget Recommendations</span>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {AI_BUDGET_INSIGHTS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 px-3 py-2">
              <s.icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", s.color)} />
              <p className="text-xs text-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["on_pace", "ahead", "behind", "overspent"] as PacingStatus[]).map((status) => {
          const cfg = PACING_CONFIG[status];
          const Icon = cfg.icon;
          const count = PLATFORMS.filter((p) => p.status === status).length;
          return (
            <div key={status} className={cn("rounded-xl border border-border p-4 text-center", cfg.bg)}>
              <Icon className={cn("h-5 w-5 mx-auto mb-1", cfg.color)} />
              <p className={cn("text-xl font-bold", cfg.color)}>{count}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Platform cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {PLATFORMS.map((p) => <PlatformCard key={p.id} p={p} />)}
      </div>

      </PageContent>
    </>
  );
}
