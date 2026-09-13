"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DemoPageTemplate } from "@/components/dashboard/demo-page-template";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tab = "overview" | "demographics" | "personas" | "cohorts" | "behaviour";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",     label: "Overview" },
  { id: "demographics", label: "Demographics" },
  { id: "personas",     label: "Personas" },
  { id: "cohorts",      label: "Cohorts" },
  { id: "behaviour",    label: "Behaviour" },
];

const SEGMENTS = [
  { name: "Champions",        size: "18%", ltv: "£842", cac: "£24", churn: "2.1%",  color: "bg-emerald-500" },
  { name: "Loyal Customers",  size: "24%", ltv: "£521", cac: "£31", churn: "4.8%",  color: "bg-blue-500"    },
  { name: "Potential Loyal",  size: "21%", ltv: "£284", cac: "£38", churn: "9.2%",  color: "bg-violet-500"  },
  { name: "At Risk",          size: "14%", ltv: "£196", cac: "£52", churn: "22.4%", color: "bg-amber-500"   },
  { name: "Lost",             size: "23%", ltv: "£88",  cac: "£61", churn: "100%",  color: "bg-red-500"     },
];

const AGE_GROUPS = [
  { range: "18-24", pct: 12 },
  { range: "25-34", pct: 34 },
  { range: "35-44", pct: 28 },
  { range: "45-54", pct: 16 },
  { range: "55-64", pct: 7  },
  { range: "65+",   pct: 3  },
];

const TOP_COUNTRIES = [
  { country: "United Kingdom", users: "48,200", pct: 34 },
  { country: "United States",  users: "32,100", pct: 23 },
  { country: "Australia",      users: "18,400", pct: 13 },
  { country: "Canada",         users: "14,800", pct: 10 },
  { country: "Germany",        users: "11,200", pct: 8  },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users",      value: "142,800", change: +6.4  },
          { label: "Avg LTV",          value: "£284",    change: +4.1  },
          { label: "Avg CAC",          value: "£38",     change: -6.4  },
          { label: "Active Segments",  value: "5",       change: 0     },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold mb-1">{kpi.value}</p>
            {kpi.change !== 0 && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", kpi.change >= 0 ? "text-emerald-500" : "text-red-500")}>
                {kpi.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpi.change > 0 ? "+" : ""}{kpi.change}% vs last period
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Customer Segments (RFM)</h3>
          <div className="space-y-3">
            {SEGMENTS.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", s.color)} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>LTV {s.ltv}</span>
                    <span className="font-semibold text-foreground">{s.size}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", s.color)} style={{ width: s.size }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {AGE_GROUPS.map((a) => (
              <div key={a.range} className="flex items-center gap-3">
                <span className="text-xs font-medium w-12 shrink-0">{a.range}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${a.pct}%` }} />
                </div>
                <span className="text-xs font-bold w-8 text-right">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Top Countries</h3>
        <div className="space-y-3">
          {TOP_COUNTRIES.map((c) => (
            <div key={c.country}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{c.country}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{c.pct}%</span>
                  <span className="font-semibold w-16 text-right">{c.users}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AudiencePage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <PageHeader title="Audience" />
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

        {tab === "overview"     && <OverviewTab />}
        {tab === "demographics" && <DemoPageTemplate title="Demographics"  section="Audience" />}
        {tab === "personas"     && <DemoPageTemplate title="Personas"      section="Audience" />}
        {tab === "cohorts"      && <DemoPageTemplate title="Cohort Analysis" section="Audience" />}
        {tab === "behaviour"    && <DemoPageTemplate title="Behaviour"     section="Audience" />}
      </PageContent>
    </>
  );
}
