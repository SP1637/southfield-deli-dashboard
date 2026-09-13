"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tab = "overview" | "revenue" | "profitability" | "efficiency" | "customers";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",      label: "Overview" },
  { id: "revenue",       label: "Revenue" },
  { id: "profitability", label: "Profitability" },
  { id: "efficiency",    label: "Efficiency" },
  { id: "customers",     label: "Customers" },
];

const OVERVIEW_KPIS = [
  { title: "Revenue",  value: "£184,200", change: +14.2 },
  { title: "Profit",   value: "£72,400",  change: +9.8  },
  { title: "ROAS",     value: "4.82×",    change: +8.1  },
  { title: "Margin",   value: "39.3%",    change: -1.2  },
  { title: "CAC",      value: "£38",      change: -6.4  },
  { title: "LTV",      value: "£284",     change: +4.1  },
  { title: "Orders",   value: "1,284",    change: +11.8 },
  { title: "AOV",      value: "£143.45",  change: +2.1  },
];

const REVENUE_BY_CHANNEL = [
  { channel: "Meta Ads",    revenue: 60700, pct: 33 },
  { channel: "Organic SEO", revenue: 48200, pct: 26 },
  { channel: "Google Ads",  revenue: 35900, pct: 19 },
  { channel: "Email",       revenue: 22100, pct: 12 },
  { channel: "TikTok Ads",  revenue: 17300, pct: 10 },
];

const PROFIT_BY_CAMPAIGN = [
  { campaign: "Meta Campaign A",   spend: 4800, revenue: 29700, profit: 24900, roas: "6.2×" },
  { campaign: "Organic / SEO",     spend: 0,    revenue: 48200, profit: 48200, roas: "—"    },
  { campaign: "TikTok Campaign B", spend: 3200, revenue: 17300, profit: 14100, roas: "5.4×" },
  { campaign: "Email Campaigns",   spend: 800,  revenue: 22100, profit: 21300, roas: "27.6×"},
  { campaign: "Google Campaign A", spend: 5400, revenue: 19800, profit: 14400, roas: "3.7×" },
  { campaign: "Google Campaign B", spend: 7000, revenue: 16100, profit: 9100,  roas: "2.3×" },
  { campaign: "Meta Campaign B",   spend: 5000, revenue: 31000, profit: 26000, roas: "6.2×" },
];

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {OVERVIEW_KPIS.map((kpi) => (
          <div key={kpi.title} className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{kpi.title}</p>
            <p className="text-2xl font-bold mb-1">{kpi.value}</p>
            <div className={cn("flex items-center gap-1 text-xs font-medium", kpi.change >= 0 ? "text-emerald-500" : "text-red-500")}>
              {kpi.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {kpi.change > 0 ? "+" : ""}{kpi.change}% vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Revenue by Channel</h3>
        <div className="space-y-3">
          {REVENUE_BY_CHANNEL.map((row) => (
            <div key={row.channel}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{row.channel}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{row.pct}%</span>
                  <span className="font-semibold w-20 text-right">£{row.revenue.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">Profit by Campaign</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Campaign</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Spend</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Revenue</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Profit</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {PROFIT_BY_CAMPAIGN.sort((a, b) => b.profit - a.profit).map((row) => (
                <tr key={row.campaign} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-medium">{row.campaign}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    {row.spend === 0 ? "—" : `£${row.spend.toLocaleString()}`}
                  </td>
                  <td className="px-5 py-3 text-right">£{row.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-500">£{row.profit.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">{row.roas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">{label} analytics</p>
        <p className="text-xs">Connect a revenue source to unlock this view.</p>
        <button className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          Connect Source
        </button>
      </div>
    </div>
  );
}

export default function RevenueRoiPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <PageHeader title="Revenue & ROI" />

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

        {tab === "overview"      && <OverviewTab />}
        {tab === "revenue"       && <EmptyTab label="Revenue" />}
        {tab === "profitability" && <EmptyTab label="Profitability" />}
        {tab === "efficiency"    && <EmptyTab label="Efficiency" />}
        {tab === "customers"     && <EmptyTab label="Customers" />}
      </PageContent>
    </>
  );
}
