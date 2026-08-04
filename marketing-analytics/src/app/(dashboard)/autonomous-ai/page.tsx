"use client";

import { useState } from "react";
import {
  Bot, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Zap, Mail, Bell, Clock, Calendar, ChevronRight, Sparkles,
  DollarSign, Users, Search, MousePointerClick, ArrowRight,
  Play, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── The Monday Brief data (from vision doc) ────────────────────────────────────
const HEALTH_SCORE = 92;

const BRIEF_METRICS = [
  { label: "Revenue",     value: "+12%", up: true,  icon: DollarSign },
  { label: "Leads",       value: "+18%", up: true,  icon: Users },
  { label: "SEO",         value: "+9%",  up: true,  icon: Search },
  { label: "Paid Search", value: "–4%",  up: false, icon: MousePointerClick },
];

const AI_FINDINGS = [
  { text: "Campaign B wasting £640/week",          type: "risk"   as const },
  { text: "Email open rate highest in 6 months",   type: "good"   as const },
  { text: "Competitor launched new offer",          type: "risk"   as const },
  { text: "Landing Page C conversion dropped",      type: "risk"   as const },
];

const TOP_RECOMMENDATION = {
  action: "Move £2,000 budget from Google to Meta.",
  expectedRevenue: "+8%",
};

// ── What Autonomous AI does ────────────────────────────────────────────────────
const CAPABILITIES = [
  { icon: Bell,     label: "Monday Morning Brief",  desc: "Health score, metrics, AI findings — delivered before 8am." },
  { icon: AlertTriangle, label: "Real-time Alerts", desc: "Anomaly detected? You're notified within minutes, not days." },
  { icon: Zap,      label: "Auto-Recommendations",  desc: "AI generates specific actions. You approve. It executes." },
  { icon: Mail,     label: "Digest Reports",        desc: "Weekly and monthly summaries delivered to your inbox." },
  { icon: Bot,      label: "Campaign Monitoring",   desc: "AI watches every campaign 24/7. Pauses wasters automatically." },
  { icon: Calendar, label: "Scheduled Insights",    desc: "Pre-meeting briefs, end-of-week summaries, quarterly reviews." },
];

// ── HealthRing SVG ─────────────────────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="60" y="55" textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 700, fill: "hsl(var(--foreground))" }}>
        {score}
      </text>
      <text x="60" y="72" textAnchor="middle" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}>
        /100
      </text>
    </svg>
  );
}

export default function AutonomousAiPage() {
  const [briefOpen, setBriefOpen] = useState(false);

  return (
    <>
      <PageHeader title="Autonomous AI" />
      <PageContent>

        {/* ── Hero ── */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Section 10</p>
              <h2 className="text-xl font-bold">Autonomous AI</h2>
            </div>
            <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-widest">The Future</span>
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold">This is where the future is.</p>
            <p className="text-base text-muted-foreground">Imagine Monday morning.</p>
            <p className="text-base text-muted-foreground">Instead of opening dashboards…</p>
            <p className="text-base font-semibold text-primary">Users receive:</p>
          </div>

          <button
            onClick={() => setBriefOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4" />
            See Monday Morning Brief
          </button>
        </div>

        {/* ── Monday Morning Brief card ── */}
        <div className={cn(
          "rounded-2xl border overflow-hidden transition-all duration-500",
          briefOpen ? "border-primary/30 shadow-lg" : "border-dashed border-muted-foreground/30 opacity-60 hover:opacity-80 cursor-pointer"
        )}
          onClick={() => !briefOpen && setBriefOpen(true)}
        >
          {/* Brief header */}
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Marketing Executive Brief</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Monday 04 Aug · 07:58 AM
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Health + Metrics */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <HealthRing score={HEALTH_SCORE} />
                <p className="text-xs text-muted-foreground font-medium">Overall Health</p>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 min-w-[200px]">
                {BRIEF_METRICS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className={cn(
                      "rounded-xl border p-3 space-y-1",
                      m.up ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                    )}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <p className="text-[11px] text-muted-foreground font-medium">{m.label}</p>
                      </div>
                      <p className={cn("text-xl font-bold", m.up ? "text-emerald-500" : "text-red-500")}>
                        {m.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Findings */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI Findings</p>
              <div className="space-y-2">
                {AI_FINDINGS.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {f.type === "good"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    }
                    <p className={cn("text-sm", f.type === "good" ? "text-emerald-500 font-medium" : "text-foreground")}>
                      {f.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top recommendation */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Top Recommendation</p>
              <p className="text-sm font-semibold">{TOP_RECOMMENDATION.action}</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Expected revenue increase</span>
                <span className="text-sm font-bold text-emerald-500">{TOP_RECOMMENDATION.expectedRevenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── "No one else gives this" statement ── */}
        <div className="text-center py-2">
          <p className="text-base font-bold text-foreground">No one else gives this.</p>
          <p className="text-sm text-muted-foreground mt-1">Your competitors are still opening dashboards on Monday morning.</p>
        </div>

        {/* ── Capabilities grid ── */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">What Autonomous AI does</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="rounded-xl border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Setup CTA ── */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold">Configure your brief</p>
            <p className="text-xs text-muted-foreground">Choose delivery time, recipients, and which metrics to include.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
              <Settings className="h-4 w-4" />
              Configure
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Enable Autonomous AI
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </PageContent>
    </>
  );
}
