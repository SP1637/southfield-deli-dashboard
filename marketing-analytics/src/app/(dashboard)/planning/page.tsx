"use client";

import Link from "next/link";
import {
  Megaphone, Calculator, Calendar, Rocket, Flag, Target,
  BarChart3, Sliders, ArrowRight, CheckCircle2, Clock,
  TrendingUp, ChevronRight, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const MODULES = [
  { label: "Campaign Planner",   href: "/campaign-planner",   icon: Megaphone,  color: "text-primary",      status: "Active",    count: "3 campaigns" },
  { label: "Budget Planner",     href: "/budget",             icon: Calculator,  color: "text-emerald-500",  status: "On track",  count: "£84k allocated" },
  { label: "Marketing Calendar", href: "/marketing-calendar", icon: Calendar,    color: "text-blue-500",     status: "4 events",  count: "Next 30 days" },
  { label: "Launch Planner",     href: "/launch-planner",     icon: Rocket,      color: "text-violet-500",   status: "1 upcoming",count: "Aug 14" },
  { label: "Objectives",         href: "/objectives",         icon: Flag,        color: "text-amber-500",    status: "6 active",  count: "Q3 2026" },
  { label: "OKRs",               href: "/okrs",               icon: Target,      color: "text-pink-500",     status: "On track",  count: "4/6 green" },
  { label: "Quarter Planning",   href: "/quarter-planning",   icon: BarChart3,   color: "text-primary",      status: "Q3 active", count: "Q4 prep due" },
  { label: "Scenario Planning",  href: "/scenario-planning",  icon: Sliders,     color: "text-muted-foreground", status: "3 scenarios", count: "Best/Base/Worst" },
];

const UPCOMING = [
  { date: "Aug 6",  title: "Q3 Mid-Quarter Review",       type: "Review",   done: false },
  { date: "Aug 12", title: "Back to School Campaign Live", type: "Launch",   done: false },
  { date: "Aug 14", title: "Email Nurture Sequence Start", type: "Campaign", done: false },
  { date: "Aug 20", title: "OKR check-in — Marketing",    type: "OKR",      done: false },
  { date: "Sep 1",  title: "Q4 Budget Submission",        type: "Budget",   done: false },
];

const OKR_SNAPSHOT = [
  { objective: "Grow monthly revenue to £400k",      progress: 84,  status: "green" as const },
  { objective: "Reduce CAC by 20%",                  progress: 61,  status: "amber" as const },
  { objective: "Launch TikTok channel",               progress: 100, status: "green" as const },
  { objective: "Hit 90k email subscribers",           progress: 78,  status: "green" as const },
  { objective: "Improve landing page CVR to 4.5%",   progress: 42,  status: "red"   as const },
  { objective: "Q3 content: 48 pieces published",     progress: 67,  status: "amber" as const },
];

const TYPE_COLORS: Record<string, string> = {
  Review:   "bg-blue-500/10 text-blue-600",
  Launch:   "bg-violet-500/10 text-violet-600",
  Campaign: "bg-primary/10 text-primary",
  OKR:      "bg-amber-500/10 text-amber-600",
  Budget:   "bg-emerald-500/10 text-emerald-600",
};

export default function PlanningPage() {
  return (
    <>
      <PageHeader title="Planning" />
      <PageContent>

        {/* ── Hero ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-3">
          <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-primary">Marketing teams don't only analyse.</p>
            <p className="text-sm font-bold text-foreground">They plan.</p>
            <p className="text-xs text-muted-foreground mt-1">Every campaign, budget, and objective — organised in one place. Plan quarters, track OKRs, simulate scenarios.</p>
          </div>
        </div>

        {/* ── Status overview ── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Active Campaigns",   value: "3",     color: "text-primary" },
            { label: "Budget Remaining",   value: "£26k",  color: "text-emerald-500" },
            { label: "OKRs On Track",      value: "4/6",   color: "text-emerald-500" },
            { label: "Upcoming Events",    value: "5",     color: "text-blue-500" },
            { label: "Launches This Month",value: "2",     color: "text-violet-500" },
            { label: "Q4 Prep",            value: "28 days",color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center space-y-1">
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Upcoming ── */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Upcoming Events</p>
              </div>
              <Link href="/marketing-calendar" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Calendar <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {UPCOMING.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-[11px] font-semibold text-muted-foreground">{e.date}</p>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {e.done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      : <Clock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    }
                    <p className="text-sm truncate">{e.title}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", TYPE_COLORS[e.type] ?? "bg-muted text-muted-foreground")}>
                    {e.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── OKR snapshot ── */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-pink-500" />
                <p className="text-sm font-semibold">OKR Snapshot — Q3</p>
              </div>
              <Link href="/okrs" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                All OKRs <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {OKR_SNAPSHOT.map((o, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground truncate pr-2">{o.objective}</p>
                    <span className={cn("text-[10px] font-bold shrink-0",
                      o.status === "green" ? "text-emerald-500" : o.status === "amber" ? "text-amber-500" : "text-red-500"
                    )}>{o.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        o.status === "green" ? "bg-emerald-500" : o.status === "amber" ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Module grid ── */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">All Planning Modules</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                  <span className="text-[10px] text-muted-foreground">{m.status}</span>
                </Link>
              );
            })}
          </div>
        </div>

      </PageContent>
    </>
  );
}
