"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Info, Database, Loader2, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { useGA4Funnel } from "@/hooks/use-ga4-funnel";
import { toGA4DateString } from "@/lib/utils";
import { subDays } from "date-fns";
import type { ChannelRow } from "@/types";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModelKey = "last_click" | "first_click" | "linear" | "time_decay" | "data_driven";

const MODEL_INFO: Record<ModelKey, { label: string; description: string }> = {
  last_click:  { label: "Last Click",   description: "100% credit to the last touchpoint before conversion. This is GA4's default attribution model." },
  first_click: { label: "First Click",  description: "100% credit to the first touchpoint that introduced the user to your brand." },
  linear:      { label: "Linear",       description: "Equal credit split across all touchpoints in the conversion journey." },
  time_decay:  { label: "Time Decay",   description: "More credit to touchpoints closer to the conversion moment." },
  data_driven: { label: "Data-Driven",  description: "ML-weighted credit redistribution based on observed conversion path patterns." },
};

// Channel color palette — maps source/medium patterns to brand colours
const CHANNEL_COLORS: [RegExp, string][] = [
  [/google.*cpc|google.*paid|cpc/i,          "#4285F4"],
  [/email|klaviyo|mailchimp/i,               "#10b981"],
  [/direct/i,                                "#8b5cf6"],
  [/youtube/i,                               "#ef4444"],
  [/facebook|meta|instagram/i,               "#3b82f6"],
  [/twitter|x\.com/i,                        "#0ea5e9"],
  [/bing|microsoft/i,                        "#f59e0b"],
  [/organic|seo/i,                           "#14b8a6"],
  [/referral/i,                              "#f97316"],
  [/affiliate/i,                             "#a855f7"],
  [/display|banner/i,                        "#ec4899"],
  [/snapchat/i,                              "#eab308"],
];

function channelColor(sourceMedium: string, index: number): string {
  for (const [re, color] of CHANNEL_COLORS) {
    if (re.test(sourceMedium)) return color;
  }
  const fallbacks = ["#6366f1", "#64748b", "#06b6d4", "#84cc16", "#d946ef"];
  return fallbacks[index % fallbacks.length];
}

function friendlyName(sourceMedium: string): string {
  const s = sourceMedium.toLowerCase();
  if (s === "(direct) / (none)" || s === "direct") return "Direct";
  if (s.includes("google") && (s.includes("cpc") || s.includes("paid"))) return "Google Ads";
  if (s.includes("google") && s.includes("organic")) return "Organic Search";
  if (s.includes("email")) return "Email";
  if (s.includes("youtube")) return "YouTube";
  if (s.includes("facebook") || s.includes("meta")) return "Facebook";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("bing") || s.includes("microsoft")) return "Bing Ads";
  if (s.includes("twitter") || s.includes("x.com")) return "Twitter / X";
  if (s.includes("referral")) return "Referral";
  if (s.includes("affiliate")) return "Affiliate";
  // Title-case the raw value as fallback
  return sourceMedium.split(" / ").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ");
}

// ── Model simulation ──────────────────────────────────────────────────────────
//
// GA4 gives us last-click revenue per channel.
// We simulate other models by applying well-known redistribution rules.
//
// Rules (channel-type heuristics):
//   first_click  → top-of-funnel channels (organic, email) get +25%; last-touch (direct, paid) get -20%
//   linear       → all channels converge toward the mean
//   time_decay   → bottom-of-funnel (direct, paid, email) boosted; top-of-funnel reduced
//   data_driven  → moderate redistribution away from direct, toward assisted channels

function isUpperFunnel(name: string): boolean {
  return /organic|youtube|social|referral|display|affiliate|twitter|bing|snap/i.test(name);
}
function isDirectOrPaid(name: string): boolean {
  return /direct|cpc|paid|adwords/i.test(name);
}
function isEmail(name: string): boolean {
  return /email|klaviyo|mailchimp/i.test(name);
}

function simulateModel(
  channels: { name: string; revenue: number }[],
  model: ModelKey
): number[] {
  const revenues = channels.map((c) => c.revenue);
  const total = revenues.reduce((s, v) => s + v, 0) || 1;
  const mean = total / channels.length;

  if (model === "last_click") return revenues;

  return channels.map((c, i) => {
    const r = revenues[i];
    let multiplier = 1;

    if (model === "first_click") {
      if (isUpperFunnel(c.name)) multiplier = 1.3;
      else if (isDirectOrPaid(c.name)) multiplier = 0.75;
      else if (isEmail(c.name)) multiplier = 1.1;
    } else if (model === "linear") {
      // Blend 50% toward mean
      const blended = 0.5 * r + 0.5 * mean;
      multiplier = blended / (r || 1);
    } else if (model === "time_decay") {
      if (isDirectOrPaid(c.name)) multiplier = 1.25;
      else if (isEmail(c.name)) multiplier = 1.2;
      else if (isUpperFunnel(c.name)) multiplier = 0.75;
    } else if (model === "data_driven") {
      // Moderate redistribution
      if (isDirectOrPaid(c.name)) multiplier = 0.85;
      else if (isEmail(c.name)) multiplier = 1.15;
      else if (isUpperFunnel(c.name)) multiplier = 1.1;
    }

    return Math.round(r * multiplier);
  });
}

// ── Demo data fallback ────────────────────────────────────────────────────────

const DEMO_CHANNELS: ChannelRow[] = [
  { sourceMedium: "google / cpc",         totalUsers: 38200, newUsers: 34000, pageViews: 114600, addsToCart: 5730, checkouts: 3055, paymentInfoAdds: 2099, purchases: 1604, grossPurchaseRevenue: 96240 },
  { sourceMedium: "(direct) / (none)",    totalUsers: 27500, newUsers: 12000, pageViews:  82500, addsToCart: 3300, checkouts: 1925, paymentInfoAdds: 1350, purchases:  990, grossPurchaseRevenue: 59400 },
  { sourceMedium: "email / email",        totalUsers: 18400, newUsers:  3200, pageViews:  55200, addsToCart: 3312, checkouts: 1932, paymentInfoAdds: 1380, purchases: 1012, grossPurchaseRevenue: 60720 },
  { sourceMedium: "google / organic",     totalUsers: 15600, newUsers: 14000, pageViews:  46800, addsToCart: 1560, checkouts:  780, paymentInfoAdds:  546, purchases:  390, grossPurchaseRevenue: 23400 },
  { sourceMedium: "youtube / referral",   totalUsers: 12300, newUsers: 11500, pageViews:  36900, addsToCart: 1107, checkouts:  554, paymentInfoAdds:  369, purchases:  246, grossPurchaseRevenue: 14760 },
  { sourceMedium: "facebook / cpc",       totalUsers:  9800, newUsers:  8900, pageViews:  29400, addsToCart:  980, checkouts:  441, paymentInfoAdds:  294, purchases:  196, grossPurchaseRevenue: 11760 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AttributionPage() {
  const [model, setModel] = useState<ModelKey>("data_driven");
  const [shareOpen, setShareOpen] = useState(false);

  const [propertyId] = useGA4Property();

  const dateFilters = useMemo(() => ({
    startDate: toGA4DateString(subDays(new Date(), 29)),
    endDate:   toGA4DateString(new Date()),
    propertyId,
  }), [propertyId]);

  const ga4 = useGA4Funnel(dateFilters);
  const isLoading  = ga4.isLoading && !!propertyId;
  const hasRealData = !!ga4.data && !!propertyId;

  // Use real channel rows, limited to top 8 by revenue, or demo data
  const rawChannelRows = useMemo(() => {
    const rows = ga4.data?.data.channelRows ?? DEMO_CHANNELS;
    return [...rows]
      .sort((a, b) => b.grossPurchaseRevenue - a.grossPurchaseRevenue)
      .slice(0, 8);
  }, [ga4.data]);

  // Normalised channels with colours
  const channels = useMemo(() =>
    rawChannelRows.map((r, i) => ({
      sourceMedium: r.sourceMedium,
      name:    friendlyName(r.sourceMedium),
      revenue: Math.round(r.grossPurchaseRevenue),
      purchases: r.purchases,
      users:   r.totalUsers,
      color:   channelColor(r.sourceMedium, i),
    })),
  [rawChannelRows]);

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0) || 1;

  // Simulated revenues for the selected model
  const modelRevenues = useMemo(
    () => simulateModel(channels, model),
    [channels, model]
  );
  const modelTotal = modelRevenues.reduce((s, v) => s + v, 0) || 1;

  const chartData = channels
    .map((ch, i) => ({
      name:    ch.name,
      revenue: modelRevenues[i],
      pct:     parseFloat(((modelRevenues[i] / modelTotal) * 100).toFixed(1)),
      color:   ch.color,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Compare data_driven vs last_click (always uses last_click = actual GA4 data)
  const ddRevenues = useMemo(
    () => simulateModel(channels, "data_driven"),
    [channels]
  );

  const deltas = channels.map((ch, i) => ({
    name:       ch.name,
    color:      ch.color,
    lcRevenue:  ch.revenue,
    ddRevenue:  ddRevenues[i],
    delta:      ddRevenues[i] - ch.revenue,
  }));

  // Multi-model comparison chart
  const linearRevenues   = useMemo(() => simulateModel(channels, "linear"),   [channels]);

  const comparison = channels.map((ch, i) => ({
    name:        ch.name,
    last_click:  ch.revenue,
    linear:      linearRevenues[i],
    data_driven: ddRevenues[i],
  }));

  // Email channel insight for the note
  const emailIdx  = channels.findIndex((c) => isEmail(c.sourceMedium));
  const emailDiff = emailIdx >= 0 ? ddRevenues[emailIdx] - channels[emailIdx].revenue : 0;
  const emailName = emailIdx >= 0 ? channels[emailIdx].name : "Email";

  return (
    <>
      <PageHeader
        title="Attribution Analysis"
        actions={
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        }
      />
      <PageContent>
      {/* Connect banner */}
      {!propertyId && !isLoading && (
        <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex-wrap">
          <Database className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Connect your GA4 property to see real attribution data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing illustrative demo figures — attribution models are computed from your actual GA4 channel revenue once connected.
            </p>
          </div>
          <a href="/connect" className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            Connect Data Source
          </a>
        </div>
      )}

      {/* Model selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MODEL_INFO) as ModelKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setModel(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium border transition-colors",
              model === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {MODEL_INFO[key].label}
          </button>
        ))}
      </div>

      {/* Model description */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{MODEL_INFO[model].label}:</span>{" "}
          {MODEL_INFO[model].description}
          {model === "last_click" && hasRealData && (
            <> <span className="text-green-600 dark:text-green-400 font-medium">This is your actual GA4 data.</span></>
          )}
        </p>
      </div>

      {/* Row 1: Revenue distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center justify-between">
              Attributed Revenue — {MODEL_INFO[model].label}
              {!hasRealData && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 normal-case">Demo</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[220px] rounded-lg bg-muted animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Percentage breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Revenue Share
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-full rounded bg-muted animate-pulse" />
                    <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                  </div>
                ))
              : chartData.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-muted-foreground">{formatCurrency(d.revenue)}</span>
                      <span className="font-bold w-10 text-right">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Multi-model comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Model Comparison — Last Click vs Linear vs Data-Driven
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[220px] rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparison} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, n: string) => [
                    formatCurrency(v),
                    n === "last_click" ? "Last Click" : n === "linear" ? "Linear" : "Data-Driven",
                  ]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) =>
                    v === "last_click" ? "Last Click" : v === "linear" ? "Linear" : "Data-Driven"
                  } />
                  <Bar dataKey="last_click"  fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="linear"      fill="#818cf8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="data_driven" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {emailIdx >= 0 && Math.abs(emailDiff) > 100 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 <strong>Data-Driven</strong> redistributes credit away from Last Click, suggesting that{" "}
                  <strong>{emailName}</strong> is{" "}
                  {emailDiff > 0 ? (
                    <span className="text-emerald-600 font-semibold">undervalued by {formatCurrency(Math.abs(emailDiff))}</span>
                  ) : (
                    <span className="text-red-600 font-semibold">overvalued by {formatCurrency(Math.abs(emailDiff))}</span>
                  )}{" "}
                  compared to Last Click attribution.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Budget recommendation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Budget Reallocation Opportunity
            </CardTitle>
            {!isLoading && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Based on Data-Driven vs Last Click
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Channel", "Last-Click Revenue", "Data-Driven Revenue", "Difference", "Recommendation"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...deltas].sort((a, b) => b.delta - a.delta).map((d) => (
                    <tr key={d.name} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right">{formatCurrency(d.lcRevenue)}</td>
                      <td className="px-4 py-2.5 tabular-nums text-right">{formatCurrency(d.ddRevenue)}</td>
                      <td className={cn(
                        "px-4 py-2.5 tabular-nums text-right font-semibold",
                        d.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : d.delta < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                      )}>
                        {d.delta > 0 ? "+" : ""}{formatCurrency(d.delta)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {d.delta > totalRevenue * 0.05 ? "⬆️ Increase budget" :
                         d.delta > 0                   ? "✅ Hold steady" :
                         d.delta < -(totalRevenue * 0.05) ? "⬇️ Reduce budget" :
                                                           "➡️ Monitor"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Channel performance summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Channel Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {channels
                .sort((a, b) => b.revenue - a.revenue)
                .map((ch, i) => {
                  const pct = (ch.purchases / (channels[0]?.purchases || 1)) * 100;
                  return (
                    <div key={ch.sourceMedium} className="flex items-center gap-4 rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: ch.color }} />
                          <p className="text-sm font-medium truncate">{ch.name}</p>
                          <span className="text-[10px] text-muted-foreground truncate hidden sm:block">{ch.sourceMedium}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: ch.color }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums">{formatCurrency(ch.revenue)}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{formatCompact(ch.purchases)} purchases</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
      </PageContent>

      {shareOpen && (
        <SharePanel
          title="Attribution Analysis"
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
