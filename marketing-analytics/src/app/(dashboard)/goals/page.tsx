"use client";

import { useState, useId } from "react";
import {
  Target, TrendingUp, TrendingDown, Plus, ChevronDown,
  Sparkles, CheckCircle2, AlertCircle, Clock, Users, Building2,
  Zap, Flag, Star, MoreHorizontal, ArrowRight,
  Eye, Heart, UserCog, Trash2, X, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type GoalStatus = "on_track" | "at_risk" | "behind" | "achieved";
type GoalScope  = "personal" | "team" | "company" | "okr";

interface KeyResult {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  trend: number[];
}

interface Goal {
  id: string;
  title: string;
  scope: GoalScope;
  owner: string;
  period: string;
  status: GoalStatus;
  progress: number; // 0-100
  keyResults: KeyResult[];
  aiInsight?: string;
  favorite?: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Hit $250k Ad Revenue this Quarter",
    scope: "company",
    owner: "Marketing Team",
    period: "Q2 2026",
    status: "on_track",
    progress: 76,
    aiInsight: "At current ROAS trajectory you'll hit $261k — 4.4% above target. Scale Performance Max budget by 15% to accelerate.",
    keyResults: [
      { id: "kr1", label: "Google Ads Revenue", current: 98400,  target: 120000, unit: "$", trend: [42000, 58000, 71000, 85000, 98400] },
      { id: "kr2", label: "Meta Ads Revenue",   current: 63200,  target: 80000,  unit: "$", trend: [28000, 38000, 49000, 57000, 63200] },
      { id: "kr3", label: "TikTok Revenue",     current: 28800,  target: 50000,  unit: "$", trend: [8000, 14000, 19000, 24000, 28800] },
    ],
  },
  {
    id: "g2",
    title: "Reduce Blended CPA below $12",
    scope: "team",
    owner: "Paid Search",
    period: "Q2 2026",
    status: "at_risk",
    progress: 58,
    aiInsight: "Current blended CPA is $14.20 — $2.20 above target. Pausing bottom 3 campaigns by CPA would bring you to $13.10.",
    keyResults: [
      { id: "kr4", label: "Google Ads CPA", current: 14.7, target: 11.0, unit: "$", trend: [18.2, 17.1, 16.3, 15.4, 14.7] },
      { id: "kr5", label: "Meta Ads CPA",   current: 13.8, target: 12.0, unit: "$", trend: [16.0, 15.2, 14.6, 14.1, 13.8] },
      { id: "kr6", label: "TikTok CPA",     current: 18.4, target: 15.0, unit: "$", trend: [22.0, 21.0, 20.1, 19.2, 18.4] },
    ],
  },
  {
    id: "g3",
    title: "Grow Organic Sessions to 120k/month",
    scope: "team",
    owner: "SEO Team",
    period: "Q2 2026",
    status: "behind",
    progress: 38,
    aiInsight: "Sessions grew only 4% MoM vs 12% needed. Quick-win: 47 keywords in positions 5–12 need internal linking boost.",
    keyResults: [
      { id: "kr7", label: "Monthly Organic Sessions", current: 45600, target: 120000, unit: "",  trend: [30000, 35000, 38000, 42000, 45600] },
      { id: "kr8", label: "Avg Position",             current: 18.4,  target: 12.0,   unit: "",  trend: [24.0, 22.0, 20.5, 19.2, 18.4] },
      { id: "kr9", label: "Click-Through Rate",       current: 3.1,   target: 5.0,    unit: "%", trend: [2.4, 2.6, 2.8, 3.0, 3.1] },
    ],
  },
  {
    id: "g4",
    title: "Achieve 4× Blended ROAS",
    scope: "company",
    owner: "All Channels",
    period: "Q2 2026",
    status: "achieved",
    progress: 100,
    aiInsight: "Blended ROAS reached 4.44× — exceeding the 4.0× target by 11%. Consider raising the Q3 target to 4.5×.",
    keyResults: [
      { id: "kr10", label: "Blended ROAS",   current: 4.44,  target: 4.0,   unit: "×", trend: [2.8, 3.2, 3.7, 4.1, 4.44] },
      { id: "kr11", label: "Total Ad Spend", current: 16700, target: 20000, unit: "$", trend: [10000, 12000, 14000, 15500, 16700] },
      { id: "kr12", label: "Total Revenue",  current: 74148, target: 80000, unit: "$", trend: [28000, 38400, 51800, 63550, 74148] },
    ],
  },
  {
    id: "g5",
    title: "Launch & hit 1,000 conversions from LinkedIn",
    scope: "team",
    owner: "B2B Growth",
    period: "Q2 2026",
    status: "on_track",
    progress: 62,
    aiInsight: "Pacing at 94 conv/week. At this rate you'll finish at ~1,128. InMail campaigns are outperforming Sponsored Content 2:1.",
    keyResults: [
      { id: "kr13", label: "LinkedIn Conversions", current: 620,  target: 1000, unit: "",  trend: [80, 180, 320, 480, 620] },
      { id: "kr14", label: "Cost Per Lead",        current: 54.2, target: 50.0, unit: "$", trend: [72, 66, 61, 57, 54.2] },
    ],
  },
  {
    id: "g6",
    title: "Improve Email Open Rate to 35%",
    scope: "personal",
    owner: "You",
    period: "Q2 2026",
    status: "on_track",
    progress: 82,
    aiInsight: "Current open rate 28.7% — on pace to hit 35% by end of quarter if subject line A/B tests continue.",
    keyResults: [
      { id: "kr15", label: "Open Rate",  current: 28.7, target: 35.0, unit: "%", trend: [18.0, 21.0, 24.5, 26.8, 28.7] },
      { id: "kr16", label: "Click Rate", current: 4.2,  target: 6.0,  unit: "%", trend: [2.1, 2.8, 3.4, 3.9, 4.2] },
    ],
  },
  {
    id: "g7",
    title: "Increase Mobile Conversion Rate",
    scope: "okr",
    owner: "Product",
    period: "Q2 2026",
    status: "at_risk",
    progress: 44,
    aiInsight: "Mobile CVR is 1.8% vs desktop 3.1%. Checkout UX improvements could bridge the gap by end of quarter.",
    keyResults: [
      { id: "kr17", label: "Mobile CVR",  current: 1.8, target: 3.0, unit: "%", trend: [0.9, 1.2, 1.4, 1.6, 1.8] },
    ],
  },
];

const AI_SUGGESTIONS = [
  { icon: TrendingUp,   color: "text-emerald-500", text: "Raise Q3 ROAS target to 4.5× — you're trending 11% above Q2 goal." },
  { icon: AlertCircle,  color: "text-amber-500",   text: "CPA goal at risk — suggest mid-quarter review on 8 underperforming ad sets." },
  { icon: Zap,          color: "text-blue-500",    text: "Add a TikTok Engagement Rate OKR — it's your fastest-growing channel with no KR tracking yet." },
  { icon: Flag,         color: "text-purple-500",  text: "SEO goal needs a recovery plan. Create a sub-goal: 'Fix 47 quick-win keywords by May 15'." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  on_track: { label: "On Track",  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40",  icon: CheckCircle2 },
  at_risk:  { label: "At Risk",   color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/40",    icon: AlertCircle  },
  behind:   { label: "Behind",    color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/40",        icon: TrendingDown },
  achieved: { label: "Achieved",  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40",      icon: Star         },
};

function progressColor(p: number) {
  if (p >= 90) return "#22c55e";
  if (p >= 60) return "#3b82f6";
  if (p >= 40) return "#f59e0b";
  return "#ef4444";
}

function formatVal(v: number, unit: string) {
  if (unit === "$") return `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`;
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "×") return `${v.toFixed(2)}×`;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={60} height={28}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Progress bar row ──────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

// ─── Row dropdown ──────────────────────────────────────────────────────────────
function RowDropdown({
  goalId, isFavorite,
  onView, onFavorite, onDelete,
}: {
  goalId: string;
  isFavorite: boolean;
  onView: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border bg-card shadow-xl py-1 text-sm">
            <button onClick={() => { onView(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-muted transition-colors">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Details
            </button>
            <button onClick={() => { onFavorite(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-muted transition-colors">
              <Heart className={cn("h-3.5 w-3.5", isFavorite ? "text-rose-500 fill-rose-500" : "text-muted-foreground")} />
              {isFavorite ? "Unfavorite" : "Favorite"}
            </button>
            <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-muted transition-colors">
              <UserCog className="h-3.5 w-3.5 text-muted-foreground" /> User Access
            </button>
            <div className="my-1 border-t border-border" />
            <button onClick={() => { onDelete(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-muted transition-colors text-red-500">
              <Trash2 className="h-3.5 w-3.5" /> Delete Goal
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Detail slide-over ─────────────────────────────────────────────────────────
function GoalDetail({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const color = progressColor(goal.progress);
  const cfg = STATUS_CONFIG[goal.status];
  const StatusIcon = cfg.icon;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-card shadow-2xl overflow-y-auto h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
          <h2 className="font-bold text-lg leading-tight">{goal.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
              <StatusIcon className="h-3 w-3" /> {cfg.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {goal.owner}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> {goal.period}
            </span>
          </div>

          {/* Overall progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">Overall Progress</span>
              <span className="text-sm font-bold" style={{ color }}>{goal.progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goal.progress}%`, backgroundColor: color }} />
            </div>
          </div>

          {/* AI Insight */}
          {goal.aiInsight && (
            <div className="flex items-start gap-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 p-4">
              <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">{goal.aiInsight}</p>
            </div>
          )}

          {/* Key Results */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Results</p>
            <div className="space-y-4">
              {goal.keyResults.map((kr) => {
                const pct = Math.min(100, Math.round((kr.current / kr.target) * 100));
                const krColor = progressColor(pct);
                return (
                  <div key={kr.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{kr.label}</span>
                      <div className="flex items-center gap-2">
                        <MiniTrend values={kr.trend} color={krColor} />
                        <span className="text-sm font-bold" style={{ color: krColor }}>{formatVal(kr.current, kr.unit)}</span>
                        <span className="text-xs text-muted-foreground">/ {formatVal(kr.target, kr.unit)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: krColor }} />
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-xs font-semibold" style={{ color: krColor }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Goal Modal ─────────────────────────────────────────────────────────
function CreateGoalModal({ onClose, onSave }: { onClose: () => void; onSave: (g: Goal) => void }) {
  const uid = useId();
  const [title, setTitle]   = useState("");
  const [owner, setOwner]   = useState("");
  const [period, setPeriod] = useState("Q2 2026");
  const [scope, setScope]   = useState<GoalScope>("team");
  const [target, setTarget] = useState("");
  const [metric, setMetric] = useState("Revenue");

  function handleSave() {
    if (!title.trim()) return;
    const newGoal: Goal = {
      id: `g-${Date.now()}`,
      title: title.trim(),
      scope,
      owner: owner || "You",
      period,
      status: "on_track",
      progress: 0,
      keyResults: target ? [{
        id: `kr-${Date.now()}`,
        label: metric,
        current: 0,
        target: parseFloat(target) || 100,
        unit: "$",
        trend: [0, 0, 0, 0, 0],
      }] : [],
      aiInsight: undefined,
    };
    onSave(newGoal);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold">Create Goal</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Goal Title *
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hit $500k revenue this quarter"
              className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as GoalScope)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="personal">Personal</option>
                <option value="team">Team</option>
                <option value="company">Company</option>
                <option value="okr">OKR</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Timeframe
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {(() => {
                  const y = new Date().getFullYear();
                  return [`Q1 ${y}`, `Q2 ${y}`, `Q3 ${y}`, `Q4 ${y}`, `H1 ${y}`, `H2 ${y}`, `FY ${y}`, `Q1 ${y+1}`, `Q2 ${y+1}`, `Q3 ${y+1}`, `Q4 ${y+1}`, `FY ${y+1}`];
                })().map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Owner
            </label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Marketing Team"
              className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Key Result (optional)
            </label>
            <div className="flex gap-2">
              <input
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                placeholder="Metric name"
                className="flex-1 rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target"
                className="w-28 rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type GoalTab = "my" | "team" | "company" | "okr";

const GOAL_TABS: { key: GoalTab; label: string }[] = [
  { key: "my",      label: "MY GOALS"      },
  { key: "team",    label: "TEAM GOALS"    },
  { key: "company", label: "COMPANY GOALS" },
  { key: "okr",     label: "OKRs Beta"     },
];

export default function GoalsPage() {
  const [tab, setTab]             = useState<GoalTab>("my");
  const [goals, setGoals]         = useState<Goal[]>(SEED_GOALS);
  const [createOpen, setCreate]   = useState(false);
  const [detailGoal, setDetail]   = useState<Goal | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const tabScope: GoalScope = tab === "my" ? "personal" : tab === "okr" ? "okr" : tab as GoalScope;
  const filtered = tab === "my"
    ? goals.filter((g) => g.scope === "personal" || favorites.has(g.id))
    : goals.filter((g) => g.scope === tabScope);

  const totals = {
    on_track: goals.filter((g) => g.status === "on_track").length,
    at_risk:  goals.filter((g) => g.status === "at_risk").length,
    behind:   goals.filter((g) => g.status === "behind").length,
    achieved: goals.filter((g) => g.status === "achieved").length,
  };
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Goals & OKRs"
        tabs={GOAL_TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={tab}
        onTabChange={(k) => setTab(k as GoalTab)}
        actions={
          <button
            onClick={() => setCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        }
      />

      <PageContent>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Avg Progress", value: `${avgProgress}%`, color: "text-primary" },
          { label: "On Track",  value: totals.on_track, color: "text-emerald-600" },
          { label: "At Risk",   value: totals.at_risk,  color: "text-amber-600"   },
          { label: "Behind",    value: totals.behind,   color: "text-red-600"     },
          { label: "Achieved",  value: totals.achieved, color: "text-blue-600"    },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* AI Suggestions panel */}
      <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">AI Goal Suggestions</span>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {AI_SUGGESTIONS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 px-3 py-2">
              <s.icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", s.color)} />
              <p className="text-xs text-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">No goals here yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first goal to start tracking progress.</p>
          </div>
          <button onClick={() => setCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[36%]">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[22%]">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeframe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((goal) => {
                  const cfg = STATUS_CONFIG[goal.status];
                  const StatusIcon = cfg.icon;
                  const color = progressColor(goal.progress);
                  const isFav = favorites.has(goal.id);
                  return (
                    <tr key={goal.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Title */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {isFav && <Heart className="h-3 w-3 text-rose-500 fill-rose-500 shrink-0" />}
                          <button
                            onClick={() => setDetail(goal)}
                            className="font-medium text-foreground hover:text-primary hover:underline text-left leading-snug"
                          >
                            {goal.title}
                          </button>
                        </div>
                        {goal.aiInsight && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            <Sparkles className="h-2.5 w-2.5 inline mr-0.5 text-violet-500" />
                            {goal.aiInsight}
                          </p>
                        )}
                      </td>

                      {/* Progress bar */}
                      <td className="px-4 py-3.5">
                        <ProgressBar value={goal.progress} color={color} />
                      </td>

                      {/* Timeframe */}
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {goal.period}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn("flex items-center gap-1.5 w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.bg, cfg.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {goal.owner}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end">
                          <RowDropdown
                            goalId={goal.id}
                            isFavorite={isFav}
                            onView={() => setDetail(goal)}
                            onFavorite={() => toggleFav(goal.id)}
                            onDelete={() => deleteGoal(goal.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </PageContent>

      {/* Modals */}
      {createOpen && (
        <CreateGoalModal
          onClose={() => setCreate(false)}
          onSave={(g) => setGoals((prev) => [g, ...prev])}
        />
      )}
      {detailGoal && <GoalDetail goal={detailGoal} onClose={() => setDetail(null)} />}
    </>
  );
}
