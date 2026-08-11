"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, ArrowRight, Bell, BellOff, Send, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendMetric {
  platform: string;
  metric: string;
  value: string;
  change: number; // positive = up, negative = down
  logo: string; // emoji fallback
}

interface AiMonitorBoardProps {
  userName?: string;
  dayRange?: number;
  narrative?: string;
}

// ── Demo trending metrics ─────────────────────────────────────────────────────

const TRENDING_UP: TrendMetric[] = [
  { platform: "Facebook",  metric: "Post Impressions", value: "722k",   change: 737,  logo: "📘" },
  { platform: "Facebook",  metric: "Page Reach",       value: "599.6k", change: 732,  logo: "📘" },
  { platform: "Instagram", metric: "Story Views",      value: "184.3k", change: 312,  logo: "📸" },
  { platform: "Google Ads",metric: "Conversions",      value: "1,284",  change: 148,  logo: "🔵" },
  { platform: "TikTok",    metric: "Video Views",      value: "2.1M",   change: 94,   logo: "🎵" },
  { platform: "LinkedIn",  metric: "Impressions",      value: "47.2k",  change: 63,   logo: "💼" },
];

const TRENDING_DOWN: TrendMetric[] = [
  { platform: "Google Ads", metric: "Clicks",        value: "444",    change: -83, logo: "🔵" },
  { platform: "Meta Ads",   metric: "Impressions",   value: "172.6k", change: -80, logo: "📘" },
  { platform: "Bing Ads",   metric: "CTR",           value: "1.2%",   change: -44, logo: "🪟" },
  { platform: "Pinterest",  metric: "Saves",         value: "892",    change: -31, logo: "📌" },
];

const KPI_SUMMARY = [
  { label: "Blended ROAS",   value: "4.44×", delta: "+12.3%",  color: "text-emerald-600" },
  { label: "Total Spend",    value: "$16.7k", delta: "+14.2%", color: "text-blue-600" },
  { label: "Revenue",        value: "$74.1k", delta: "+8.7%",  color: "text-emerald-600" },
  { label: "Blended CPA",    value: "$14.20", delta: "-8.4%",  color: "text-emerald-600" },
  { label: "Conv. Rate",     value: "3.2%",   delta: "-0.4pp", color: "text-amber-600" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricPill({ m, direction }: { m: TrendMetric; direction: "up" | "down" }) {
  const isUp = direction === "up";
  return (
    <div className={cn(
      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
      isUp
        ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40"
        : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40"
    )}>
      <span className="text-lg leading-none shrink-0">{m.logo}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{m.platform}</p>
        <p className="text-xs font-semibold text-foreground truncate">{m.metric}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{m.value}</p>
        <p className={cn("text-[11px] font-semibold flex items-center gap-0.5 justify-end", isUp ? "text-emerald-600" : "text-red-500")}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "+" : ""}{m.change}%
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AiMonitorBoard({ userName, dayRange = 7, narrative }: AiMonitorBoardProps) {
  const [smartAlertsOn, setSmartAlertsOn] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [showAll, setShowAll] = useState(false);

  const firstName = userName?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const defaultNarrative = narrative ??
    `Your blended ROAS is 4.44× — up 12.3% vs last week. Facebook organic reach is surging (+732%) from a viral campaign. Google Ads clicks dropped sharply (−83%) — likely due to budget exhaustion mid-week. TikTok video views hit 2.1M, your best day ever. Overall spend is on track at $16.7k; you have $3.3k remaining for the period.`;

  const upMetrics   = showAll ? TRENDING_UP  : TRENDING_UP.slice(0, 4);
  const downMetrics = showAll ? TRENDING_DOWN : TRENDING_DOWN.slice(0, 3);

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/10 overflow-hidden">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shrink-0 mt-0.5">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {greeting}, {firstName}! 👋
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Here&apos;s your AI performance recap for the last {dayRange} days
            </p>
          </div>
        </div>

        {/* Smart Alerts toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">Smart Alerts</span>
          <button
            onClick={() => setSmartAlertsOn(!smartAlertsOn)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
              smartAlertsOn ? "bg-violet-600" : "bg-muted"
            )}
            aria-label="Toggle smart alerts"
          >
            <span className={cn(
              "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
              smartAlertsOn ? "translate-x-4" : "translate-x-0.5"
            )} />
          </button>
          {smartAlertsOn
            ? <Bell className="h-3.5 w-3.5 text-violet-600" />
            : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </div>
      </div>

      {/* AI Narrative */}
      <div className="mx-5 mb-4 rounded-xl bg-white/70 dark:bg-white/5 border border-violet-100 dark:border-violet-800/30 px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">{defaultNarrative}</p>
        <Link href="/ask" className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 mt-2">
          Ask AI for deeper analysis <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="mx-5 mb-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {KPI_SUMMARY.map((k) => (
          <div key={k.label} className="rounded-xl bg-white/70 dark:bg-white/5 border border-violet-100 dark:border-violet-800/30 px-3 py-2.5 text-center">
            <p className={cn("text-sm font-bold", k.color)}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{k.label}</p>
            <p className={cn("text-[10px] font-medium mt-0.5", k.color)}>{k.delta}</p>
          </div>
        ))}
      </div>

      {/* Trending metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pb-4">
        {/* Trending Up */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Trending Up</span>
          </div>
          <div className="space-y-1.5">
            {upMetrics.map((m, i) => (
              <MetricPill key={i} m={m} direction="up" />
            ))}
          </div>
        </div>

        {/* Trending Down */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Trending Down</span>
          </div>
          <div className="space-y-1.5">
            {downMetrics.map((m, i) => (
              <MetricPill key={i} m={m} direction="down" />
            ))}
          </div>
        </div>
      </div>

      {/* Show more / less */}
      <div className="px-5 pb-3 flex justify-center">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {showAll ? "Show less" : `Show ${TRENDING_UP.length - 4 + TRENDING_DOWN.length - 3} more metrics`}
          <ChevronRight className={cn("h-3 w-3 transition-transform", showAll && "rotate-90")} />
        </button>
      </div>

      {/* Follow-up chat input */}
      <div className="border-t border-violet-200 dark:border-violet-800/40 bg-white/40 dark:bg-white/5 px-5 py-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
        <form
          className="flex-1 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (chatInput.trim()) {
              window.location.href = `/ask?q=${encodeURIComponent(chatInput)}`;
            }
          }}
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a follow-up… e.g. 'Why did Google Ads clicks drop?'"
            className="flex-1 text-xs bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            Ask AI <ArrowRight className="h-3 w-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
