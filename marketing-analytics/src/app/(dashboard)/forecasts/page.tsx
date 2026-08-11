"use client";

import { useState } from "react";
import {
  TrendingUp, Sparkles, Play, ChevronDown, Info,
  BarChart3, Zap, AlertCircle, CheckCircle2,
} from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
  BarChart, Bar,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ForecastMetric {
  id: string;
  label: string;
  platform: string;
  unit: string;
  currentValue: number;
  forecastValue: number;
  forecastGrowth: number; // %
  confidence: number;     // 0-100
  series: Array<{ month: string; actual?: number; forecast?: number; low?: number; high?: number }>;
}

// ─── Generate realistic forecast series ──────────────────────────────────────
function makeSeries(
  actuals: number[],
  months: string[],
  growthPct: number,
  bandPct = 0.12
): ForecastMetric["series"] {
  const result: ForecastMetric["series"] = actuals.map((v, i) => ({ month: months[i], actual: v }));
  const last = actuals[actuals.length - 1];
  const forecastMonths = ["Jun", "Jul", "Aug", "Sep"];
  forecastMonths.forEach((m, i) => {
    const g = Math.pow(1 + growthPct / 100, i + 1);
    const f = Math.round(last * g);
    result.push({ month: m, forecast: f, low: Math.round(f * (1 - bandPct)), high: Math.round(f * (1 + bandPct)) });
  });
  return result;
}

const MONTHS_ACT = ["Jan", "Feb", "Mar", "Apr", "May"];

const METRICS: ForecastMetric[] = [
  {
    id: "roas",
    label: "Blended ROAS",
    platform: "All Platforms",
    unit: "×",
    currentValue: 4.44,
    forecastValue: 5.21,
    forecastGrowth: 17.3,
    confidence: 88,
    series: makeSeries([3.1, 3.6, 3.9, 4.2, 4.44], MONTHS_ACT, 4.5, 0.08),
  },
  {
    id: "spend",
    label: "Total Ad Spend",
    platform: "All Platforms",
    unit: "$k",
    currentValue: 16.7,
    forecastValue: 22.4,
    forecastGrowth: 34.1,
    confidence: 81,
    series: makeSeries([9.2, 11.4, 13.1, 15.0, 16.7], MONTHS_ACT, 8, 0.15),
  },
  {
    id: "revenue",
    label: "Ad Revenue",
    platform: "All Platforms",
    unit: "$k",
    currentValue: 74.1,
    forecastValue: 116.7,
    forecastGrowth: 57.5,
    confidence: 76,
    series: makeSeries([28.5, 41.1, 51.2, 63.0, 74.1], MONTHS_ACT, 12, 0.18),
  },
  {
    id: "sessions",
    label: "Organic Sessions",
    platform: "Google Search Console",
    unit: "k",
    currentValue: 45.6,
    forecastValue: 72.3,
    forecastGrowth: 58.6,
    confidence: 68,
    series: makeSeries([28, 33, 37, 41, 45.6], MONTHS_ACT, 12, 0.22),
  },
];

// Scenario impact table
const SCENARIOS = [
  { name: "Conservative (−10% budget)", roas: 4.8, revenue: 96.2, spend: 19.8, sessions: 62.1 },
  { name: "Base Forecast",               roas: 5.2, revenue: 116.7, spend: 22.4, sessions: 72.3 },
  { name: "Aggressive (+20% budget)",   roas: 4.6, revenue: 138.4, spend: 30.1, sessions: 72.3 },
  { name: "SEO Recovery Plan",           roas: 5.2, revenue: 116.7, spend: 22.4, sessions: 98.5 },
];

const AI_FORECAST_INSIGHTS = [
  { icon: TrendingUp, color: "text-emerald-500", text: "ROAS is trending up at +4.5%/month — your Q3 forecast beats Databox industry benchmarks for e-commerce (avg 3.8×)." },
  { icon: AlertCircle, color: "text-amber-500",  text: "Organic Sessions have a 68% confidence due to high variance in the last 3 months. A link-building push in June could raise this to 85%." },
  { icon: Zap, color: "text-blue-500",           text: "Aggressive spend scenario yields +18% revenue but ROAS drops 0.6×. Only worth it if your LTV-to-CAC ratio exceeds 3:1." },
  { icon: CheckCircle2, color: "text-purple-500",text: "Ad Revenue forecast has strong R² = 0.94 — very reliable. Safe to commit to the $116k Q3 target with stakeholders." },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">{unit === "$k" ? `$${p.value}k` : unit === "×" ? `${p.value}×` : `${p.value}${unit}`}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ score }: { score: number }) {
  const cfg =
    score >= 85 ? { label: "High Confidence", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" } :
    score >= 70 ? { label: "Medium Confidence", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40"   } :
                  { label: "Low Confidence",    color: "text-red-600",   bg: "bg-red-50 dark:bg-red-950/40"       };
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.color, cfg.bg)}>
      {score}% {cfg.label}
    </span>
  );
}

// ─── Forecast Card ────────────────────────────────────────────────────────────
function ForecastCard({ metric, active, onClick }: { metric: ForecastMetric; active: boolean; onClick: () => void }) {
  const isUp = metric.forecastGrowth > 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
      )}
    >
      <p className="text-xs text-muted-foreground">{metric.platform}</p>
      <p className="font-semibold text-foreground mt-0.5">{metric.label}</p>
      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {metric.unit === "$k" ? `$${metric.forecastValue}k` : metric.unit === "×" ? `${metric.forecastValue}×` : `${metric.forecastValue}${metric.unit}`}
          </p>
          <p className="text-xs text-muted-foreground">by Sep 2026</p>
        </div>
        <span className={cn("text-sm font-semibold flex items-center gap-1", isUp ? "text-emerald-600" : "text-red-600")}>
          <TrendingUp className={cn("h-3.5 w-3.5", !isUp && "rotate-180")} />
          +{metric.forecastGrowth.toFixed(1)}%
        </span>
      </div>
      <div className="mt-3">
        <ConfidenceBadge score={metric.confidence} />
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ForecastsPage() {
  const [activeMetric, setActiveMetric] = useState<string>("roas");
  const [activeScenario, setActiveScenario] = useState<number>(1);

  const metric = METRICS.find((m) => m.id === activeMetric)!;

  return (
    <>
      <PageHeader
        title="Forecasts"
        tabs={[{ key: "saved", label: "Saved Forecasts" }, { key: "modeling", label: "Forecast Modeling" }]}
        activeTab="saved"
      />
      <PageContent>

      {/* AI Insights */}
      <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">AI Forecast Intelligence</span>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {AI_FORECAST_INSIGHTS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 px-3 py-2">
              <s.icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", s.color)} />
              <p className="text-xs text-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metric selector cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS.map((m) => (
          <ForecastCard key={m.id} metric={m} active={activeMetric === m.id} onClick={() => setActiveMetric(m.id)} />
        ))}
      </div>

      {/* Main forecast chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-foreground">{metric.label} — Forecast to Sep 2026</h2>
            <div className="flex items-center gap-3 mt-1">
              <ConfidenceBadge score={metric.confidence} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Confidence band ±{Math.round((1 - metric.confidence / 100) * 150)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-primary inline-block rounded" /> Actual</span>
            <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-emerald-500 inline-block rounded border-dashed border-t-2 border-emerald-500" /> Forecast</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-500/20 inline-block" /> Confidence band</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={metric.series} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={48} />
            <Tooltip content={<CustomTooltip unit={metric.unit} />} />
            <ReferenceLine x="May" stroke="hsl(var(--border))" strokeDasharray="4 4" label={{ value: "Today", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            {/* Confidence band */}
            <Area dataKey="high" fill="#22c55e" stroke="transparent" fillOpacity={0.12} connectNulls />
            <Area dataKey="low"  fill="hsl(var(--background))" stroke="transparent" fillOpacity={1} connectNulls />
            {/* Lines */}
            <Line dataKey="actual"   stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line dataKey="forecast" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: "#22c55e" }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario Modeling */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Play className="h-4 w-4 text-primary" /> Scenario Modeling
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Simulate different budget and strategy scenarios to see projected outcome by Sep 2026.</p>

        {/* Scenario tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveScenario(i)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                activeScenario === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Scenario comparison */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Projected ROAS",    value: `${SCENARIOS[activeScenario].roas}×`,   base: SCENARIOS[1].roas,    icon: BarChart3 },
            { label: "Projected Revenue", value: `$${SCENARIOS[activeScenario].revenue}k`, base: SCENARIOS[1].revenue, icon: TrendingUp },
            { label: "Ad Spend",          value: `$${SCENARIOS[activeScenario].spend}k`,   base: SCENARIOS[1].spend,   icon: Zap },
            { label: "Organic Sessions",  value: `${SCENARIOS[activeScenario].sessions}k`, base: SCENARIOS[1].sessions,icon: BarChart3 },
          ].map((kpi) => {
            const diff = activeScenario === 1 ? 0 : ((parseFloat(kpi.value) - kpi.base) / kpi.base * 100);
            return (
              <div key={kpi.label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
                {activeScenario !== 1 && (
                  <p className={cn("text-xs font-medium mt-1", diff > 0 ? "text-emerald-600" : "text-red-600")}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(1)}% vs base
                  </p>
                )}
                {activeScenario === 1 && <p className="text-xs text-muted-foreground mt-1">Base scenario</p>}
              </div>
            );
          })}
        </div>

        {/* Scenario revenue chart */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue by Scenario (Sep 2026 projection)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={SCENARIOS} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} hide />
              <YAxis tick={{ fontSize: 10 }} width={40} />
              <Tooltip formatter={(v: number) => [`$${v}k`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}
                fill="hsl(var(--primary))"
                label={{ position: "top", formatter: (v: number) => `$${v}k`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-around text-[10px] text-muted-foreground mt-1">
            {SCENARIOS.map((s, i) => <span key={i} className={cn(i === activeScenario && "text-primary font-semibold")}>{s.name.split(" (")[0].split(" +")[0]}</span>)}
          </div>
        </div>
      </div>

      </PageContent>
    </>
  );
}
