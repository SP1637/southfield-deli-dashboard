"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Zap, DollarSign, BarChart2, Search, Paintbrush, Users, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

type Tab = "hub" | "budget" | "campaigns" | "creative" | "audience" | "seo";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "hub",       label: "Hub",       icon: Zap },
  { id: "budget",    label: "Budget",    icon: DollarSign },
  { id: "campaigns", label: "Campaigns", icon: BarChart2 },
  { id: "creative",  label: "Creative",  icon: Paintbrush },
  { id: "audience",  label: "Audience",  icon: Users },
  { id: "seo",       label: "SEO",       icon: Search },
];

const OPPORTUNITIES = [
  {
    category: "Budget",
    icon: DollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    impact: "£9,200",
    items: [
      { title: "Shift £2,400 from Google to Meta",      impact: "+£6,800", confidence: 84 },
      { title: "Pause underperforming Display ads",      impact: "+£2,400", confidence: 91 },
    ],
  },
  {
    category: "Campaigns",
    icon: BarChart2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    impact: "£6,400",
    items: [
      { title: "Scale Meta Campaign A by 30%",           impact: "+£4,200", confidence: 78 },
      { title: "Reduce Google Campaign B bids 15%",      impact: "+£2,200", confidence: 82 },
    ],
  },
  {
    category: "SEO",
    icon: Search,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    impact: "£4,100",
    items: [
      { title: "Publish marketing analytics pillar page", impact: "+£2,100", confidence: 65 },
      { title: "Fix 14 broken internal links",            impact: "+£2,000", confidence: 88 },
    ],
  },
  {
    category: "Creative",
    icon: Paintbrush,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    impact: "£3,600",
    items: [
      { title: "Test UGC creative format on Meta",        impact: "+£2,400", confidence: 71 },
      { title: "Refresh Google Search ad copy",           impact: "+£1,200", confidence: 76 },
    ],
  },
  {
    category: "Audience",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    impact: "£1,500",
    items: [
      { title: "Build lookalike from top 20% customers",  impact: "+£1,500", confidence: 69 },
    ],
  },
];

export default function OptimizationHubPage() {
  const [tab, setTab] = useState<Tab>("hub");

  return (
    <>
      <PageHeader title="Optimization Hub" />

      <PageContent>
        <div className="flex gap-1 border-b overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  tab === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "hub" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Potential Monthly Impact</p>
                  <p className="text-4xl font-bold">£24,800</p>
                  <p className="text-sm text-muted-foreground">
                    across {OPPORTUNITIES.reduce((a, o) => a + o.items.length, 0)} identified opportunities
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                Review All <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {OPPORTUNITIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.category} className={cn("rounded-xl border p-5", cat.border)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", cat.bg)}>
                          <Icon className={cn("h-4 w-4", cat.color)} />
                        </div>
                        <span className="text-sm font-semibold">{cat.category} Opportunities</span>
                      </div>
                      <span className={cn("text-base font-bold", cat.color)}>{cat.impact}</span>
                    </div>
                    <div className="space-y-2">
                      {cat.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-background/50 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-bold text-emerald-500">{item.impact}</span>
                            <span className="text-xs text-muted-foreground">{item.confidence}%</span>
                            <button className="text-xs text-primary hover:underline">Apply</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab !== "hub" && (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium capitalize">{tab} optimizations</p>
              <p className="text-xs">Connect your {tab} data to unlock AI-powered suggestions.</p>
              <button className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                Connect Data
              </button>
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
