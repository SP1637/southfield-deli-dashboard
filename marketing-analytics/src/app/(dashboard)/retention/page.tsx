"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DemoPageTemplate } from "@/components/dashboard/demo-page-template";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tab = "overview" | "churn" | "cohorts" | "lifecycle" | "winback";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview" },
  { id: "churn",     label: "Churn" },
  { id: "cohorts",   label: "Cohorts" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "winback",   label: "Win-back" },
];

const RETENTION_WEEKS = [
  { week: "Wk 1",  pct: 100 },
  { week: "Wk 2",  pct: 62  },
  { week: "Wk 4",  pct: 44  },
  { week: "Wk 8",  pct: 34  },
  { week: "Wk 12", pct: 28  },
  { week: "Wk 16", pct: 24  },
  { week: "Wk 20", pct: 21  },
  { week: "Wk 24", pct: 19  },
];

const CHURN_REASONS = [
  { reason: "Price too high",          pct: 34, color: "bg-red-500"     },
  { reason: "Found a better product",  pct: 28, color: "bg-amber-500"   },
  { reason: "No longer need it",       pct: 18, color: "bg-blue-500"    },
  { reason: "Poor customer support",   pct: 12, color: "bg-violet-500"  },
  { reason: "Other",                   pct: 8,  color: "bg-muted-foreground/30" },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Retention Rate",  value: "81%",   change: +2.4  },
          { label: "Monthly Churn",   value: "4.2%",  change: -0.8  },
          { label: "Avg LTV",         value: "£284",  change: +4.1  },
          { label: "Reactivated",     value: "184",   change: +18.2 },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold mb-1">{kpi.value}</p>
            <div className={cn("flex items-center gap-1 text-xs font-medium", kpi.change >= 0 ? "text-emerald-500" : "text-red-500")}>
              {kpi.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {kpi.change > 0 ? "+" : ""}{kpi.change}% vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Retention Curve</h3>
          <div className="flex items-end gap-2 h-32">
            {RETENTION_WEEKS.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-bold">{w.pct}%</span>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${(w.pct / 100) * 100}%` }}
                />
                <span className="text-[9px] text-muted-foreground">{w.week}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Top Churn Reasons</h3>
          <div className="space-y-3">
            {CHURN_REASONS.map((r) => (
              <div key={r.reason}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-xs">{r.reason}</span>
                  <span className="font-bold text-xs">{r.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">At-Risk Segments</h3>
        <div className="space-y-3">
          {[
            { segment: "Inactive 30-60 days",   users: "2,841", risk: "Medium", action: "Re-engagement email"     },
            { segment: "Declining purchase freq", users: "1,204", risk: "High",   action: "Loyalty offer"          },
            { segment: "Single purchase only",   users: "4,182", risk: "Medium", action: "Second purchase campaign" },
            { segment: "Support escalation",     users: "312",   risk: "Critical", action: "Proactive outreach"    },
          ].map((row) => (
            <div key={row.segment} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{row.segment}</p>
                <p className="text-xs text-muted-foreground">{row.users} users</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  row.risk === "Critical" ? "bg-red-500/10 text-red-500" :
                  row.risk === "High"     ? "bg-amber-500/10 text-amber-500" :
                                           "bg-blue-500/10 text-blue-500"
                )}>{row.risk}</span>
                <p className="text-xs text-muted-foreground mt-1">{row.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RetentionPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <PageHeader title="Retention" />
      <PageContent>
        <div className="flex gap-1 border-b overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview"  && <OverviewTab />}
        {tab === "churn"     && <DemoPageTemplate title="Churn Analysis"   section="Retention" />}
        {tab === "cohorts"   && <DemoPageTemplate title="Cohort Analysis"  section="Retention" />}
        {tab === "lifecycle" && <DemoPageTemplate title="Lifecycle"        section="Retention" />}
        {tab === "winback"   && <DemoPageTemplate title="Win-back"         section="Retention" />}
      </PageContent>
    </>
  );
}
