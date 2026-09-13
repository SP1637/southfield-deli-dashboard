"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { TrendingUp, TrendingDown } from "lucide-react";

type Platform = "all" | "google" | "meta" | "tiktok" | "linkedin" | "email" | "organic";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "all",      label: "All Channels" },
  { id: "google",   label: "Google" },
  { id: "meta",     label: "Meta" },
  { id: "tiktok",   label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "email",    label: "Email" },
  { id: "organic",  label: "Organic" },
];

const CHANNEL_DATA = [
  { id: "google",   name: "Google Ads",   color: "bg-blue-500",    spend: "£12,400", revenue: "£35,900", roas: "2.9×",  clicks: "48,200", conversions: "812",   cpa: "£15.27", trend: -4.2  },
  { id: "meta",     name: "Meta Ads",     color: "bg-indigo-500",  spend: "£9,800",  revenue: "£60,700", roas: "6.2×",  clicks: "44,100", conversions: "1,241", cpa: "£7.90",  trend: +21.0 },
  { id: "tiktok",   name: "TikTok Ads",   color: "bg-pink-500",    spend: "£3,200",  revenue: "£17,300", roas: "5.4×",  clicks: "12,800", conversions: "384",   cpa: "£8.33",  trend: +14.7 },
  { id: "linkedin", name: "LinkedIn Ads", color: "bg-sky-500",     spend: "£1,600",  revenue: "£8,200",  roas: "5.1×",  clicks: "3,200",  conversions: "98",    cpa: "£16.33", trend: +5.8  },
  { id: "email",    name: "Email",        color: "bg-violet-500",  spend: "£800",    revenue: "£22,100", roas: "27.6×", clicks: "12,800", conversions: "482",   cpa: "£1.66",  trend: -3.2  },
  { id: "organic",  name: "Organic SEO",  color: "bg-emerald-500", spend: "£0",      revenue: "£48,200", roas: "—",     clicks: "41,300", conversions: "1,024", cpa: "£0",     trend: +8.1  },
];

const SUMMARY = [
  { label: "Total Spend",   value: "£27,800" },
  { label: "Total Revenue", value: "£184,200" },
  { label: "Blended ROAS",  value: "4.82×" },
  { label: "Blended CPA",   value: "£8.58" },
];

export default function ChannelsPage() {
  const [platform, setPlatform] = useState<Platform>("all");
  const filtered = platform === "all" ? CHANNEL_DATA : CHANNEL_DATA.filter((c) => c.id === platform);

  return (
    <>
      <PageHeader title="Channels" />

      <PageContent>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border",
                platform === p.id
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filtered.map((ch) => (
            <div key={ch.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full shrink-0", ch.color)} />
                  <h3 className="text-sm font-semibold">{ch.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {ch.trend >= 0
                    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                  <span className={cn("text-sm font-bold", ch.trend >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {ch.trend > 0 ? "+" : ""}{ch.trend}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: "Spend",       value: ch.spend },
                  { label: "Revenue",     value: ch.revenue },
                  { label: "ROAS",        value: ch.roas },
                  { label: "Clicks",      value: ch.clicks },
                  { label: "Conversions", value: ch.conversions },
                  { label: "CPA",         value: ch.cpa },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                    <p className="text-sm font-bold">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {platform === "all" && (
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Total Marketing</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUMMARY.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
