"use client";

import { useState } from "react";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Zap,
  ArrowRight, CheckCircle2, RefreshCw, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const HEALTH_SCORE = 84;

const KPIS = [
  { label: "Revenue",     value: "£184K", delta: +14.2, up: true },
  { label: "ROAS",        value: "4.82×", delta: +8.1,  up: true },
  { label: "CAC",         value: "£38",   delta: -6.4,  up: true },
  { label: "Conversions", value: "3,241",      delta: +11.8, up: true },
];

const WHAT_CHANGED = [
  { text: "Meta revenue increased 21%", positive: true },
  { text: "Google CPA increased 14%", positive: false },
  { text: "Organic conversions increased 8%", positive: true },
];

const WHY = "Google Search CPC increased 17% while conversion rate fell 5%. Meta Advantage+ audiences are outperforming manual campaigns by 2.3×.";

const OPPORTUNITIES = [
  { rank: 1, text: "Scale Meta Campaign A — ROAS 6.2×, room to grow", impact: "+£4,200" },
  { rank: 2, text: "Reduce Search Campaign B — CPA 89% above target",      impact: "+£2,100" },
  { rank: 3, text: "Improve Product Page C — 74% drop-off at checkout",    impact: "+£2,100" },
];

const RISKS = [
  { text: "Google Campaign B CPA exceeds target by 89%", severity: "high" as const },
  { text: "Email open rate declined 12% over 3 weeks",   severity: "medium" as const },
];

const NEXT_ACTION = {
  title: "Reallocate £2,400 advertising budget",
  from: "Google Search Campaign B",
  to: "Meta Campaign A",
  impact: "+£6,800 estimated revenue",
  confidence: 84,
};

type Tab = "brief" | "opportunities" | "risks";

export default function ExecutiveBriefPage() {
  const [tab, setTab] = useState<Tab>("brief");

  return (
    <>
      <PageHeader
        title="Executive Brief"
        actions={
          <button className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      <PageContent>
        <div className="flex gap-1 border-b">
          {(["brief", "opportunities", "risks"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "brief" ? "Morning Brief" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "brief" && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marketing Health</p>
                    <h2 className="text-2xl font-bold">{HEALTH_SCORE}<span className="text-base text-muted-foreground font-normal">/100</span></h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {KPIS.map((k) => (
                    <div key={k.label} className="text-center">
                      <p className="text-lg font-bold">{k.value}</p>
                      <p className="text-[11px] text-muted-foreground">{k.label}</p>
                      <p className={cn("text-xs font-medium", k.up ? "text-emerald-500" : "text-red-500")}>
                        {k.delta > 0 ? "+" : ""}{k.delta}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">What Changed</p>
                <div className="space-y-2">
                  {WHAT_CHANGED.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {item.positive
                        ? <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        : <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <p className="text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Why</p>
                <p className="text-sm leading-relaxed">{WHY}</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Opportunities</p>
                <span className="text-sm font-bold text-emerald-500">£8,400 est. monthly</span>
              </div>
              <div className="space-y-2">
                {OPPORTUNITIES.map((o) => (
                  <div key={o.rank} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">{o.rank}</span>
                    <p className="text-sm flex-1">{o.text}</p>
                    <span className="text-sm font-bold text-emerald-500 shrink-0">{o.impact}</span>
                  </div>
                ))}
              </div>
            </div>

            {RISKS.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Risks — {RISKS.length} requiring attention</p>
                <div className="space-y-2">
                  {RISKS.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", r.severity === "high" ? "text-red-500" : "text-amber-500")} />
                      <p className="text-sm">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Next Best Action</p>
                    <p className="text-base font-bold">{NEXT_ACTION.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{NEXT_ACTION.from}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span>{NEXT_ACTION.to}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-500">{NEXT_ACTION.impact}</p>
                  <p className="text-xs text-muted-foreground">{NEXT_ACTION.confidence}% confidence</p>
                  <button className="mt-2 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    Review Decision <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "opportunities" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Total identified opportunity</p>
              <p className="text-2xl font-bold text-emerald-500">£8,400<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            </div>
            {OPPORTUNITIES.map((o) => (
              <div key={o.rank} className="rounded-xl border bg-card p-5 flex items-center gap-4">
                <span className="text-lg font-bold w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">{o.rank}</span>
                <p className="text-sm flex-1">{o.text}</p>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-emerald-500">{o.impact}</p>
                  <button className="text-xs text-primary hover:underline mt-0.5">Investigate →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "risks" && (
          <div className="space-y-4">
            {RISKS.map((r, i) => (
              <div key={i} className={cn(
                "rounded-xl border p-5 flex items-start gap-3",
                r.severity === "high" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"
              )}>
                <AlertTriangle className={cn("h-5 w-5 mt-0.5 shrink-0", r.severity === "high" ? "text-red-500" : "text-amber-500")} />
                <div className="flex-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white",
                    r.severity === "high" ? "bg-red-500" : "bg-amber-500"
                  )}>{r.severity}</span>
                  <p className="text-sm mt-1">{r.text}</p>
                </div>
                <button className="text-xs text-primary hover:underline shrink-0">Investigate →</button>
              </div>
            ))}
            {RISKS.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-sm font-medium">No risks detected — all systems healthy.</p>
              </div>
            )}
          </div>
        )}
      </PageContent>
    </>
  );
}
