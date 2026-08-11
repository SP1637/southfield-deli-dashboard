"use client";

import { useState } from "react";
import {
  BarChart3, Plus, Sparkles, TrendingUp, TrendingDown,
  Search, Filter, Zap, Globe, Megaphone, Instagram,
  RefreshCw, ArrowRight, BookOpen, FlaskConical, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type MetricSource = "google_ads" | "meta_ads" | "tiktok_ads" | "ga4" | "search_console" | "blended" | "custom";
type MetricTrend = "up" | "down" | "flat";

interface Metric {
  id: string;
  label: string;
  source: MetricSource;
  category: string;
  value: string;
  valueRaw: number;
  unit: string;
  change: number;      // % vs prev period
  trend: MetricTrend;
  series: number[];
  formula?: string;
  description: string;
  starred: boolean;
}

// ─── Platform icon helper ─────────────────────────────────────────────────────
const SOURCE_CONFIG: Record<MetricSource, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  google_ads:      { label: "Google Ads",      color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40",    icon: Megaphone  },
  meta_ads:        { label: "Meta Ads",        color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950/40",icon: Megaphone  },
  tiktok_ads:      { label: "TikTok Ads",      color: "text-pink-600",    bg: "bg-pink-50 dark:bg-pink-950/40",    icon: Megaphone  },
  ga4:             { label: "GA4",             color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950/40",icon: Globe      },
  search_console:  { label: "Search Console",  color: "text-green-600",   bg: "bg-green-50 dark:bg-green-950/40",  icon: Search     },
  blended:         { label: "Blended",         color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-950/40",icon: Zap        },
  custom:          { label: "Custom Formula",  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/40",  icon: FlaskConical},
};

// ─── Demo metrics ─────────────────────────────────────────────────────────────
const METRICS: Metric[] = [
  // Blended
  { id: "b1", label: "Blended ROAS",             source: "blended", category: "Revenue",     value: "4.44×",   valueRaw: 4.44,  unit: "×",  change: +12.3, trend: "up",   series: [3.1,3.6,3.9,4.1,4.2,4.44], formula: "Total Revenue / Total Ad Spend",                        description: "Return on all ad spend across every platform.", starred: true  },
  { id: "b2", label: "Blended CPA",              source: "blended", category: "Efficiency",  value: "$14.20",  valueRaw: 14.2,  unit: "$",  change: -8.4,  trend: "down", series: [18.2,17,16.3,15.4,14.8,14.2], formula: "Total Spend / Total Conversions",                       description: "Average cost per conversion across all channels.", starred: true },
  { id: "b3", label: "Blended CTR",              source: "blended", category: "Engagement",  value: "2.84%",   valueRaw: 2.84,  unit: "%",  change: +4.1,  trend: "up",   series: [2.3,2.4,2.5,2.6,2.7,2.84],  formula: "Total Clicks / Total Impressions × 100",               description: "Click-through rate across all platforms.", starred: false },
  { id: "b4", label: "Cross-Platform Conv. Rate",source: "blended", category: "Conversion",  value: "3.56%",   valueRaw: 3.56,  unit: "%",  change: +6.2,  trend: "up",   series: [2.9,3.0,3.1,3.2,3.4,3.56],  formula: "Total Conversions / Total Clicks × 100",               description: "Overall conversion rate blended across channels.", starred: false },
  // Google
  { id: "g1", label: "Google ROAS",              source: "google_ads", category: "Revenue",  value: "4.44×",   valueRaw: 4.44,  unit: "×",  change: +14.2, trend: "up",   series: [3.2,3.7,4.0,4.2,4.3,4.44],  description: "Return on Google Ads spend.", starred: true },
  { id: "g2", label: "Impression Share",         source: "google_ads", category: "Reach",    value: "68.4%",   valueRaw: 68.4,  unit: "%",  change: +5.1,  trend: "up",   series: [58,61,63,65,67,68.4],        description: "% of auctions where your ads were shown.", starred: false },
  { id: "g3", label: "Quality Score (avg)",      source: "google_ads", category: "Quality",  value: "7.2",     valueRaw: 7.2,   unit: "",   change: +0.3,  trend: "up",   series: [6.5,6.7,6.8,6.9,7.0,7.2],   description: "Average Quality Score across active keywords.", starred: false },
  // Meta
  { id: "m1", label: "Meta ROAS",                source: "meta_ads", category: "Revenue",    value: "3.21×",   valueRaw: 3.21,  unit: "×",  change: +8.6,  trend: "up",   series: [2.5,2.7,2.9,3.0,3.1,3.21],  description: "Return on Meta Ads spend.", starred: false },
  { id: "m2", label: "Frequency",                source: "meta_ads", category: "Reach",      value: "2.4",     valueRaw: 2.4,   unit: "",   change: +11.2, trend: "up",   series: [1.8,1.9,2.0,2.1,2.2,2.4],   description: "Avg times each person saw your ads.", starred: false },
  { id: "m3", label: "CPM",                      source: "meta_ads", category: "Efficiency", value: "$8.20",   valueRaw: 8.20,  unit: "$",  change: +3.8,  trend: "down", series: [7.1,7.4,7.6,7.8,8.0,8.2],   description: "Cost per 1,000 impressions on Meta.", starred: false },
  // GA4
  { id: "a1", label: "Organic Sessions",         source: "ga4",  category: "Acquisition",    value: "45.6k",   valueRaw: 45600, unit: "k",  change: +9.4,  trend: "up",   series: [30,33,37,40,43,45.6],        description: "Sessions from organic search in GA4.", starred: true },
  { id: "a2", label: "Bounce Rate",              source: "ga4",  category: "Engagement",     value: "38.2%",   valueRaw: 38.2,  unit: "%",  change: -5.6,  trend: "down", series: [44,43,42,41,39,38.2],        description: "% of sessions that left without interacting.", starred: false },
  { id: "a3", label: "Revenue per Session",      source: "ga4",  category: "Revenue",        value: "$1.62",   valueRaw: 1.62,  unit: "$",  change: +7.1,  trend: "up",   series: [1.2,1.3,1.4,1.5,1.55,1.62], description: "Average revenue generated per GA4 session.", starred: false },
  // Custom
  { id: "c1", label: "LTV:CAC Ratio",            source: "custom", category: "Revenue",      value: "3.8×",    valueRaw: 3.8,   unit: "×",  change: +6.4,  trend: "up",   series: [2.9,3.1,3.3,3.5,3.7,3.8],   formula: "Customer LTV / (Total Ad Spend / New Customers)",      description: "Lifetime value to customer acquisition cost ratio.", starred: true },
  { id: "c2", label: "True ROAS (incl. Fees)",   source: "custom", category: "Revenue",      value: "3.92×",   valueRaw: 3.92,  unit: "×",  change: +10.1, trend: "up",   series: [2.8,3.1,3.4,3.6,3.8,3.92],  formula: "Revenue / (Spend + Agency Fee + Platform Fee)",        description: "ROAS adjusted for agency and platform costs.", starred: true },
  { id: "c3", label: "Paid:Organic Ratio",       source: "custom", category: "Acquisition",  value: "1.24",    valueRaw: 1.24,  unit: "",   change: -4.2,  trend: "down", series: [1.6,1.5,1.4,1.35,1.3,1.24], formula: "Paid Sessions / Organic Sessions",                     description: "Balance between paid and organic traffic.", starred: false },
];

const CATEGORIES = ["All", ...Array.from(new Set(METRICS.map((m) => m.category)))];
const SOURCES: Array<MetricSource | "all"> = ["all", "blended", "custom", "google_ads", "meta_ads", "tiktok_ads", "ga4", "search_console"];

// ─── Custom metrics library ───────────────────────────────────────────────────
const FORMULA_LIBRARY = [
  { label: "True ROAS",       formula: "Revenue / (Spend + Fees)",              category: "Revenue"    },
  { label: "LTV:CAC",         formula: "Avg LTV / (Spend / New Customers)",     category: "Revenue"    },
  { label: "Paid:Organic Mix",formula: "Paid Sessions / Organic Sessions",      category: "Acquisition"},
  { label: "Effective CPL",   formula: "Spend / (Leads × Lead Quality Score)",  category: "Efficiency" },
  { label: "Channel Overlap", formula: "Cross-channel Converters / Total Conv", category: "Attribution"},
];

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values, trend }: { values: number[]; trend: MetricTrend }) {
  const color = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#94a3b8";
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ metric, starred, onStar }: { metric: Metric; starred: boolean; onStar: () => void }) {
  const src = SOURCE_CONFIG[metric.source];
  const SrcIcon = src.icon;
  const isUp = metric.trend === "up";
  const isGood = (metric.trend === "up" && !["Blended CPA", "Bounce Rate", "CPM", "Frequency"].includes(metric.label))
              || (metric.trend === "down" && ["Blended CPA", "Bounce Rate", "CPM", "Paid:Organic Ratio"].includes(metric.label));

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", src.bg, src.color)}>
            <SrcIcon className="h-2.5 w-2.5" /> {src.label}
          </span>
        </div>
        <button onClick={onStar} className={cn("shrink-0 transition-colors", starred ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-400")}>
          <Star className="h-3.5 w-3.5" fill={starred ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="text-sm font-semibold text-foreground leading-tight">{metric.label}</p>
      {metric.formula && (
        <p className="text-[10px] text-muted-foreground font-mono bg-muted/50 rounded px-2 py-0.5 truncate">{metric.formula}</p>
      )}

      <div className="flex items-end justify-between mt-1">
        <p className="text-xl font-bold text-foreground">{metric.value}</p>
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: isGood ? "#22c55e" : "#ef4444" }}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}%
        </div>
      </div>

      <Sparkline values={metric.series} trend={metric.trend} />

      <p className="text-[11px] text-muted-foreground leading-relaxed">{metric.description}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MetricsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState<MetricSource | "all">("all");
  const [tab, setTab] = useState<"my" | "library" | "custom">("my");
  const [starred, setStarred] = useState<Set<string>>(new Set(METRICS.filter((m) => m.starred).map((m) => m.id)));

  const filtered = METRICS.filter((m) => {
    if (tab === "my" && !starred.has(m.id)) return false;
    if (category !== "All" && m.category !== category) return false;
    if (source !== "all" && m.source !== source) return false;
    if (search && !m.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleStar = (id: string) => setStarred((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <>
      <PageHeader
        title="Metrics Hub"
        tabs={[
          { key: "my",      label: "My Metrics" },
          { key: "library", label: "Metric Library" },
          { key: "custom",  label: "Custom Formulas" },
        ]}
        activeTab={tab}
        onTabChange={(k) => setTab(k as typeof tab)}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Custom Metric
          </button>
        }
      />
      <PageContent>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tracked Metrics", value: METRICS.length, icon: BarChart3, color: "text-primary" },
          { label: "Starred",         value: starred.size,   icon: Star,      color: "text-amber-500" },
          { label: "Custom Formulas", value: METRICS.filter((m) => m.source === "custom").length, icon: FlaskConical, color: "text-amber-600" },
          { label: "Blended KPIs",    value: METRICS.filter((m) => m.source === "blended").length, icon: Zap,         color: "text-violet-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <k.icon className={cn("h-5 w-5 shrink-0", k.color)} />
            <div>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: "my",      label: "My Metrics",    icon: Star       },
          { key: "library", label: "Metric Library", icon: BookOpen   },
          { key: "custom",  label: "Custom Formulas",icon: FlaskConical},
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "custom" ? (
        /* ── Custom Formula Library ── */
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Formula Builder</span>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mb-4">
              Build any metric from any combination of platform data. Reference metrics by name in your formula.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {FORMULA_LIBRARY.map((f) => (
                <div key={f.label} className="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-white dark:bg-amber-950/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{f.category}</span>
                  </div>
                  <p className="font-mono text-xs text-amber-700 dark:text-amber-300">{f.formula}</p>
                  <button className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline">
                    <Plus className="h-3 w-3" /> Add to My Metrics
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {METRICS.filter((m) => m.source === "custom").map((m) => (
              <MetricCard key={m.id} metric={m} starred={starred.has(m.id)} onStar={() => toggleStar(m.id)} />
            ))}
          </div>
        </div>
      ) : (
        /* ── My Metrics / Library ── */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search metrics…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none"
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s === "all" ? "All Sources" : SOURCE_CONFIG[s].label}</option>)}
            </select>
          </div>

          {/* AI insight */}
          <div className="flex items-start gap-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 px-4 py-3">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              <span className="font-semibold">AI Insight:</span> Your True ROAS (3.92×) is 11.7% below Blended ROAS (4.44×) — agency and platform fees are taking a significant cut. Consider renegotiating your agency retainer or switching to performance-only pricing.
            </p>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{tab === "my" ? "No starred metrics. Star metrics from the Library tab." : "No metrics match your filters."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(tab === "library" ? METRICS : filtered).map((m) => (
                <MetricCard key={m.id} metric={m} starred={starred.has(m.id)} onStar={() => toggleStar(m.id)} />
              ))}
            </div>
          )}
        </div>
      )}
      </PageContent>
    </>
  );
}
