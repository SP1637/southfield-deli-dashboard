"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Megaphone, TrendingUp, TrendingDown, DollarSign, MousePointerClick,
  Target, Lightbulb, AlertTriangle, CheckCircle2, XCircle,
  ArrowUpRight, RefreshCw, Zap, Info, Wifi, WifiOff, Filter,
  BarChart2, Settings, Sparkles, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import type { AdCampaign } from "@/app/api/ads/google/route";
import type { AdsResponse } from "@/app/api/ads/route";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
  CAMPAIGNS, buildPlatformSummaries, buildAiStrategicBrief,
} from "@/lib/campaign-data";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  google_ads:   { label: "Google Ads",   color: "#4285F4", bg: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  meta_ads:     { label: "Meta Ads",     color: "#0866FF", bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  tiktok_ads:   { label: "TikTok Ads",   color: "#010101", bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  snapchat_ads: { label: "Snapchat Ads", color: "#FFFC00", bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  linkedin_ads: { label: "LinkedIn Ads", color: "#0A66C2", bg: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
};

const PIE_COLORS = ["#4285F4", "#0866FF", "#010101", "#FFFC00", "#0A66C2"];

const DATE_RANGES = [
  { label: "Last 7 days",  value: "7daysAgo" },
  { label: "Last 28 days", value: "28daysAgo" },
  { label: "Last 90 days", value: "90daysAgo" },
];

const PLATFORM_LOGOS: Record<string, string> = {
  google_ads:   "🔵",
  meta_ads:     "📘",
  tiktok_ads:   "🎵",
  linkedin_ads: "💼",
  snapchat_ads: "👻",
};

// ── AI recommendations ────────────────────────────────────────────────────────

function buildRecommendations(campaigns: AdCampaign[]) {
  const recs: { type: "stop" | "scale" | "optimise" | "tip"; title: string; body: string }[] = [];

  const active = campaigns.filter((c) => c.status === "ENABLED");

  // Underperforming: ROAS < 1.5 with significant spend
  active.filter((c) => c.roas > 0 && c.roas < 1.5 && c.spend > 200).slice(0, 2).forEach((c) => {
    recs.push({
      type: "stop",
      title: `Pause "${c.name}"`,
      body: `ROAS of ${c.roas.toFixed(2)}× on ${PLATFORM_META[c.platform]?.label} is below break-even. Spending ${formatCurrency(c.spend)} but returning only ${formatCurrency(c.conversionValue)}. Pause and reallocate budget.`,
    });
  });

  // High performers: ROAS ≥ 4 with positive trend
  active.filter((c) => c.roas >= 4.0 && c.spend > 500).slice(0, 2).forEach((c) => {
    recs.push({
      type: "scale",
      title: `Scale up "${c.name}"`,
      body: `${PLATFORM_META[c.platform]?.label} campaign achieving ${c.roas.toFixed(2)}× ROAS. Increase daily budget by 20–30% incrementally. Keep CPA under ${formatCurrency(c.cpa * 1.25)} as you scale.`,
    });
  });

  // Low CTR with high impressions
  active.filter((c) => c.ctr < 0.008 && c.impressions > 100000).slice(0, 1).forEach((c) => {
    recs.push({
      type: "optimise",
      title: `Improve CTR on "${c.name}"`,
      body: `${(c.ctr * 100).toFixed(2)}% CTR across ${formatCompact(c.impressions)} impressions is below platform benchmarks. Test new creatives, tighten audience targeting, and A/B test ad copy.`,
    });
  });

  // Cross-platform tip
  const byPlatform = campaigns.reduce<Record<string, { spend: number; revenue: number }>>(
    (acc, c) => {
      if (!acc[c.platform]) acc[c.platform] = { spend: 0, revenue: 0 };
      acc[c.platform].spend   += c.spend;
      acc[c.platform].revenue += c.conversionValue;
      return acc;
    },
    {}
  );
  const bestPlatform = Object.entries(byPlatform)
    .filter(([, v]) => v.spend > 0)
    .sort(([, a], [, b]) => (b.revenue / b.spend) - (a.revenue / a.spend))[0];

  if (bestPlatform) {
    const [platform, kpis] = bestPlatform;
    recs.push({
      type: "tip",
      title: `${PLATFORM_META[platform]?.label ?? platform} is your best performer`,
      body: `${(kpis.revenue / kpis.spend).toFixed(2)}× blended ROAS — highest across all connected platforms. Consider shifting 15–20% of budget from lower-performing channels here.`,
    });
  }

  return recs.slice(0, 4);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AdCampaign["status"] }) {
  return status === "ENABLED"
    ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
    : <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Paused</span>;
}

function RecCard({ type, title, body }: { type: string; title: string; body: string }) {
  const cfg = {
    stop:     { bg: "bg-red-50 dark:bg-red-950/20 border-red-200",     text: "text-red-700 dark:text-red-400",     icon: XCircle },
    scale:    { bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200", text: "text-emerald-700 dark:text-emerald-400", icon: ArrowUpRight },
    optimise: { bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200", text: "text-amber-700 dark:text-amber-400", icon: AlertTriangle },
    tip:      { bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200",   text: "text-blue-700 dark:text-blue-400",   icon: Lightbulb },
  }[type] ?? { bg: "", text: "", icon: Info };
  const Icon = cfg.icon;
  return (
    <div className={cn("rounded-lg border p-3.5 space-y-1", cfg.bg)}>
      <p className={cn("text-sm font-semibold flex items-center gap-2", cfg.text)}>
        <Icon className="h-4 w-4 shrink-0" />
        {title}
      </p>
      <p className={cn("text-xs leading-relaxed", cfg.text)}>{body}</p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform];
  if (!meta) return <span className="text-xs text-muted-foreground">{platform}</span>;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.bg)}>
      {meta.label}
    </span>
  );
}

function ConnectionBadge({ platform, demo }: { platform: string; demo: boolean }) {
  return demo ? (
    <span className="flex items-center gap-1 text-[10px] text-amber-600">
      <WifiOff className="h-2.5 w-2.5" /> Demo
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] text-emerald-600">
      <Wifi className="h-2.5 w-2.5" /> Live
    </span>
  );
}

// ── AI Brief Card (inline copy from campaigns/page.tsx) ───────────────────────

function AiBriefCard({ brief }: { brief: ReturnType<typeof buildAiStrategicBrief> }) {
  const [planOpen, setPlanOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-0.5">AI Campaign Strategist</p>
          <p className="text-sm font-semibold text-foreground leading-snug">{brief.headline}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{brief.summary}</p>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-3 gap-3 mx-5 mb-5">
        {[
          { label: "Monthly Spend",    value: formatCurrency(brief.totalMonthlySpend),         color: "text-foreground" },
          { label: "Monthly Revenue",  value: formatCurrency(brief.estimatedMonthlyRevenue),    color: "text-emerald-600" },
          { label: "Blended ROAS",     value: `${brief.blendedRoas.toFixed(2)}×`,              color: "text-primary" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white/70 dark:bg-white/5 border border-violet-100 dark:border-violet-800/30 px-3 py-2.5 text-center">
            <p className={cn("text-lg font-bold", k.color)}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* 3 Priorities */}
      <div className="space-y-3 px-5 pb-5">
        {[
          { data: brief.priority1, color: "border-emerald-300 dark:border-emerald-700", headerBg: "bg-emerald-100 dark:bg-emerald-900/30" },
          { data: brief.priority2, color: "border-blue-300 dark:border-blue-700",       headerBg: "bg-blue-100 dark:bg-blue-900/30" },
          { data: brief.priority3, color: "border-red-300 dark:border-red-700",         headerBg: "bg-red-100 dark:bg-red-900/30" },
        ].map(({ data, color, headerBg }, i) => (
          <div key={i} className={cn("rounded-xl border overflow-hidden", color)}>
            <div className={cn("px-4 py-2.5", headerBg)}>
              <p className="text-sm font-bold text-foreground">{data.title}</p>
            </div>
            <div className="px-4 py-3 bg-white/60 dark:bg-black/10">
              <p className="text-xs text-foreground leading-relaxed mb-2">{data.detail}</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-2 py-1">
                  💰 {data.impact}
                </span>
                <span className="text-xs text-primary font-medium">→ {data.action}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Weekly Plan toggle */}
        <button
          onClick={() => setPlanOpen(!planOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 w-full"
        >
          <Calendar className="h-3.5 w-3.5" />
          {planOpen ? "Hide" : "Show"} 4-week action plan ({brief.weeklyPlan.length} steps)
          {planOpen ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
        </button>

        {planOpen && (
          <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-white/60 dark:bg-black/10 p-4 space-y-2">
            {brief.weeklyPlan.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PageTab = "intelligence" | "campaigns";
type FilterStatus = "all" | "ENABLED" | "PAUSED";

export default function AdsPage() {
  const [tab, setTab]                   = useState<PageTab>("intelligence");
  const [adsData, setAdsData]           = useState<AdsResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [dateRange, setDateRange]       = useState("28daysAgo");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortKey, setSortKey]           = useState<keyof AdCampaign>("spend");

  async function fetchData(range: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/ads?startDate=${range}&endDate=today`);
      const json: AdsResponse = await res.json();
      setAdsData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(dateRange); }, []);

  const campaigns = useMemo(() => {
    let list = adsData?.campaigns ?? [];
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (platformFilter !== "all") list = list.filter((c) => c.platform === platformFilter);
    return [...list].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return typeof bv === "number" ? bv - av : 0;
    });
  }, [adsData, statusFilter, platformFilter, sortKey]);

  const totals = adsData?.totals;
  const platforms = adsData?.platforms ?? {};
  const anyLive = Object.values(platforms).some((p) => !p.demo);

  const recommendations = useMemo(() => buildRecommendations(adsData?.campaigns ?? []), [adsData]);

  // Static data for intelligence tab
  const brief     = useMemo(() => buildAiStrategicBrief(), []);
  const summaries = useMemo(() => buildPlatformSummaries(), []);

  // Pie: spend by platform
  const pieData = Object.entries(platforms)
    .filter(([, v]) => v.spend > 0)
    .map(([platform, v]) => ({ name: PLATFORM_META[platform]?.label ?? platform, value: v.spend }));

  // Weekly spend chart (derived from campaigns - simulated trend)
  const platformSummaries = Object.entries(platforms).map(([platform, v]) => ({
    platform: PLATFORM_META[platform]?.label ?? platform,
    spend: v.spend,
    revenue: v.revenue,
    roas: v.spend > 0 ? v.revenue / v.spend : 0,
    campaignCount: v.campaignCount,
    demo: v.demo,
  }));

  return (
    <>
      <PageHeader title="Ads & Campaign Intelligence" />
      <PageContent>

        {/* ── Tab bar ── */}
        <div className="border-b flex gap-0">
          {([
            { key: "intelligence" as PageTab, label: "CAMPAIGN INTEL" },
            { key: "campaigns"   as PageTab, label: "ALL CAMPAIGNS"  },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-5 py-2.5 text-xs font-semibold tracking-wide transition-colors",
                tab === t.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ CAMPAIGN INTEL TAB ══ */}
        {tab === "intelligence" && (
          <div className="space-y-6">
            {/* 1. AI Brief Card */}
            <AiBriefCard brief={brief} />

            {/* 2. Platform health grid */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Health</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {summaries.map((s) => {
                  const healthColors: Record<string, { badge: string; text: string; bg: string }> = {
                    scale:   { badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200", text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" },
                    monitor: { badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200",           text: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200"   },
                    test:    { badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200",               text: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200"    },
                    pause:   { badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",                     text: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/20 border-red-200"       },
                  };
                  const hc = healthColors[s.health] ?? healthColors.monitor;
                  const healthLabel: Record<string, string> = { scale: "Scale Up", monitor: "Monitor", test: "Test More", pause: "Pause Now" };
                  return (
                    <div key={s.platform} className={cn("rounded-xl border p-4 space-y-3", hc.bg)}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          <span>{PLATFORM_LOGOS[s.platform] ?? "📊"}</span>
                          <span className="text-foreground">{s.label}</span>
                        </span>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", hc.badge)}>
                          {healthLabel[s.health] ?? s.health}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/60 dark:bg-white/5 px-2.5 py-2 text-center">
                          <p className="text-[10px] text-muted-foreground">ROAS</p>
                          <p className={cn("text-base font-bold", hc.text)}>{s.roas.toFixed(2)}×</p>
                        </div>
                        <div className="rounded-lg bg-white/60 dark:bg-white/5 px-2.5 py-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Monthly Spend</p>
                          <p className="text-base font-bold text-foreground">{formatCurrency(s.spend)}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{s.healthReason}</p>
                      {s.budgetMove && (
                        <div className={cn(
                          "flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2 py-1.5",
                          s.budgetMove.action === "increase"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        )}>
                          {s.budgetMove.action === "increase"
                            ? <TrendingUp className="h-3 w-3 shrink-0" />
                            : <TrendingDown className="h-3 w-3 shrink-0" />
                          }
                          {s.budgetMove.action === "pause" ? "Pause & save" : s.budgetMove.action === "increase" ? "Add" : "Reduce"} {formatCurrency(s.budgetMove.amount)}/mo
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. AI Recs (RecCard) */}
            {recommendations.length > 0 && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  AI Campaign Recommendations
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {recommendations.map((r, i) => (
                    <RecCard key={i} type={r.type} title={r.title} body={r.body} />
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder recs when no live data */}
            {recommendations.length === 0 && !loading && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  AI Campaign Recommendations
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect your ad accounts to receive live AI recommendations based on your actual campaign performance.
                </p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.href = "/connect"}>
                  <Settings className="h-3.5 w-3.5" />
                  Connect Ad Accounts
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ══ ALL CAMPAIGNS TAB ══ */}
        {tab === "campaigns" && (
          <div className="space-y-6">
            {/* Controls bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {anyLive ? (
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 gap-1">
                  <Wifi className="h-3 w-3" /> Live data
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Info className="h-3 w-3" /> Demo data — connect ad accounts below
                </Badge>
              )}
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); fetchData(e.target.value); }}
                className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => fetchData(dateRange)} disabled={loading} className="gap-1.5">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/connect"} className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Manage Accounts
              </Button>
            </div>

            {/* Loading skeleton */}
            {loading && !adsData && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card h-24 animate-pulse" />
                ))}
              </div>
            )}

            {adsData && (
              <>
                {/* Blended KPI row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: "Total Spend",    value: formatCurrency(totals?.spend ?? 0),           icon: DollarSign },
                    { label: "Total Revenue",  value: formatCurrency(totals?.revenue ?? 0),          icon: TrendingUp },
                    { label: "Blended ROAS",   value: `${(totals?.roas ?? 0).toFixed(2)}×`,          icon: Target },
                    { label: "Total Clicks",   value: formatCompact(totals?.clicks ?? 0),            icon: MousePointerClick },
                    { label: "Conversions",    value: formatCompact(totals?.conversions ?? 0),       icon: CheckCircle2 },
                  ].map((k) => {
                    const Icon = k.icon;
                    return (
                      <div key={k.label} className="rounded-xl border bg-card p-4 flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{k.label}</p>
                          <p className="text-xl font-bold tracking-tight mt-0.5">{k.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Per-platform summary cards */}
                {platformSummaries.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {platformSummaries.map((p) => (
                      <div key={p.platform} className="rounded-xl border bg-card p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{p.platform}</span>
                          <ConnectionBadge platform={Object.entries(PLATFORM_META).find(([, v]) => v.label === p.platform)?.[0] ?? ""} demo={p.demo} />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="rounded bg-muted/30 p-1.5 text-center">
                            <p className="text-[10px] text-muted-foreground">Spend</p>
                            <p className="text-xs font-bold">{formatCurrency(p.spend)}</p>
                          </div>
                          <div className="rounded bg-muted/30 p-1.5 text-center">
                            <p className="text-[10px] text-muted-foreground">ROAS</p>
                            <p className={cn("text-xs font-bold", p.roas >= 3 ? "text-emerald-600" : p.roas > 0 && p.roas < 2 ? "text-red-500" : "")}>
                              {p.roas > 0 ? `${p.roas.toFixed(2)}×` : "—"}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{p.campaignCount} campaign{p.campaignCount !== 1 ? "s" : ""}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Recommendations */}
                {recommendations.length > 0 && (
                  <div className="rounded-xl border bg-card p-5 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      AI Campaign Recommendations
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {recommendations.map((r, i) => (
                        <RecCard key={i} type={r.type} title={r.title} body={r.body} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                  {/* Spend vs Revenue by platform */}
                  <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm font-semibold mb-4">Spend vs Revenue by Platform</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={platformSummaries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="platform" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${formatCompact(v)}`} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          formatter={(v: number, name: string) => [`$${formatCompact(v)}`, name === "revenue" ? "Revenue" : "Spend"]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="spend"   name="Spend"   fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Spend distribution pie */}
                  <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm font-semibold mb-3">Spend Distribution</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          formatter={(v: number) => [`$${formatCompact(v)}`, "Spend"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {d.name}
                          </span>
                          <span className="text-muted-foreground">{formatCurrency(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Campaign table */}
                <div className="rounded-xl border bg-card overflow-hidden">
                  {/* Table toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
                    <p className="text-sm font-semibold">
                      All Campaigns
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({campaigns.length})</span>
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Platform filter */}
                      <div className="flex items-center gap-1">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <select
                          value={platformFilter}
                          onChange={(e) => setPlatformFilter(e.target.value)}
                          className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="all">All Platforms</option>
                          {Object.entries(PLATFORM_META).map(([id, meta]) => (
                            <option key={id} value={id}>{meta.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status filter */}
                      <div className="flex gap-1">
                        {(["all", "ENABLED", "PAUSED"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                              statusFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {f === "all" ? "All" : f === "ENABLED" ? "Active" : "Paused"}
                          </button>
                        ))}
                      </div>

                      {/* Sort */}
                      <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as keyof AdCampaign)}
                        className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="spend">Sort: Spend</option>
                        <option value="roas">Sort: ROAS</option>
                        <option value="conversions">Sort: Conversions</option>
                        <option value="impressions">Sort: Impressions</option>
                        <option value="ctr">Sort: CTR</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground min-w-[180px]">Campaign</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Platform</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Spend</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Revenue</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">ROAS</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Impressions</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">CTR</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Conv.</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">CPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">
                              No campaigns match the current filters
                            </td>
                          </tr>
                        ) : campaigns.map((c) => (
                          <tr
                            key={`${c.platform}-${c.id}`}
                            className={cn(
                              "border-b last:border-0 hover:bg-muted/20 transition-colors",
                              c.status === "PAUSED" && "opacity-60"
                            )}
                          >
                            <td className="px-4 py-2.5 font-medium">
                              <div className="max-w-[200px] truncate" title={c.name}>{c.name}</div>
                              <div className="text-[10px] text-muted-foreground capitalize">{c.objective.replace(/_/g, " ").toLowerCase()}</div>
                            </td>
                            <td className="px-4 py-2.5"><PlatformBadge platform={c.platform} /></td>
                            <td className="px-4 py-2.5"><StatusDot status={c.status} /></td>
                            <td className="text-right px-4 py-2.5 tabular-nums">{formatCurrency(c.spend)}</td>
                            <td className="text-right px-4 py-2.5 tabular-nums">
                              {c.conversionValue > 0 ? formatCurrency(c.conversionValue) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="text-right px-4 py-2.5 tabular-nums">
                              {c.roas > 0 ? (
                                <span className={cn("font-semibold", c.roas >= 4 ? "text-emerald-600" : c.roas < 2 ? "text-red-500" : "text-amber-600")}>
                                  {c.roas.toFixed(2)}×
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="text-right px-4 py-2.5 tabular-nums text-muted-foreground">{formatCompact(c.impressions)}</td>
                            <td className="text-right px-4 py-2.5 tabular-nums">{(c.ctr * 100).toFixed(2)}%</td>
                            <td className="text-right px-4 py-2.5 tabular-nums">{formatCompact(c.conversions)}</td>
                            <td className="text-right px-4 py-2.5 tabular-nums">
                              {c.cpa > 0 ? formatCurrency(c.cpa) : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Connect banner */}
                  <div className="border-t bg-muted/20 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-xs font-medium">Connect your ad accounts for live campaign data</p>
                      <p className="text-[11px] text-muted-foreground">
                        Google Ads, Meta Ads, TikTok, Snapchat and LinkedIn can all be connected in Data Sources.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => window.location.href = "/connect"}>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Connect Ad Accounts
                    </Button>
                  </div>
                </div>

                {/* ROAS benchmark card */}
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    ROAS by Campaign
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={campaigns.filter((c) => c.roas > 0).slice(0, 15).map((c) => ({
                        name: c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name,
                        roas: parseFloat(c.roas.toFixed(2)),
                        platform: c.platform,
                      }))}
                      layout="vertical"
                      margin={{ left: 0, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}×`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={140} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                        formatter={(v: number) => [`${v}×`, "ROAS"]}
                      />
                      <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                        {campaigns.filter((c) => c.roas > 0).slice(0, 15).map((c, i) => (
                          <Cell
                            key={i}
                            fill={c.roas >= 4 ? "#10b981" : c.roas >= 2 ? "#f59e0b" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 text-[11px]">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> ROAS ≥ 4×</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500" /> ROAS 2–4×</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500" /> ROAS &lt; 2×</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </PageContent>
    </>
  );
}
