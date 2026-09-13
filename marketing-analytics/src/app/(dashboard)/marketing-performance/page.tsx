"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DemoPageTemplate } from "@/components/dashboard/demo-page-template";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tab = "overview" | "acquisition" | "engagement" | "conversion" | "revenue";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "acquisition", label: "Acquisition" },
  { id: "engagement",  label: "Engagement" },
  { id: "conversion",  label: "Conversion" },
  { id: "revenue",     label: "Revenue" },
];

const OVERVIEW_KPIS = [
  { title: "Total Revenue",   value: "£184,200", change: +14.2 },
  { title: "Marketing ROAS",  value: "4.82×",    change: +8.1  },
  { title: "Total Sessions",  value: "142,800",  change: +6.4  },
  { title: "Conversions",     value: "3,241",    change: +11.8 },
  { title: "Cost Per Acq.",   value: "£38.40",   change: -6.4  },
  { title: "Marketing Score", value: "84/100",   change: +3.0  },
];

const CHANNEL_PERF = [
  { channel: "Google Ads",  spend: "£12,400", revenue: "£35,900", roas: "2.9×",  sessions: "38,200", trend: -4.2  },
  { channel: "Meta Ads",    spend: "£9,800",  revenue: "£60,700", roas: "6.2×",  sessions: "44,100", trend: +21.0 },
  { channel: "Organic SEO", spend: "£0",      revenue: "£48,200", roas: "—",     sessions: "41,300", trend: +8.1  },
  { channel: "Email",       spend: "£800",    revenue: "£22,100", roas: "27.6×", sessions: "12,800", trend: -3.2  },
  { channel: "TikTok Ads",  spend: "£3,200",  revenue: "£17,300", roas: "5.4×",  sessions: "6,400",  trend: +14.7 },
];

export default function MarketingPerformancePage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <>
      <PageHeader title="Marketing Performance" />

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

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="text-sm font-semibold">Performance by Channel</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Channel</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Spend</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Revenue</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">ROAS</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Sessions</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_PERF.map((row) => (
                      <tr key={row.channel} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 font-medium">{row.channel}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{row.spend}</td>
                        <td className="px-5 py-3 text-right font-semibold">{row.revenue}</td>
                        <td className="px-5 py-3 text-right">{row.roas}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{row.sessions}</td>
                        <td className={cn("px-5 py-3 text-right font-semibold", row.trend >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {row.trend > 0 ? "+" : ""}{row.trend}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "acquisition" && <DemoPageTemplate title="Acquisition" section="Performance" />}
        {tab === "engagement"  && <DemoPageTemplate title="Engagement"  section="Performance" />}
        {tab === "conversion"  && <DemoPageTemplate title="Conversion"  section="Performance" />}
        {tab === "revenue"     && <DemoPageTemplate title="Revenue"     section="Performance" />}
      </PageContent>
    </>
  );
}
