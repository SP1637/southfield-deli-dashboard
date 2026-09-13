"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
  Zap, AlertTriangle, TrendingUp, CheckCircle2,
  ArrowRight, Brain, BarChart2,
} from "lucide-react";

type Status = "recommended" | "in-progress" | "approved" | "completed";

interface Decision {
  id: string;
  title: string;
  type: "opportunity" | "risk" | "optimisation";
  finding: string;
  rootCause: string;
  recommendation: string;
  estimatedImpact: string;
  confidence: number;
  sources: string[];
  status: Status;
  priority: "critical" | "high" | "medium";
}

const DECISIONS: Decision[] = [
  {
    id: "d1",
    title: "Reallocate £2,400 from Google to Meta",
    type: "opportunity",
    finding: "Meta ROAS is 6.2× vs Google ROAS of 2.9×",
    rootCause: "Google Search CPC increased 17% while CVR fell 5%. Meta Advantage+ audiences performing 2.3× better.",
    recommendation: "Shift £2,400 weekly budget from Google Search Campaign B to Meta Campaign A.",
    estimatedImpact: "+£6,800 revenue",
    confidence: 84,
    sources: ["Google Ads", "Meta Ads", "GA4"],
    status: "recommended",
    priority: "high",
  },
  {
    id: "d2",
    title: "Fix checkout payment page drop-off",
    type: "risk",
    finding: "74% of users abandon at the payment step — up from 48% last period",
    rootCause: "Payment provider timeout increased from 2s to 8s on mobile. Mobile users are 68% of checkout traffic.",
    recommendation: "Investigate payment provider latency. Set SLA target under 3s.",
    estimatedImpact: "+£18,000 revenue recovery",
    confidence: 91,
    sources: ["GA4", "Shopify"],
    status: "in-progress",
    priority: "critical",
  },
  {
    id: "d3",
    title: "Scale Meta Campaign A budget +30%",
    type: "optimisation",
    finding: "Campaign A ROAS has held at 6.2× for 3 weeks with spend under £8K",
    rootCause: "Audience saturation not yet reached. Frequency is 1.4 — well below the 3× fatigue threshold.",
    recommendation: "Increase Campaign A daily budget from £280 to £365 for the next 14 days.",
    estimatedImpact: "+£4,200 revenue",
    confidence: 78,
    sources: ["Meta Ads"],
    status: "recommended",
    priority: "high",
  },
  {
    id: "d4",
    title: "Reduce Email send frequency",
    type: "risk",
    finding: "Email open rate fell from 28% to 16% over the past 3 weeks",
    rootCause: "Send frequency increased from 2x/week to 5x/week in September. List fatigue is building.",
    recommendation: "Reduce sends to 2x/week. Segment active vs inactive subscribers.",
    estimatedImpact: "Prevent 12% list churn",
    confidence: 72,
    sources: ["Email"],
    status: "recommended",
    priority: "medium",
  },
  {
    id: "d5",
    title: "Launch SEO content cluster for marketing analytics",
    type: "opportunity",
    finding: "Keyword 'marketing analytics platform' has 8,100 searches/mo — no content exists for it",
    rootCause: "Competitors rank #1-3 with DA 40-55. Our DA is 61 — we have domain authority advantage.",
    recommendation: "Publish pillar page + 5 supporting articles over 6 weeks.",
    estimatedImpact: "+£2,100 organic revenue/mo",
    confidence: 65,
    sources: ["SEO", "GA4"],
    status: "approved",
    priority: "medium",
  },
];

const STATUS_TABS: { id: Status; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "in-progress", label: "In Progress" },
  { id: "approved",    label: "Approved" },
  { id: "completed",   label: "Completed" },
];

const LIFECYCLE = ["Detected", "Investigated", "Recommended", "Reviewed", "Approved", "Executed", "Measured"];

function TypeIcon({ type }: { type: Decision["type"] }) {
  if (type === "risk") return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (type === "optimisation") return <BarChart2 className="h-4 w-4 text-blue-500" />;
  return <Zap className="h-4 w-4 text-emerald-500" />;
}

export default function DecisionsPage() {
  const [activeStatus, setActiveStatus] = useState<Status>("recommended");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = DECISIONS.filter((d) => d.status === activeStatus);

  return (
    <>
      <PageHeader
        title="Decisions"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600">£31,100 identified</span>
            </div>
          </div>
        }
      />

      <PageContent>
        {/* Lifecycle */}
        <div className="rounded-xl border bg-card px-4 py-3">
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            {LIFECYCLE.map((step, i) => (
              <div key={step} className="flex items-center gap-2 shrink-0">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                  i <= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>{i + 1}</div>
                <span className={cn("text-xs font-medium", i <= 2 ? "text-foreground" : "text-muted-foreground")}>{step}</span>
                {i < LIFECYCLE.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
              </div>
            ))}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-b">
          {STATUS_TABS.map((t) => {
            const count = DECISIONS.filter((d) => d.status === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setActiveStatus(t.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
                  activeStatus === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center",
                    activeStatus === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border bg-card p-8 justify-center text-muted-foreground">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">No decisions in this stage</p>
            </div>
          )}

          {filtered.map((d) => {
            const isExpanded = expanded === d.id;
            return (
              <div key={d.id} className={cn(
                "rounded-xl border bg-card transition-all",
                d.priority === "critical" && "border-red-500/30",
                isExpanded && "ring-2 ring-primary/20"
              )}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : d.id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <TypeIcon type={d.type} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white",
                            d.priority === "critical" ? "bg-red-500" : d.priority === "high" ? "bg-amber-500" : "bg-blue-500"
                          )}>{d.priority}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{d.type}</span>
                        </div>
                        <p className="text-sm font-semibold">{d.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.finding}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-emerald-500">{d.estimatedImpact}</p>
                      <p className="text-[10px] text-muted-foreground">{d.confidence}% confidence</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Root Cause</p>
                        <p className="text-sm">{d.rootCause}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommendation</p>
                        <p className="text-sm">{d.recommendation}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Evidence from: {d.sources.join(" · ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Investigate</button>
                        <button className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Simulate</button>
                        <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">Approve</button>
                        <button className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Dismiss</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageContent>
    </>
  );
}
