"use client";

import { useState } from "react";
import {
  Instagram, Heart, Eye, Users, TrendingUp, TrendingDown,
  MessageCircle, Share2, Repeat2, Lightbulb, AlertTriangle,
  CheckCircle2, ArrowUpRight, Info, Zap, Play, ThumbsUp,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Demo data ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#e1306c",
    followers: 24600,
    followersDelta: +5.2,
    reach: 142000,
    reachDelta: +18.4,
    impressions: 380000,
    impressionsDelta: +12.1,
    engagements: 8940,
    engagementRate: 6.3,
    engagementDelta: +2.1,
    posts: 28,
    icon: Instagram,
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877f2",
    followers: 18200,
    followersDelta: -0.8,
    reach: 88000,
    reachDelta: -4.2,
    impressions: 210000,
    impressionsDelta: +1.4,
    engagements: 3120,
    engagementRate: 3.5,
    engagementDelta: -1.2,
    posts: 22,
    icon: ThumbsUp,
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#010101",
    followers: 9800,
    followersDelta: +34.6,
    reach: 520000,
    reachDelta: +87.2,
    impressions: 1240000,
    impressionsDelta: +112.4,
    engagements: 41800,
    engagementRate: 8.0,
    engagementDelta: +14.3,
    posts: 18,
    icon: Play,
  },
  {
    id: "twitter",
    name: "X / Twitter",
    color: "#000000",
    followers: 6400,
    followersDelta: +1.2,
    reach: 34000,
    reachDelta: +3.8,
    impressions: 98000,
    impressionsDelta: +5.6,
    engagements: 2100,
    engagementRate: 2.1,
    engagementDelta: -0.4,
    posts: 64,
    icon: Repeat2,
  },
];

const WEEKLY_REACH = [
  { week: "Wk 1", instagram: 18000, facebook: 11000, tiktok: 52000, twitter: 4200 },
  { week: "Wk 2", instagram: 21000, facebook: 10800, tiktok: 68000, twitter: 4600 },
  { week: "Wk 3", instagram: 19400, facebook: 12200, tiktok: 91000, twitter: 5100 },
  { week: "Wk 4", instagram: 23600, facebook: 11600, tiktok: 124000, twitter: 4800 },
  { week: "Wk 5", instagram: 28000, facebook: 10200, tiktok: 148000, twitter: 5400 },
  { week: "Wk 6", instagram: 32000, facebook: 11800, tiktok: 137000, twitter: 4900 },
];

const TOP_POSTS = [
  { platform: "TikTok",    content: "Behind-the-scenes product shoot 🎬",  views: 248000, likes: 19200, shares: 3400, date: "Apr 18" },
  { platform: "Instagram", content: "New collection reveal — Spring 2025 🌸", views: 42000, likes: 6100, shares: 840, date: "Apr 22" },
  { platform: "TikTok",    content: "Customer testimonial montage",          views: 196000, likes: 14800, shares: 2200, date: "Apr 12" },
  { platform: "Instagram", content: "Product styling tips carousel",          views: 38000, likes: 5400, shares: 620, date: "Apr 25" },
  { platform: "Facebook",  content: "Flash sale announcement",               views: 22000, likes: 1200, shares: 480, date: "Apr 20" },
];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  TikTok:    "#010101",
  Facebook:  "#1877f2",
  "X / Twitter": "#000000",
};

const PIE_PALETTE = ["#e1306c", "#6366f1", "#1877f2", "#64748b"];

// ── AI insights ───────────────────────────────────────────────────────────────

const AI_INSIGHTS = [
  {
    type: "success" as const,
    text: "TikTok is your fastest-growing channel (+34.6% followers, +87% reach). Increase posting frequency to 5× per week to capitalise on algorithmic momentum.",
  },
  {
    type: "warning" as const,
    text: "Facebook reach fell -4.2% this period. Organic reach continues to decline platform-wide — consider shifting Facebook budget toward paid promotion of top-performing posts.",
  },
  {
    type: "tip" as const,
    text: "Your Instagram engagement rate is 6.3% — above the 3–5% e-commerce benchmark. Replicate the format of your top carousel posts across more product categories.",
  },
  {
    type: "tip" as const,
    text: "Best posting times based on your engagement patterns: Instagram 6–8pm weekdays, TikTok 7–9pm weekends, Facebook Tue/Thu 12–2pm.",
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function InsightCard({ type, text }: { type: "warning" | "success" | "tip"; text: string }) {
  const styles = {
    warning: { bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900", text: "text-amber-700 dark:text-amber-400", icon: AlertTriangle },
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
    tip:     { bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900", text: "text-blue-700 dark:text-blue-400", icon: Lightbulb },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={cn("rounded-lg border p-3 flex gap-2.5", styles.bg)}>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", styles.text)} />
      <p className={cn("text-sm leading-relaxed", styles.text)}>{text}</p>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", delta >= 0 ? "text-emerald-600" : "text-red-500")}>
      {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {delta >= 0 ? "+" : ""}{delta}%
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#e1306c", "#6366f1", "#1877f2", "#64748b"];

export default function MediaPage() {
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const displayPlatforms = activePlatform
    ? PLATFORMS.filter((p) => p.id === activePlatform)
    : PLATFORMS;

  const totalReach = PLATFORMS.reduce((s, p) => s + p.reach, 0);
  const totalFollowers = PLATFORMS.reduce((s, p) => s + p.followers, 0);
  const totalEngagements = PLATFORMS.reduce((s, p) => s + p.engagements, 0);
  const blendedEngRate = (PLATFORMS.reduce((s, p) => s + p.engagementRate, 0) / PLATFORMS.length);

  const pieData = PLATFORMS.map((p) => ({ name: p.name, value: p.reach }));

  return (
    <>
      <PageHeader title="Social Media Insights" />
      <PageContent>
      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Followers",  value: formatCompact(totalFollowers),    icon: Users,       sub: "across all platforms" },
          { label: "Total Reach",      value: formatCompact(totalReach),         icon: Eye,         sub: "last 30 days" },
          { label: "Total Engagements",value: formatCompact(totalEngagements),   icon: Heart,       sub: "likes, comments, shares" },
          { label: "Avg Eng. Rate",    value: `${blendedEngRate.toFixed(1)}%`,   icon: TrendingUp,  sub: "blended across platforms" },
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
                <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Insights */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          AI Social Media Recommendations
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {AI_INSIGHTS.map((ins, i) => (
            <InsightCard key={i} type={ins.type} text={ins.text} />
          ))}
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActivePlatform(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
            activePlatform === null ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"
          )}
        >
          All Platforms
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(activePlatform === p.id ? null : p.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
              activePlatform === p.id ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Platform cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayPlatforms.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg p-1.5 shrink-0" style={{ backgroundColor: p.color + "20" }}>
                    <Icon className="h-4 w-4" style={{ color: p.color }} />
                  </div>
                  <span className="font-semibold text-sm">{p.name}</span>
                </div>
                <DeltaBadge delta={p.followersDelta} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Followers",   value: formatCompact(p.followers),    delta: p.followersDelta },
                  { label: "Reach",       value: formatCompact(p.reach),        delta: p.reachDelta },
                  { label: "Impressions", value: formatCompact(p.impressions),  delta: p.impressionsDelta },
                  { label: "Eng. Rate",   value: `${p.engagementRate}%`,        delta: p.engagementDelta },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className="text-sm font-bold mt-0.5">{stat.value}</p>
                    <DeltaBadge delta={stat.delta} />
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                {p.posts} posts this period
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Reach trend */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold mb-4">Weekly Reach by Platform</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={WEEKLY_REACH}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} />
              <Tooltip
                contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(v: number, name: string) => [formatCompact(v), name]}
              />
              <Area type="monotone" dataKey="tiktok"    name="TikTok"    stackId="1" stroke="#010101" fill="#01010120" strokeWidth={2} />
              <Area type="monotone" dataKey="instagram" name="Instagram"  stackId="2" stroke="#e1306c" fill="#e1306c20" strokeWidth={2} />
              <Area type="monotone" dataKey="facebook"  name="Facebook"   stackId="3" stroke="#1877f2" fill="#1877f220" strokeWidth={2} />
              <Area type="monotone" dataKey="twitter"   name="X / Twitter" stackId="4" stroke="#64748b" fill="#64748b20" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Reach pie */}
        <div className="rounded-xl border bg-card p-5 flex flex-col">
          <p className="text-sm font-semibold mb-4">Reach Share</p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(v: number, name: string) => [formatCompact(v), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {PLATFORMS.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_PALETTE[i] }} />
                  {p.name}
                </span>
                <span className="text-muted-foreground">{((p.reach / totalReach) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top posts */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b">
          <p className="text-sm font-semibold">Top Performing Posts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Platform</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Content</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Views</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Likes</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Shares</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {TOP_POSTS.map((post, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                      style={{ backgroundColor: PLATFORM_COLORS[post.platform] ?? "#6366f1" }}
                    >
                      {post.platform}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm max-w-[240px] truncate">{post.content}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{formatCompact(post.views)}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">
                    <span className="flex items-center justify-end gap-1">
                      <Heart className="h-3 w-3 text-red-400" />
                      {formatCompact(post.likes)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-2.5 tabular-nums">
                    <span className="flex items-center justify-end gap-1">
                      <Share2 className="h-3 w-3 text-blue-400" />
                      {formatCompact(post.shares)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-2.5 text-muted-foreground">{post.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </PageContent>
    </>
  );
}
