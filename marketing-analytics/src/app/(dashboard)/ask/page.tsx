"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles, Send, User, TrendingUp, TrendingDown, AlertCircle,
  Zap, BarChart3, Target, RefreshCw, Lightbulb, ChevronRight,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CAMPAIGNS } from "@/lib/campaign-data";

// ─── Types ────────────────────────────────────────────────────────────────────
type MessageRole = "user" | "ai";
type ChartType = "line" | "bar" | "none";

interface ChartData {
  type: ChartType;
  data: Record<string, number | string>[];
  dataKey: string;
  xKey: string;
  color: string;
  label: string;
}

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  chart?: ChartData;
  insights?: string[];
  actions?: string[];
  timestamp: Date;
}

// ─── Canned AI answers (campaign-aware) ──────────────────────────────────────
const CANNED: Record<string, Omit<Message, "id" | "role" | "timestamp">> = {
  default: {
    text: "Based on your 14 active campaigns across 6 platforms, here's the strategic picture:\n\nInstagram is your fastest-growing channel (5.2× ROAS, up 18% in 4 weeks). Facebook Feed is declining (now 1.8× ROAS, down from 2.4×). Google Shopping is your best overall performer at 6.2× ROAS. Snapchat is wasting £700/month with 1.2× ROAS.",
    insights: [
      "Move £3,000/month from Facebook Feed → Instagram Feed & Stories (+£9,000 est. revenue).",
      "Google Shopping 6.2× ROAS — increase by £800/month immediately.",
      "Pause 4 campaigns (Facebook Feed, Facebook Carousel, Snapchat, Google Display) — save £4,380/month.",
    ],
    actions: ["View Campaign Intel", "See Instagram vs Facebook", "Open Budget Plan"],
  },
  instagram: {
    text: "Instagram is significantly outperforming Facebook right now — and the gap is widening every week.\n\nInstagram Feed: 5.2× ROAS (was 4.4× four weeks ago)\nInstagram Stories: 4.3× ROAS (was 3.8×)\nInstagram Reels: 3.3× and growing\n\nFacebook Feed: 1.8× ROAS (was 2.4× four weeks ago — declining)\nFacebook Carousel: 1.4× ROAS (declining)",
    chart: {
      type: "bar", xKey: "placement", dataKey: "roas", color: "#e1306c", label: "Instagram vs Facebook ROAS",
      data: [
        { placement: "IG Feed",      roas: 5.20 },
        { placement: "IG Stories",   roas: 4.30 },
        { placement: "FB Retarget",  roas: 5.40 },
        { placement: "IG Reels",     roas: 3.30 },
        { placement: "FB Feed",      roas: 1.80 },
        { placement: "FB Carousel",  roas: 1.40 },
      ],
    },
    insights: [
      "Instagram is 2.9× more effective than Facebook per £ spent right now.",
      "Move £3,000/month Facebook Feed budget → Instagram. Estimated +£9,000 revenue/month.",
      "Instagram Reels CTR is 4.1% — create more UGC-style video content for this placement.",
      "Facebook Retargeting (5.4× ROAS) is the ONE Facebook placement that's working — keep it.",
    ],
    actions: ["View Instagram vs Facebook", "Move Budget to Instagram", "See Full Meta Analysis"],
  },
  facebook: {
    text: "Facebook Feed campaigns are underperforming and declining. Here's the honest picture:\n\nYour 2 Facebook Feed campaigns (Awareness + Carousel) are spending £3,000/month and returning only 1.4–1.8× ROAS — and both are declining week-on-week. The audience is fatigued.\n\nThe only Facebook campaign that's working is your Retargeting campaign (5.4× ROAS) — that's running on a warm audience, which is why it performs.\n\nMy recommendation: Pause Facebook Feed & Carousel. Keep Retargeting.",
    insights: [
      "Facebook Feed was 2.4× ROAS 4 weeks ago — now 1.8× and still declining.",
      "Audience overlap with Instagram is causing ad fatigue on Facebook placements.",
      "Pausing Facebook Feed + Carousel saves £3,000/month — redirect to Instagram.",
      "Facebook Retargeting (abandoned cart, warm audience) = 5.4× ROAS — always keep retargeting.",
    ],
    actions: ["Pause Facebook Campaigns", "View Campaign Intel", "See Platform Comparison"],
  },
  roas: {
    text: "Your blended ROAS is 3.72× across all platforms — but that average hides massive differences between campaigns. Here's the full breakdown:",
    chart: {
      type: "bar", xKey: "platform", dataKey: "roas", color: "#8b5cf6", label: "ROAS by Platform",
      data: [
        { platform: "Google",    roas: 4.88 },
        { platform: "LinkedIn",  roas: 5.00 },
        { platform: "Instagram", roas: 4.60 },
        { platform: "TikTok",    roas: 2.80 },
        { platform: "Facebook",  roas: 2.20 },
        { platform: "Snapchat",  roas: 1.20 },
      ],
    },
    insights: [
      "Google Shopping (6.2×) and PMax (5.6×) are your strongest performers — scale both.",
      "Instagram (4.3–5.2×) is your best social channel — increase budget here.",
      "Snapchat (1.2×) is below break-even — pause immediately.",
      "Facebook (1.4–1.8×) is declining — only keep retargeting campaigns.",
    ],
    actions: ["View Full Campaign Table", "See Platform Comparison", "Open Budget Reallocation"],
  },
  spend: {
    text: "Your total ad spend this month is **$16,700** across 6 platforms. Here's the monthly trend:",
    chart: {
      type: "line", xKey: "month", dataKey: "spend", color: "#3b82f6", label: "Monthly Spend ($k)",
      data: [
        { month: "Jan", spend: 9.2 },
        { month: "Feb", spend: 11.4 },
        { month: "Mar", spend: 13.1 },
        { month: "Apr", spend: 15.0 },
        { month: "May", spend: 16.7 },
      ],
    },
    insights: [
      "Spend grew +14% MoM — in line with your Q2 budget ramp plan.",
      "Google Ads takes 49% of total spend — diversification recommended.",
      "You have $3,300 remaining budget for May. Consider TikTok burst campaign.",
    ],
    actions: ["View Budget Pacing", "Rebalance Channels", "Open Forecasts"],
  },
  campaigns: {
    text: "Across your 14 active campaigns, here's the priority order for this week:\n\n🟢 Scale Now: Google Shopping (6.2×), PMax (5.6×), Instagram Feed (5.2×), FB Retargeting (5.4×), LinkedIn InMail (5.0×)\n🟡 Monitor: Google Search Brand (4.2×), Instagram Reels (3.3×), TikTok In-Feed (3.6×)\n🔴 Pause Now: Facebook Feed (1.8×, declining), Facebook Carousel (1.4×, declining), Google Display (1.4×), Snapchat Stories (1.2×)",
    chart: {
      type: "bar", xKey: "name", dataKey: "roas", color: "#22c55e", label: "Campaign ROAS Ranking",
      data: [
        { name: "G. Shopping", roas: 6.20 },
        { name: "FB Retarget", roas: 5.40 },
        { name: "G. PMax",     roas: 5.60 },
        { name: "IG Feed",     roas: 5.20 },
        { name: "LI InMail",   roas: 5.00 },
        { name: "IG Stories",  roas: 4.30 },
        { name: "TikTok IF",   roas: 3.60 },
        { name: "IG Reels",    roas: 3.30 },
        { name: "FB Feed",     roas: 1.80 },
        { name: "Snapchat",    roas: 1.20 },
      ],
    },
    insights: [
      "4 campaigns are below 2× ROAS — pause them to free up £4,380/month.",
      "Top 5 campaigns average 5.3× ROAS — increase their budgets immediately.",
      "Instagram Reels is growing fast (3.3× and climbing) — test more UGC video.",
    ],
    actions: ["Open Campaign Intel", "View All 14 Campaigns", "See Platform Comparison"],
  },
  focus: {
    text: "The single biggest opportunity right now is moving budget from Facebook to Instagram.\n\nInstagram Feed: 5.2× ROAS (improving every week)\nFacebook Feed: 1.8× ROAS (declining every week)\n\nThese are both Meta placements — same ad account, same targeting options. You're getting 2.9× more return per pound on Instagram. Move £3,000/month Facebook Feed → Instagram Feed today.",
    insights: [
      "Google Shopping is your #1 campaign — 6.2× ROAS. Increase by £800/month.",
      "Instagram is your best social channel — move all Facebook Feed budget here.",
      "LinkedIn is proving its value for B2B at 5× ROAS despite high CPA — keep scaling.",
      "Pause Snapchat, Google Display, Facebook Carousel to free up £2,600/month.",
    ],
    actions: ["View Campaign Intel", "Open Instagram vs Facebook", "See 4-Week Action Plan"],
  },
  pause: {
    text: "Based on performance data, here are the 4 campaigns you should pause immediately:\n\n1. Facebook Feed — Awareness: 1.8× ROAS, declining 4 weeks\n2. Facebook Carousel — Products: 1.4× ROAS, declining 4 weeks\n3. Snapchat Story Ads: 1.2× ROAS, same Gen Z audience as TikTok but much worse results\n4. Google Display — Retargeting: 1.4× ROAS with 380k impressions wasted\n\nCombined monthly spend: £4,380. Combined revenue generated: barely break-even.",
    insights: [
      "Pausing these 4 campaigns frees £4,380/month — reallocate to 5× ROAS channels.",
      "The Facebook Retargeting campaign is NOT on this list — 5.4× ROAS, always keep retargeting.",
      "TikTok is outperforming Snapchat for the same Gen Z audience — consolidate there.",
      "Display ads rarely work for e-commerce — your Shopping campaigns are far more efficient.",
    ],
    actions: ["View All Campaigns", "See What to Scale", "Open Campaign Intel"],
  },
  tiktok: {
    text: "TikTok is showing strong growth momentum — but there's a gap between your two campaigns:\n\nTikTok In-Feed (Trending Sound): 3.6× ROAS, CTR 6.8%, growing every week\nTikTok TopView (Launch Campaign): 2.0× ROAS, brand awareness play\n\nIn-Feed is converting well. TopView is expensive and low-ROAS — it's a brand awareness spend, not a performance spend.",
    chart: {
      type: "line", xKey: "week", dataKey: "roas", color: "#2d2d2d", label: "TikTok In-Feed ROAS Trend",
      data: [
        { week: "4 wks ago", roas: 2.8 },
        { week: "3 wks ago", roas: 3.1 },
        { week: "2 wks ago", roas: 3.4 },
        { week: "This week", roas: 3.6 },
      ],
    },
    insights: [
      "TikTok In-Feed CTR (6.8%) is your highest CTR across all platforms.",
      "The trending sound strategy is working — test 2-3 new sounds each week.",
      "TopView gives massive reach (580k impressions) but consider if brand awareness is a priority.",
      "TikTok's Gen Z audience doesn't overlap with LinkedIn — good channel diversification.",
    ],
    actions: ["View TikTok Campaigns", "Compare vs Snapchat", "Open Campaign Intel"],
  },
  google: {
    text: "Google Ads is your best-performing platform overall, with Shopping and PMax leading:\n\nGoogle Shopping: 6.2× ROAS — your #1 campaign across all platforms\nGoogle PMax: 5.6× ROAS and improving every week\nGoogle Search (Brand): 4.2× ROAS — stable brand defence\nGoogle Search (Competitor): 2.7× ROAS — marginal, needs testing\nGoogle Display: 1.4× ROAS — pause this immediately",
    chart: {
      type: "bar", xKey: "campaign", dataKey: "roas", color: "#4285F4", label: "Google Campaign ROAS",
      data: [
        { campaign: "Shopping",    roas: 6.20 },
        { campaign: "PMax",        roas: 5.60 },
        { campaign: "Brand Search",roas: 4.20 },
        { campaign: "Competitor",  roas: 2.70 },
        { campaign: "Display",     roas: 1.40 },
      ],
    },
    insights: [
      "Shopping 6.2× — increase budget by £800/month immediately.",
      "PMax 5.6× and still improving — increase by £800/month alongside Shopping.",
      "Pause Google Display — 380k impressions at 1.4× ROAS is burning money.",
      "Competitor terms (2.7×) need better ad copy before you scale — A/B test first.",
    ],
    actions: ["View Google Campaigns", "Open Campaign Intel", "Set Google Ads Goal"],
  },
  cpa: {
    text: "Your blended CPA is currently **$14.20** — down 8.4% from last month. Here's channel breakdown:",
    chart: {
      type: "bar", xKey: "platform", dataKey: "cpa", color: "#ef4444", label: "CPA by Platform ($)",
      data: [
        { platform: "PMax",     cpa: 9.2  },
        { platform: "Shopping", cpa: 10.6 },
        { platform: "Search",   cpa: 14.7 },
        { platform: "Meta",     cpa: 16.4 },
        { platform: "TikTok",   cpa: 18.2 },
        { platform: "LinkedIn", cpa: 54.2 },
        { platform: "Snapchat", cpa: 28.0 },
      ],
    },
    insights: [
      "PMax has the lowest CPA at $9.20 — your most efficient channel.",
      "LinkedIn CPA ($54.20) is very high but generates B2B leads — normal for the channel.",
      "TikTok CPA is improving month-over-month. Hold course for now.",
    ],
    actions: ["Set CPA Goals", "View Full Campaigns", "Pause High-CPA Ad Sets"],
  },
  seo: {
    text: "Your SEO is showing early recovery signals. Organic sessions are **45.6k/month** — up 9.4% MoM.",
    chart: {
      type: "line", xKey: "month", dataKey: "sessions", color: "#22c55e", label: "Organic Sessions (k)",
      data: [
        { month: "Jan", sessions: 30 },
        { month: "Feb", sessions: 33 },
        { month: "Mar", sessions: 37 },
        { month: "Apr", sessions: 41 },
        { month: "May", sessions: 45.6 },
      ],
    },
    insights: [
      "47 keywords in positions 5–12 are quick-win opportunities for internal links.",
      "Mobile CTR (2.1%) is significantly below desktop (4.8%) — check mobile UX.",
      "Top query: 'best products for [niche]' — expand into 3 related variants.",
    ],
    actions: ["View SEO Dashboard", "Open Quick-win Keywords", "Set Organic Goal"],
  },
};

function matchAnswer(q: string): Omit<Message, "id" | "role" | "timestamp"> {
  const lower = q.toLowerCase();
  // Campaign-level queries
  if (lower.includes("instagram") || lower.includes("insta") || lower.includes("ig")) return CANNED.instagram;
  if (lower.includes("facebook") || lower.includes("fb") || lower.includes("meta")) return CANNED.facebook;
  if (lower.includes("pause") || lower.includes("stop") || lower.includes("underperform") || lower.includes("cut")) return CANNED.pause;
  if (lower.includes("scale") || lower.includes("increase") || lower.includes("grow") || lower.includes("focus")) return CANNED.focus;
  if (lower.includes("campaign") || lower.includes("which") || lower.includes("concentrate")) return CANNED.campaigns;
  if (lower.includes("tiktok") || lower.includes("tok")) return CANNED.tiktok;
  if (lower.includes("google") || lower.includes("shopping") || lower.includes("pmax")) return CANNED.google;
  // Generic queries
  if (lower.includes("roas") || lower.includes("return")) return CANNED.roas;
  if (lower.includes("spend") || lower.includes("budget") || lower.includes("cost")) return CANNED.spend;
  if (lower.includes("cpa") || lower.includes("acquisition")) return CANNED.cpa;
  if (lower.includes("seo") || lower.includes("organic") || lower.includes("search console")) return CANNED.seo;
  return CANNED.default;
}

// ─── Action button → page route map ─────────────────────────────────────────
const ACTION_ROUTES: Record<string, string> = {
  // Campaigns / ads
  "View Campaign Intel":        "/campaigns",
  "Open Campaign Intel":        "/campaigns",
  "View All Campaigns":         "/ads",
  "View All 14 Campaigns":      "/ads",
  "View Full Campaign Table":    "/ads",
  "View Full Campaigns":        "/ads",
  "Pause Facebook Campaigns":   "/campaigns",
  "Pause High-CPA Ad Sets":     "/campaigns",
  "View TikTok Campaigns":      "/ads",
  "View Google Campaigns":      "/ads",
  // Budget
  "Open Budget Plan":           "/budget",
  "View Budget Pacing":         "/budget",
  "Open Budget Reallocation":   "/budget",
  "Rebalance Channels":         "/budget",
  "Move Budget to Instagram":   "/budget",
  // Platform comparison / meta
  "See Platform Comparison":    "/campaigns",
  "See Full Meta Analysis":     "/campaigns",
  "View Instagram vs Facebook": "/campaigns",
  "Open Instagram vs Facebook": "/campaigns",
  // Forecasts / goals / SEO / reports
  "Open Forecasts":             "/forecasts",
  "Set Google Ads Goal":        "/goals",
  "Set CPA Goals":              "/goals",
  "View SEO Dashboard":         "/seo",
  "Open Quick-win Keywords":    "/seo",
  "Set Organic Goal":           "/goals",
  "See 4-Week Action Plan":     "/reports",
};

// ─── Proactive insight cards ──────────────────────────────────────────────────
const PROACTIVE = [
  { icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", title: "Instagram > Facebook right now", body: "Instagram Feed is at 5.2× ROAS and growing. Facebook Feed is at 1.8× and declining. Move £3,000/month to Instagram — estimated +£9,000 additional revenue." },
  { icon: AlertCircle,  color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/30",         title: "4 campaigns wasting budget",    body: "Facebook Feed, Facebook Carousel, Snapchat Stories, Google Display — all under 1.8× ROAS and declining. Combined spend: £4,380/month. Pause all 4 now." },
  { icon: TrendingUp,   color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30",       title: "Google Shopping: push harder",  body: "Shopping is at 6.2× ROAS — your best campaign across all platforms. It's not yet budget-saturated. Increase by £800/month for est. +£4,960 revenue." },
  { icon: Zap,          color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",     title: "TikTok In-Feed is accelerating", body: "TikTok In-Feed grew from 2.8× to 3.6× ROAS in 4 weeks. CTR is 6.8% — your highest. Test a £500 budget increase and 2 new UGC creatives this week." },
];

// ─── Suggested prompts ────────────────────────────────────────────────────────
const PROMPTS = [
  "Which campaigns should I concentrate on?",
  "How is Instagram performing vs Facebook?",
  "Which campaigns should I pause now?",
  "Show me ROAS across all platforms",
  "What should I do with my Google Ads budget?",
  "How is TikTok performing?",
];

// ─── Components ───────────────────────────────────────────────────────────────
function MiniChart({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-3 rounded-lg bg-muted/40 p-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{chart.label}</p>
      <ResponsiveContainer width="100%" height={160}>
        {chart.type === "bar" ? (
          <BarChart data={chart.data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={chart.xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={36} />
            <Tooltip />
            <Bar dataKey={chart.dataKey} fill={chart.color} radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={chart.data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={chart.xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={36} />
            <Tooltip />
            <Line type="monotone" dataKey={chart.dataKey} stroke={chart.color} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ChatMessage({ msg, onAction }: { msg: Message; onAction?: (q: string) => void }) {
  const router = useRouter();
  const isAI = msg.role === "ai";

  function handleAction(label: string) {
    const route = ACTION_ROUTES[label];
    if (route) {
      router.push(route);
    } else {
      onAction?.(label);
    }
  }
  return (
    <div className={cn("flex gap-3", isAI ? "justify-start" : "justify-end")}>
      {isAI && (
        <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm", isAI ? "bg-card border border-border" : "bg-primary text-primary-foreground")}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

        {/* Chart */}
        {isAI && msg.chart && <MiniChart chart={msg.chart} />}

        {/* Insight bullets */}
        {isAI && msg.insights && (
          <ul className="mt-3 space-y-1.5">
            {msg.insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Action buttons */}
        {isAI && msg.actions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {msg.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAction(a)}
                className="flex items-center gap-1 text-xs font-medium text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
              >
                {a} <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <p className={cn("text-[10px] mt-2", isAI ? "text-muted-foreground" : "text-primary-foreground/70")}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {!isAI && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Recap header — derived from live CAMPAIGNS data ─────────────────────────
const _totalSpend   = CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
const _totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
const _blendedRoas  = _totalRevenue / _totalSpend;
const RECAP_METRICS = [
  { label: "ROAS",             value: `${_blendedRoas.toFixed(2)}×`,              change: +12.3, dir: "up"   },
  { label: "Revenue",          value: `£${(_totalRevenue/1000).toFixed(1)}k`,     change: +8.7,  dir: "up"   },
  { label: "Spend",            value: `£${(_totalSpend/1000).toFixed(1)}k`,       change: +5.1,  dir: "up"   },
  { label: "Campaigns to scale", value: `${CAMPAIGNS.filter(c=>c.health==="scale").length}`, change: +2, dir: "up"   },
  { label: "Campaigns to pause", value: `${CAMPAIGNS.filter(c=>c.health==="pause").length}`, change: 0,  dir: "down" },
];

function RecapHeader({ name, onPrompt }: { name?: string; onPrompt: (q: string) => void }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name?.split(" ")[0] ?? "";

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/10 p-5 mb-0">
      {/* Greeting */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            {greeting}{firstName ? `, ${firstName}` : ""}! Here&apos;s your recap for the last 7 days 👋
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Blended ROAS {_blendedRoas.toFixed(2)}× · Revenue £{(_totalRevenue/1000).toFixed(1)}k · {CAMPAIGNS.filter(c=>c.health==="scale").length} campaigns to scale · {CAMPAIGNS.filter(c=>c.health==="pause").length} to pause
          </p>
        </div>
      </div>

      {/* KPI pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {RECAP_METRICS.map((m) => (
          <div key={m.label} className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2",
            m.dir === "up"
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40"
              : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40"
          )}>
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className="text-sm font-bold text-foreground">{m.value}</span>
            <span className={cn("flex items-center gap-0.5 text-[11px] font-semibold", m.dir === "up" ? "text-emerald-600" : "text-red-500")}>
              {m.dir === "up" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
              {Math.abs(m.change)}%
            </span>
          </div>
        ))}
      </div>

      {/* Quick prompt chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground mr-1 self-center">Ask AI:</span>
        {["Which campaigns to focus on?", "Instagram vs Facebook?", "What should I pause now?", "Show ROAS by platform"].map((q) => (
          <button
            key={q}
            onClick={() => onPrompt(q)}
            className="flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 rounded-full px-3 py-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
          >
            {q} <ChevronRight className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AskPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi! I'm your AI Marketing Co-pilot. I've analysed your 14 active campaigns across Google Ads, Meta (Instagram + Facebook), TikTok, LinkedIn, and Snapchat.\n\nHere's the most important thing to know right now: Instagram is outperforming Facebook by 2.9× — and the gap is growing every week. You're spending £3,000/month on declining Facebook Feed campaigns that could be generating much more on Instagram.",
      insights: [
        "🚀 Instagram Feed: 5.2× ROAS (+18% in 4 weeks) — scale immediately.",
        "⚠️ Facebook Feed: 1.8× ROAS (−25% in 4 weeks) — pause now.",
        "✅ Google Shopping: 6.2× ROAS — your best campaign, increase budget.",
        "🗑️ 4 campaigns to pause: saving £4,380/month to reinvest.",
      ],
      actions: ["Which campaigns to focus on?", "Instagram vs Facebook?", "What to pause now?"],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const answer = matchAnswer(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", timestamp: new Date(), ...answer };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 900);
  };

  return (
    <>
      <PageHeader title="AI Command Centre" />
      <div className="flex flex-col h-[calc(100vh-8rem)] p-6 gap-4">

      {/* Databox-style recap header */}
      <RecapHeader name={session?.user?.name ?? undefined} onPrompt={sendMessage} />

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Proactive insights */}
        <div className="hidden lg:flex flex-col gap-3 w-72 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Proactive Insights
          </p>
          {PROACTIVE.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(`Tell me about: ${p.title}`)}
              className={cn("rounded-xl border border-border p-3 text-left hover:border-primary/40 transition-colors", p.bg)}
            >
              <div className="flex items-center gap-2 mb-1">
                <p.icon className={cn("h-3.5 w-3.5 shrink-0", p.color)} />
                <span className="text-xs font-semibold text-foreground">{p.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{p.body}</p>
            </button>
          ))}

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Try asking…
          </p>
          <div className="flex flex-col gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-2 transition-colors flex items-center justify-between group"
              >
                {p}
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border bg-card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} onAction={sendMessage} />)}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">Analysing your data…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            {/* Mobile quick prompts */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 lg:hidden">
              {PROMPTS.slice(0, 4).map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="shrink-0 text-xs text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about ROAS, CPA, budget, SEO, forecasts…"
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Powered by live data from Google Ads, Meta, TikTok, GA4 & Search Console
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
