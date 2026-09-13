"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DemoPageTemplate } from "@/components/dashboard/demo-page-template";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

type Tab = "overview" | "search" | "advertising" | "social" | "content" | "pricing" | "offers" | "reviews";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "search",      label: "Search" },
  { id: "advertising", label: "Advertising" },
  { id: "social",      label: "Social" },
  { id: "content",     label: "Content" },
  { id: "pricing",     label: "Pricing" },
  { id: "offers",      label: "Offers" },
  { id: "reviews",     label: "Reviews" },
];

const COMPETITORS = [
  { name: "Klaviyo",      da: 72, traffic: "1.2M",  ads: 48,  social: "182K",  rating: 4.6, trend: +8.2  },
  { name: "HubSpot",      da: 91, traffic: "4.8M",  ads: 124, social: "620K",  rating: 4.4, trend: +3.1  },
  { name: "Mailchimp",    da: 85, traffic: "2.1M",  ads: 36,  social: "290K",  rating: 4.2, trend: -1.4  },
  { name: "Marketo",      da: 68, traffic: "840K",  ads: 62,  social: "98K",   rating: 4.1, trend: +1.8  },
  { name: "ActiveCampaign", da: 61, traffic: "520K", ads: 29, social: "74K",   rating: 4.7, trend: +12.4 },
];

const SHARE_OF_VOICE = [
  { name: "Nexoryx",       pct: 14, color: "bg-primary" },
  { name: "Klaviyo",       pct: 22, color: "bg-blue-500" },
  { name: "HubSpot",       pct: 31, color: "bg-emerald-500" },
  { name: "Mailchimp",     pct: 18, color: "bg-amber-500" },
  { name: "Others",        pct: 15, color: "bg-muted-foreground/30" },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Competitors Tracked", value: "5",    change: 0     },
          { label: "Share of Voice",      value: "14%",  change: +2.1  },
          { label: "DA Score",            value: "61",   change: +4.0  },
          { label: "Active Ads",          value: "29",   change: -8.3  },
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

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Share of Voice</h3>
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
          {SHARE_OF_VOICE.map((s) => (
            <div key={s.name} className={cn("h-full", s.color)} style={{ width: `${s.pct}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {SHARE_OF_VOICE.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
              <span className="text-xs text-muted-foreground">{s.name}</span>
              <span className="text-xs font-bold">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">Competitor Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Competitor</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">DA</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Monthly Traffic</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Active Ads</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Social Following</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Rating</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.name} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-medium flex items-center gap-2">
                    {c.name}
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                  </td>
                  <td className="px-5 py-3 text-right">{c.da}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{c.traffic}</td>
                  <td className="px-5 py-3 text-right">{c.ads}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{c.social}</td>
                  <td className="px-5 py-3 text-right font-semibold text-amber-500">{c.rating}</td>
                  <td className={cn("px-5 py-3 text-right font-semibold", c.trend >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {c.trend > 0 ? "+" : ""}{c.trend}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CompetitorsPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <PageHeader title="Competitors" />
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

        {tab === "overview"    && <OverviewTab />}
        {tab === "search"      && <DemoPageTemplate title="Search Intelligence"    section="Competitive" />}
        {tab === "advertising" && <DemoPageTemplate title="Ad Library"              section="Competitive" />}
        {tab === "social"      && <DemoPageTemplate title="Social Benchmarks"       section="Competitive" />}
        {tab === "content"     && <DemoPageTemplate title="Content Analysis"        section="Competitive" />}
        {tab === "pricing"     && <DemoPageTemplate title="Pricing Intelligence"    section="Competitive" />}
        {tab === "offers"      && <DemoPageTemplate title="Offers & Promotions"     section="Competitive" />}
        {tab === "reviews"     && <DemoPageTemplate title="Review Benchmarks"       section="Competitive" />}
      </PageContent>
    </>
  );
}
