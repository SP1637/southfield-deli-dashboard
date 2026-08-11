"use client";

import Link from "next/link";
import {
  Lightbulb, Zap, AlertTriangle, Brain, GitBranch,
  Sliders, Wand2, Search, Paintbrush, Users,
  ArrowRight, TrendingUp, TrendingDown, Cpu,
  CheckCircle2, Clock, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const OPPORTUNITIES = [
  {
    type: "opportunity" as const,
    title: "Increase TikTok spend",
    detail: "Audience overlap is low — untapped reach available at current CPMs",
    metric: "ROAS +18%",
    confidence: 91,
    effort: "Low",
    icon: Zap,
  },
  {
    type: "opportunity" as const,
    title: "Re-activate lapsed email segment",
    detail: "12,400 subscribers haven't opened in 60 days — win-back sequence estimated to recover 8% LTV",
    metric: "+£14.2k revenue",
    confidence: 84,
    effort: "Low",
    icon: Zap,
  },
  {
    type: "opportunity" as const,
    title: "Shift Google budget to branded terms",
    detail: "Non-branded CPC increased 34% while branded CPC held steady — reallocate £3.2k",
    metric: "CPA –22%",
    confidence: 88,
    effort: "Medium",
    icon: Zap,
  },
];

const RISKS = [
  {
    type: "risk" as const,
    title: "Meta ROAS declining — 3rd week in a row",
    detail: "Creative fatigue detected. Top 3 ads frequency >8. Audience needs refresh.",
    metric: "ROAS –0.4×/week",
    confidence: 94,
    urgency: "High",
    icon: AlertTriangle,
  },
  {
    type: "risk" as const,
    title: "Checkout conversion rate fell 12%",
    detail: "Mobile payment page load time increased from 2.1s to 3.8s after last deploy",
    metric: "–£8.4k/week",
    confidence: 97,
    urgency: "Critical",
    icon: AlertTriangle,
  },
];

const MODULES = [
  { label: "Recommendations",     href: "/recommendations",    icon: Lightbulb,   count: "8 actions",     color: "text-primary" },
  { label: "Opportunities",       href: "/opportunities",      icon: Zap,         count: "3 found",       color: "text-emerald-500" },
  { label: "Risks",               href: "/risks",              icon: AlertTriangle,count: "2 active",     color: "text-red-500" },
  { label: "Predictions",         href: "/predictions",        icon: Brain,       count: "Next 30 days",  color: "text-violet-500" },
  { label: "Root Cause Analysis", href: "/root-cause",         icon: GitBranch,   count: "1 open case",   color: "text-amber-500" },
  { label: "Budget Optimizer",    href: "/budget-optimizer",   icon: Sliders,     count: "+£18k potential",color: "text-emerald-500" },
  { label: "Campaign Optimizer",  href: "/campaigns",          icon: Wand2,       count: "4 campaigns",   color: "text-primary" },
  { label: "SEO Optimizer",       href: "/seo-optimizer",      icon: Search,      count: "62 keywords",   color: "text-blue-500" },
  { label: "Creative Optimizer",  href: "/creative-optimizer", icon: Paintbrush,  count: "12 creatives",  color: "text-pink-500" },
  { label: "Audience Optimizer",  href: "/audience-optimizer", icon: Users,       count: "5 segments",    color: "text-violet-500" },
];

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", value >= 90 ? "bg-emerald-500" : value >= 75 ? "bg-amber-500" : "bg-red-500")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right">{value}%</span>
    </div>
  );
}

export default function AiDecisionCenterPage() {
  return (
    <>
      <PageHeader title="AI Decision Center" />
      <PageContent>

        {/* ── Hero ── */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Section 6</p>
              <h2 className="text-xl font-bold">AI Decision Center</h2>
            </div>
            <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-widest">Core Product</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            The AI thinks like a marketing director. It surfaces what matters, explains why, and tells you exactly what to do —
            with a confidence score on every recommendation.
          </p>

          {/* Example card */}
          <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Opportunity</p>
                <p className="text-sm font-semibold">Increase TikTok spend</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="text-sm font-bold text-emerald-500">ROAS +18%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm font-bold">91%</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* ── Active Opportunities ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Active Opportunities</h3>
            <Link href="/opportunities" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {OPPORTUNITIES.map((o, i) => (
              <div key={i} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <o.icon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Opportunity</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Effort: {o.effort}</span>
                    </div>
                    <p className="text-sm font-semibold">{o.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.detail}</p>
                    <div className="mt-2">
                      <ConfidenceBar value={o.confidence} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <p className="text-sm font-bold text-emerald-500">{o.metric}</p>
                    <p className="text-[10px] text-muted-foreground">expected</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Risks ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Active Risks</h3>
            <Link href="/risks" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {RISKS.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-4",
                  r.urgency === "Critical"
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    r.urgency === "Critical" ? "bg-red-500/10" : "bg-amber-500/10"
                  )}>
                    <r.icon className={cn("h-4 w-4", r.urgency === "Critical" ? "text-red-500" : "text-amber-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest text-white px-1.5 py-0.5 rounded-full",
                        r.urgency === "Critical" ? "bg-red-500" : "bg-amber-500"
                      )}>{r.urgency}</span>
                    </div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
                    <div className="mt-2">
                      <ConfidenceBar value={r.confidence} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <p className={cn("text-sm font-bold", r.urgency === "Critical" ? "text-red-500" : "text-amber-500")}>{r.metric}</p>
                    <p className="text-[10px] text-muted-foreground">impact</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Module grid ── */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">All AI Modules</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.label}
                  href={m.href}
                  className="group rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn("h-4 w-4", m.color)} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-tight">{m.label}</p>
                  <p className="text-sm font-bold">{m.count}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Quick prediction preview ── */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-semibold">30-Day Revenue Prediction</p>
            </div>
            <Link href="/predictions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Full forecast <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Conservative", value: "£298k", delta: "+4.2%", up: true },
              { label: "Expected",     value: "£334k", delta: "+12.4%", up: true },
              { label: "Optimistic",   value: "£371k", delta: "+21.8%", up: true },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-lg border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground font-medium mb-1">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
                <span className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-0.5 mt-0.5">
                  <TrendingUp className="h-3 w-3" />{s.delta}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-3">Confidence interval based on last 90 days of historical data + current campaign trajectory</p>
        </div>

      </PageContent>
    </>
  );
}
