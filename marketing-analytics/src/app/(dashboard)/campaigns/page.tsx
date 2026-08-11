"use client";

import { useState, useMemo } from "react";
import {
  Sparkles, TrendingUp, TrendingDown, Pause, Play, ArrowUpRight,
  AlertTriangle, CheckCircle2, Target, DollarSign, BarChart3,
  ChevronDown, ChevronUp, RefreshCw, Lightbulb, Zap,
  ArrowRight, Filter, Eye, MoreHorizontal, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
  CAMPAIGNS, buildPlatformSummaries, buildAiStrategicBrief,
  type Campaign, type CampaignHealth,
} from "@/lib/campaign-data";

// ─── Health config ─────────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<CampaignHealth, {
  label: string; short: string;
  bg: string; color: string; dot: string;
  icon: React.ElementType;
}> = {
  scale:   { label: "Scale Up",  short: "Scale",   bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40", color: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", icon: ArrowUpRight },
  monitor: { label: "Monitor",   short: "Monitor", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",         color: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500",  icon: Eye },
  test:    { label: "Test More",  short: "Test",    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40",             color: "text-blue-700 dark:text-blue-400",     dot: "bg-blue-500",   icon: Zap },
  pause:   { label: "Pause Now",  short: "Pause",   bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40",                 color: "text-red-700 dark:text-red-400",       dot: "bg-red-500",    icon: Pause },
};

const PLATFORM_META: Record<string, { label: string; logo: string; color: string }> = {
  google_ads:   { label: "Google Ads",   logo: "🔵", color: "#4285F4" },
  meta_ads:     { label: "Meta Ads",     logo: "📘", color: "#0866FF" },
  tiktok_ads:   { label: "TikTok Ads",   logo: "🎵", color: "#2D2D2D" },
  linkedin_ads: { label: "LinkedIn Ads", logo: "💼", color: "#0A66C2" },
  snapchat_ads: { label: "Snapchat",     logo: "👻", color: "#FFFC00" },
};

// ─── Mini sparkline ────────────────────────────────────────────────────────────

function RoasTrend({ values, health }: { values: number[]; health: CampaignHealth }) {
  const color = health === "scale" ? "#22c55e" : health === "pause" ? "#ef4444" : "#f59e0b";
  const data  = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={72} height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Platform card ─────────────────────────────────────────────────────────────

function PlatformCard({ summary, onClick, active }: {
  summary: ReturnType<typeof buildPlatformSummaries>[0];
  onClick: () => void;
  active: boolean;
}) {
  const hCfg = HEALTH_CONFIG[summary.health];
  const Icon = hCfg.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all w-full",
        active ? "ring-2 ring-primary shadow-md" : "hover:shadow-md hover:border-primary/40",
        hCfg.bg
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{summary.logo}</span>
          <span className="font-semibold text-sm text-foreground">{summary.label}</span>
        </div>
        <span className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border", hCfg.bg, hCfg.color)}>
          <Icon className="h-3 w-3" />
          {hCfg.short}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ROAS</p>
          <p className={cn("text-lg font-bold", hCfg.color)}>{summary.roas.toFixed(2)}×</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Spend</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(summary.spend)}</p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {summary.healthReason}
      </p>

      {summary.budgetMove && (
        <div className={cn(
          "mt-2 flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2 py-1.5",
          summary.budgetMove.action === "increase"
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        )}>
          {summary.budgetMove.action === "increase"
            ? <TrendingUp className="h-3 w-3 shrink-0" />
            : <Pause className="h-3 w-3 shrink-0" />
          }
          {summary.budgetMove.action === "pause" ? "Pause & save" : "Add"} {formatCurrency(summary.budgetMove.amount)}/mo
        </div>
      )}
    </button>
  );
}

// ─── Campaign row ──────────────────────────────────────────────────────────────

function CampaignRow({ c, rank }: { c: Campaign; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const hCfg = HEALTH_CONFIG[c.health];
  const HealthIcon = hCfg.icon;
  const pmeta = PLATFORM_META[c.platform];

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer hover:bg-muted/30 transition-colors",
          c.health === "pause" && "opacity-80"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <td className="px-4 py-3 text-xs text-muted-foreground font-mono w-8">{rank}</td>

        {/* Campaign name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none shrink-0">{pmeta?.logo}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[220px]">{c.name}</p>
              <p className="text-[11px] text-muted-foreground">{c.placement}</p>
            </div>
          </div>
        </td>

        {/* Health badge */}
        <td className="px-4 py-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border", hCfg.bg, hCfg.color)}>
            <HealthIcon className="h-3 w-3" />
            {hCfg.short}
          </span>
        </td>

        {/* ROAS + mini trend */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", hCfg.color)}>{c.roas.toFixed(2)}×</span>
            <RoasTrend values={c.weeklyTrend} health={c.health} />
          </div>
        </td>

        {/* Spend */}
        <td className="px-4 py-3 text-sm font-medium text-foreground tabular-nums">
          {formatCurrency(c.spend)}
        </td>

        {/* Revenue */}
        <td className="px-4 py-3 text-sm font-medium tabular-nums" style={{ color: c.health === "pause" ? "#ef4444" : "#22c55e" }}>
          {formatCurrency(c.revenue)}
        </td>

        {/* CPA */}
        <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
          {formatCurrency(c.cpa)}
        </td>

        {/* Expand */}
        <td className="px-4 py-3">
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </td>
      </tr>

      {/* Expanded AI note row */}
      {expanded && (
        <tr className={cn("border-b", hCfg.bg)}>
          <td />
          <td colSpan={7} className="px-4 pb-4 pt-2">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">{c.aiNote}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Impressions: {formatCompact(c.impressions)}</span>
                  <span>Clicks: {formatCompact(c.clicks)}</span>
                  <span>CTR: {(c.ctr * 100).toFixed(2)}%</span>
                  <span>Conversions: {c.conversions}</span>
                </div>
              </div>
              <span className={cn("text-xs font-semibold px-2 py-1 rounded-lg", hCfg.bg, hCfg.color)}>
                {c.health === "scale" ? "↑ Increase budget" : c.health === "pause" ? "⏸ Pause campaign" : "→ Keep monitoring"}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── AI Brief card ─────────────────────────────────────────────────────────────

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
          { label: "Monthly Spend",    value: formatCurrency(brief.totalMonthlySpend),    color: "text-foreground" },
          { label: "Monthly Revenue",  value: formatCurrency(brief.estimatedMonthlyRevenue), color: "text-emerald-600" },
          { label: "Blended ROAS",     value: `${brief.blendedRoas.toFixed(2)}×`,         color: "text-primary" },
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

// ─── Instagram vs Facebook breakdown ─────────────────────────────────────────

function MetaBreakdown() {
  const instaCampaigns = CAMPAIGNS.filter(c => c.platform === "meta_ads" && c.placement.includes("Instagram"));
  const fbCampaigns    = CAMPAIGNS.filter(c => c.platform === "meta_ads" && c.placement.includes("Facebook"));

  const instaSpend   = instaCampaigns.reduce((s, c) => s + c.spend, 0);
  const instaRevenue = instaCampaigns.reduce((s, c) => s + c.revenue, 0);
  const instaRoas    = instaRevenue / (instaSpend || 1);

  const fbSpend   = fbCampaigns.reduce((s, c) => s + c.spend, 0);
  const fbRevenue = fbCampaigns.reduce((s, c) => s + c.revenue, 0);
  const fbRoas    = fbRevenue / (fbSpend || 1);

  const chartData = [
    { placement: "Instagram Feed",    roas: 5.20, spend: 2400 },
    { placement: "Instagram Stories", roas: 4.30, spend: 1100 },
    { placement: "Instagram Reels",   roas: 3.30, spend: 800  },
    { placement: "FB Retargeting",    roas: 5.40, spend: 540  },
    { placement: "Facebook Feed",     roas: 1.80, spend: 1800 },
    { placement: "Facebook Carousel", roas: 1.40, spend: 1200 },
  ];

  const COLORS = ["#e1306c","#e1306c","#e1306c","#1877f2","#1877f2","#1877f2"];

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📘</span>
          <div>
            <p className="text-sm font-bold text-foreground">Meta Ads — Instagram vs Facebook</p>
            <p className="text-xs text-muted-foreground">Same platform budget, very different results</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Instagram avg ROAS</p>
            <p className="text-lg font-bold text-emerald-600">{instaRoas.toFixed(2)}×</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Facebook avg ROAS</p>
            <p className="text-lg font-bold text-red-500">{fbRoas.toFixed(2)}×</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Verdict banner */}
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 mb-5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Your Instagram is {(instaRoas / fbRoas).toFixed(1)}× more effective than Facebook right now
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 leading-relaxed">
              Facebook Feed & Carousel are spending £3,000/month at 1.4–1.8× ROAS while declining week-on-week.
              Moving this budget to Instagram could generate an estimated <strong>+£9,000 more revenue per month</strong> with the same total spend.
            </p>
          </div>
        </div>

        {/* ROAS comparison chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="placement"
              tick={{ fontSize: 10 }}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(2)}×`, "ROAS"]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="roas" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} opacity={i >= 4 ? 0.6 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Pink = Instagram, Blue = Facebook legend */}
        <div className="flex items-center gap-4 justify-center mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm inline-block bg-[#e1306c]" /> Instagram</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm inline-block bg-[#1877f2]" /> Facebook</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type PageTab = "intelligence" | "campaigns" | "platforms" | "meta";

const PAGE_TABS = [
  { key: "intelligence" as PageTab, label: "AI STRATEGY"    },
  { key: "campaigns"   as PageTab, label: "ALL CAMPAIGNS"   },
  { key: "platforms"   as PageTab, label: "BY PLATFORM"     },
  { key: "meta"        as PageTab, label: "INSTAGRAM VS FB" },
];

type HealthFilter = "all" | CampaignHealth;
type SortKey = "roas" | "spend" | "revenue" | "cpa";

export default function CampaignsPage() {
  const [tab, setTab]                   = useState<PageTab>("intelligence");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [platformFilter, setPlatform]   = useState<string>("all");
  const [sortKey, setSortKey]           = useState<SortKey>("spend");
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const brief      = useMemo(() => buildAiStrategicBrief(), []);
  const summaries  = useMemo(() => buildPlatformSummaries(), []);

  const filteredCampaigns = useMemo(() => {
    let list = [...CAMPAIGNS];
    if (healthFilter !== "all") list = list.filter(c => c.health === healthFilter);
    if (platformFilter !== "all") list = list.filter(c => c.platform === platformFilter);
    const platformCampaigns = activePlatform ? list.filter(c => c.platform === activePlatform) : list;

    return platformCampaigns.sort((a, b) => {
      if (sortKey === "roas")    return b.roas - a.roas;
      if (sortKey === "spend")   return b.spend - a.spend;
      if (sortKey === "revenue") return b.revenue - a.revenue;
      if (sortKey === "cpa")     return a.cpa - b.cpa;
      return 0;
    });
  }, [healthFilter, platformFilter, sortKey, activePlatform]);

  // Totals
  const totalSpend   = CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const toScale = CAMPAIGNS.filter(c => c.health === "scale").length;
  const toPause = CAMPAIGNS.filter(c => c.health === "pause").length;

  return (
    <>
      <PageHeader
        title="Campaign Intelligence"
        tabs={PAGE_TABS.map(t => ({ key: t.key, label: t.label }))}
        activeTab={tab}
        onTabChange={k => setTab(k as PageTab)}
      />

      <PageContent>

      {/* ── KPI summary strip (always visible) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Monthly Spend",   value: formatCurrency(totalSpend),            color: "text-foreground"    },
          { label: "Monthly Revenue", value: formatCurrency(totalRevenue),           color: "text-emerald-600"   },
          { label: "Blended ROAS",    value: `${(totalRevenue / totalSpend).toFixed(2)}×`, color: "text-primary" },
          { label: "Active Campaigns", value: `${toScale} scale · ${toPause} pause`, color: "text-amber-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card px-4 py-3.5">
            <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── AI STRATEGY tab ── */}
      {tab === "intelligence" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: AI brief (2 cols) */}
          <div className="lg:col-span-2">
            <AiBriefCard brief={brief} />
          </div>

          {/* Right: Platform health cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Health</p>
            {summaries.map((s) => (
              <PlatformCard
                key={s.platform}
                summary={s}
                active={activePlatform === s.platform}
                onClick={() => { setTab("campaigns"); setPlatform(s.platform); setActivePlatform(s.platform); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── ALL CAMPAIGNS tab ── */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />

            {/* Health filter */}
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "scale", "monitor", "pause"] as HealthFilter[]).map((h) => (
                <button
                  key={h}
                  onClick={() => setHealthFilter(h)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                    healthFilter === h
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {h === "all" ? "All" : HEALTH_CONFIG[h].label}
                  {h !== "all" && (
                    <span className="ml-1 text-[10px]">({CAMPAIGNS.filter(c => c.health === h).length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={e => setPlatform(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-xs bg-card focus:outline-none"
            >
              <option value="all">All Platforms</option>
              {Object.entries(PLATFORM_META).map(([id, m]) => (
                <option key={id} value={id}>{m.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border px-3 py-1.5 text-xs bg-card focus:outline-none ml-auto"
            >
              <option value="spend">Sort by Spend</option>
              <option value="roas">Sort by ROAS</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="cpa">Sort by CPA</option>
            </select>
          </div>

          {/* Campaign table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Decision</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ROAS (4wk trend)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spend/mo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue/mo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPA</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCampaigns.map((c, i) => (
                    <CampaignRow key={c.id} c={c} rank={i + 1} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" /> {toScale} campaigns to scale
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 leading-relaxed">
                {(brief.campaignsToScale ?? []).slice(0, 3).join(", ") || "No campaigns identified"} — all above 4× ROAS with positive trend.
              </p>
            </div>
            <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-4">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
                <Pause className="h-4 w-4" /> {toPause} campaigns to pause
              </p>
              <p className="text-xs text-red-600 dark:text-red-400/80 leading-relaxed">
                {(brief.campaignsToPause ?? []).slice(0, 3).join(", ") || "No campaigns identified"} — all below 2× ROAS and worsening.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BY PLATFORM tab ── */}
      {tab === "platforms" && (
        <div className="space-y-5">
          {/* Platform cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.map((s) => (
              <PlatformCard
                key={s.platform}
                summary={s}
                active={activePlatform === s.platform}
                onClick={() => setActivePlatform(activePlatform === s.platform ? null : s.platform)}
              />
            ))}
          </div>

          {/* Platform comparison chart */}
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Platform ROAS Comparison
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={summaries.map(s => ({ name: s.label, roas: parseFloat(s.roas.toFixed(2)), spend: s.spend }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number, n: string) => [n === "roas" ? `${v}×` : formatCurrency(v), n === "roas" ? "ROAS" : "Monthly Spend"]} />
                <Legend />
                <Bar dataKey="roas" name="ROAS" radius={[4, 4, 0, 0]}>
                  {summaries.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.health === "scale" ? "#22c55e" : s.health === "pause" ? "#ef4444" : "#f59e0b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform recommendations list */}
          <div className="space-y-3">
            {summaries.map((s) => {
              const hCfg = HEALTH_CONFIG[s.health];
              const Icon = hCfg.icon;
              return (
                <div key={s.platform} className={cn("rounded-xl border p-4", hCfg.bg)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.logo}</span>
                      <span className="font-semibold text-foreground">{s.label}</span>
                      <span className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", hCfg.color)}>
                        <Icon className="h-3 w-3" /> {hCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>ROAS: <strong className={hCfg.color}>{s.roas.toFixed(2)}×</strong></span>
                      <span>Spend: <strong>{formatCurrency(s.spend)}/mo</strong></span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{s.recommendation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INSTAGRAM VS FB tab ── */}
      {tab === "meta" && (
        <div className="space-y-5">
          <MetaBreakdown />

          {/* Individual Meta campaigns */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <p className="text-sm font-semibold">All Meta Campaigns — Side by Side</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click any row to see AI recommendation</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Decision</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ROAS (4wk trend)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spend/mo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue/mo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPA</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CAMPAIGNS
                    .filter(c => c.platform === "meta_ads")
                    .sort((a, b) => b.roas - a.roas)
                    .map((c, i) => (
                      <CampaignRow key={c.id} c={c} rank={i + 1} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </PageContent>
    </>
  );
}
