"use client";

import { useState } from "react";
import {
  TrendingDown, TrendingUp, ArrowDown, AlertTriangle,
  CheckCircle2, Zap, ChevronRight, Brain, Target,
  DollarSign, MousePointerClick, ShoppingCart, Mail,
  Gauge, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Causal chain data ─────────────────────────────────────────────────────────

const CAUSAL_CHAIN = [
  {
    id: "revenue",
    type: "impact" as const,
    icon: DollarSign,
    label: "Revenue decreased",
    detail: "–$42,800 vs last period (–11.4%)",
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
  },
  {
    id: "meta-spend",
    type: "cause" as const,
    icon: Zap,
    label: "Meta spend increased",
    detail: "+$8,400 with diminishing returns — ROAS dropped from 4.1× to 2.8×",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "google-conv",
    type: "cause" as const,
    icon: MousePointerClick,
    label: "Google conversions dropped",
    detail: "–23% conversion rate. Clicks held steady — something changed post-click",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "lp-speed",
    type: "cause" as const,
    icon: Gauge,
    label: "Landing page speed became slower",
    detail: "LCP increased from 1.8s → 3.4s. Mobile bounce rate up 18%",
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  {
    id: "organic",
    type: "positive" as const,
    icon: TrendingUp,
    label: "Organic traffic remained stable",
    detail: "+2.1% sessions from search — SEO is holding",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "email-ctr",
    type: "positive" as const,
    icon: Mail,
    label: "Email CTR increased",
    detail: "CTR up 34% — engaged audience, but not converting at checkout",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "checkout",
    type: "cause" as const,
    icon: ShoppingCart,
    label: "Customers abandoned checkout after payment page",
    detail: "74% drop-off at payment step — up from 48% last period",
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
  },
];

const RECOMMENDATIONS = [
  {
    action: "Reduce Google budget by 12%",
    why: "Clicks not converting — budget is wasted until landing page is fixed",
    impact: "+$4.2k saved",
    type: "immediate" as const,
    icon: DollarSign,
  },
  {
    action: "Increase Meta Advantage+",
    why: "Audience targeting is outperforming manual campaigns by 2.3×",
    impact: "+$6.8k revenue",
    type: "immediate" as const,
    icon: Zap,
  },
  {
    action: "Fix checkout payment page",
    why: "74% drop-off is the single biggest revenue leak — fix this first",
    impact: "+$18k revenue",
    type: "critical" as const,
    icon: ShoppingCart,
  },
];

const SUMMARY_KPIS = [
  { label: "Revenue",  value: "$334.2k", delta: -11.4, up: false },
  { label: "ROAS",    value: "3.1×",    delta: -18.4, up: false },
  { label: "Sessions",value: "142.8k",  delta: +2.1,  up: true  },
  { label: "CPA",     value: "$38.40",  delta: +22.3, up: false },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ExecutiveSummaryPage() {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const totalImpact = "+$29k";
  const recoveryPct = "+9%";

  return (
    <>
      <PageHeader
        title="Executive Summary"
        actions={
          <button className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Analysis
          </button>
        }
      />

      <PageContent>

        {/* ── Hero: Think like an AI marketing director ── */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision Intelligence</p>
              <h2 className="text-lg font-bold leading-tight">Think Like an AI Marketing Director</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Instead of showing you metrics, Nexoryx traces the <strong className="text-foreground">causal chain</strong> behind your results —
            what happened, why it happened, and exactly what to do next.
          </p>

          {/* Contrast: raw metrics vs intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Instead of showing metrics…</p>
              {SUMMARY_KPIS.map((k) => (
                <div key={k.label} className="flex items-center justify-between py-1 border-b border-muted/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{k.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold">{k.value}</span>
                    <span className={cn("text-xs", k.up ? "text-emerald-500" : "text-red-500")}>
                      {k.delta > 0 ? "+" : ""}{k.delta}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">Nexoryx tells you…</p>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">Revenue is down because of a checkout payment bug — not your ad spend.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">Fix the payment page + shift to Meta Advantage+ = recover $29k.</p>
              </div>
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-primary font-semibold">That is Decision Intelligence.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Causal chain ── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Causal Chain — What Actually Happened</h3>

          <div className="space-y-0">
            {CAUSAL_CHAIN.map((node, i) => {
              const Icon = node.icon;
              const isExpanded = expandedNode === node.id;
              const isFirst = i === 0;

              return (
                <div key={node.id} className="flex gap-4">
                  {/* connector line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                      node.type === "impact" ? "border-red-500 bg-red-500/10" :
                      node.type === "positive" ? "border-emerald-500 bg-emerald-500/10" :
                      "border-amber-500 bg-amber-500/10"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", node.color)} />
                    </div>
                    {i < CAUSAL_CHAIN.length - 1 && (
                      <div className="flex flex-col items-center py-1 gap-0.5">
                        <div className="w-px h-4 bg-border" />
                        <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                        <div className="w-px h-2 bg-border" />
                      </div>
                    )}
                  </div>

                  {/* card */}
                  <button
                    onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                    className={cn(
                      "flex-1 mb-2 text-left rounded-xl border p-3.5 transition-all cursor-pointer",
                      "hover:shadow-sm",
                      isFirst ? "border-red-500/40 bg-red-500/5" : node.bg,
                      isExpanded && "ring-2 ring-primary/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {node.type === "impact" && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            Impact
                          </span>
                        )}
                        {node.type === "positive" && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                            Positive
                          </span>
                        )}
                        {node.type === "cause" && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                            Root Cause
                          </span>
                        )}
                        <span className="text-sm font-semibold">{node.label}</span>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                    </div>
                    {isExpanded && (
                      <p className="mt-2 text-sm text-muted-foreground pl-0 border-t border-border/50 pt-2">
                        {node.detail}
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Recommendations</h3>

          <div className="space-y-3">
            {RECOMMENDATIONS.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-4 flex items-start gap-4",
                    rec.type === "critical"
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-primary/20 bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    rec.type === "critical" ? "bg-red-500/10" : "bg-primary/10"
                  )}>
                    <Icon className={cn("h-4 w-4", rec.type === "critical" ? "text-red-500" : "text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {rec.type === "critical" && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                          Critical
                        </span>
                      )}
                      {rec.type === "immediate" && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                          Do Now
                        </span>
                      )}
                      <p className="text-sm font-semibold">{rec.action}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.why}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald-500">{rec.impact}</p>
                    <p className="text-[10px] text-muted-foreground">estimated</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Outcome projection ── */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Expected Revenue Recovery</p>
              <p className="text-xs text-muted-foreground">If all 3 recommendations are actioned this week</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-500">{recoveryPct}</p>
            <p className="text-sm text-muted-foreground">{totalImpact} recovered</p>
          </div>
        </div>

      </PageContent>
    </>
  );
}
