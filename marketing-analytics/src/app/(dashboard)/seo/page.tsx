"use client";

import { useState, useMemo } from "react";
import {
  Search, TrendingUp, TrendingDown, MousePointerClick, Eye,
  Percent, Award, RefreshCw, Lightbulb, AlertTriangle,
  CheckCircle2, ArrowUpRight, Info, Globe, Monitor, Smartphone, Tablet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeoRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SeoData {
  totals: { clicks: number; impressions: number; avgCtr: number; avgPosition: number };
  queries: SeoRow[];
  pages: SeoRow[];
  devices: SeoRow[];
  countries: SeoRow[];
}

interface ApiResponse {
  data: SeoData;
  demo?: boolean;
  cached?: boolean;
  fetchedAt?: string;
  error?: string;
}

// ── AI Insight generator ──────────────────────────────────────────────────────

function generateInsights(data: SeoData): { type: "warning" | "success" | "tip"; text: string }[] {
  const insights: { type: "warning" | "success" | "tip"; text: string }[] = [];

  // CTR insight
  if (data.totals.avgCtr < 0.04) {
    insights.push({
      type: "warning",
      text: `Your average CTR is ${(data.totals.avgCtr * 100).toFixed(1)}% — below the 4% benchmark. Consider rewriting meta titles with stronger calls-to-action and adding power words.`,
    });
  } else if (data.totals.avgCtr > 0.07) {
    insights.push({
      type: "success",
      text: `Excellent CTR of ${(data.totals.avgCtr * 100).toFixed(1)}% — your titles and meta descriptions are resonating well with searchers.`,
    });
  }

  // Position insight
  if (data.totals.avgPosition > 10) {
    insights.push({
      type: "warning",
      text: `Average ranking position is ${data.totals.avgPosition.toFixed(1)} — below page 1. Focus on improving content depth and internal linking for mid-range keywords.`,
    });
  } else if (data.totals.avgPosition <= 5) {
    insights.push({
      type: "success",
      text: `Strong average position of ${data.totals.avgPosition.toFixed(1)} — you're consistently ranking in the top 5. Monitor for featured snippet opportunities.`,
    });
  }

  // Top query opportunity
  const highImpressionLowCtr = data.queries.find((q) => q.impressions > 5000 && q.ctr < 0.04);
  if (highImpressionLowCtr) {
    insights.push({
      type: "tip",
      text: `"${highImpressionLowCtr.key}" has ${formatCompact(highImpressionLowCtr.impressions)} impressions but only ${(highImpressionLowCtr.ctr * 100).toFixed(1)}% CTR. A richer snippet or updated title tag could significantly boost clicks.`,
    });
  }

  // Device breakdown
  const desktop = data.devices.find((d) => d.key === "DESKTOP");
  const mobile = data.devices.find((d) => d.key === "MOBILE");
  if (desktop && mobile && mobile.impressions / (desktop.impressions + mobile.impressions) > 0.4) {
    insights.push({
      type: "tip",
      text: `${((mobile.impressions / (desktop.impressions + mobile.impressions)) * 100).toFixed(0)}% of your impressions come from mobile. Ensure pages are mobile-optimised and Core Web Vitals pass on mobile.`,
    });
  }

  // Quick win: position 5-15 with decent impressions
  const quickWin = data.queries.find((q) => q.position >= 5 && q.position <= 15 && q.impressions > 3000);
  if (quickWin) {
    insights.push({
      type: "tip",
      text: `"${quickWin.key}" ranks at position ${quickWin.position.toFixed(1)} with ${formatCompact(quickWin.impressions)} impressions — a quick-win candidate. Strengthen the page's E-E-A-T signals and add structured data to push to top 5.`,
    });
  }

  return insights.slice(0, 4);
}

// ── KPI mini card ─────────────────────────────────────────────────────────────

function KpiBox({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <div className={cn("rounded-lg p-2 shrink-0", accent ?? "bg-primary/10")}>
        <Icon className={cn("h-4 w-4", accent ? "text-white" : "text-primary")} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ type, text }: { type: "warning" | "success" | "tip"; text: string }) {
  const styles = {
    warning: { bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900", text: "text-amber-700 dark:text-amber-400", icon: AlertTriangle },
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
    tip:     { bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900", text: "text-blue-700 dark:text-blue-400", icon: Lightbulb },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={cn("rounded-lg border p-3 flex gap-2.5", styles.bg)}>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", styles.text)} />
      <p className={cn("text-sm leading-relaxed", styles.text)}>{text}</p>
    </div>
  );
}

// ── Device icon ───────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string }) {
  if (device === "DESKTOP") return <Monitor className="h-3.5 w-3.5" />;
  if (device === "MOBILE")  return <Smartphone className="h-3.5 w-3.5" />;
  return <Tablet className="h-3.5 w-3.5" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { label: "Last 7 days",  value: "7daysAgo" },
  { label: "Last 28 days", value: "28daysAgo" },
  { label: "Last 90 days", value: "90daysAgo" },
];

export default function SeoPage() {
  const [range, setRange] = useState("28daysAgo");
  const [data, setData]   = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"queries" | "pages" | "devices" | "countries">("queries");

  async function fetchData(startDate: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/seo?startDate=${startDate}&endDate=today`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on mount
  useMemo(() => {
    if (!data && !loading) fetchData(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRangeChange(v: string) {
    setRange(v);
    fetchData(v);
  }

  const seo   = data?.data;
  const isDemo = data?.demo;
  const insights = seo ? generateInsights(seo) : [];

  const countryNames: Record<string, string> = {
    gbr: "United Kingdom", usa: "United States", ind: "India",
    can: "Canada", aus: "Australia", deu: "Germany", fra: "France",
    nld: "Netherlands", bra: "Brazil", sgp: "Singapore",
  };

  return (
    <>
      <PageHeader title="SEO — Search Console" />
      <PageContent>

        <div className="flex items-center gap-2 flex-wrap">
          {isDemo && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Info className="h-3 w-3" /> Demo data
            </Badge>
          )}
          {data && !isDemo && (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Live
            </Badge>
          )}
          <select
            value={range}
            onChange={(e) => handleRangeChange(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => fetchData(range)} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

      {/* Loading skeleton */}
      {loading && !seo && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {seo && (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiBox
              label="Total Clicks"
              value={formatCompact(seo.totals.clicks)}
              sub="organic search clicks"
              icon={MousePointerClick}
            />
            <KpiBox
              label="Total Impressions"
              value={formatCompact(seo.totals.impressions)}
              sub="search result appearances"
              icon={Eye}
            />
            <KpiBox
              label="Avg. CTR"
              value={`${(seo.totals.avgCtr * 100).toFixed(1)}%`}
              sub={seo.totals.avgCtr >= 0.04 ? "above benchmark" : "below 4% benchmark"}
              icon={Percent}
            />
            <KpiBox
              label="Avg. Position"
              value={seo.totals.avgPosition.toFixed(1)}
              sub={seo.totals.avgPosition <= 10 ? "page 1 ranking" : "below page 1"}
              icon={Award}
            />
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                AI SEO Recommendations
              </p>
              <div className="space-y-2.5">
                {insights.map((ins, i) => (
                  <InsightCard key={i} type={ins.type} text={ins.text} />
                ))}
              </div>
            </div>
          )}

          {/* Main table + chart grid */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Left: tabbed table */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="border-b px-4">
                <div className="flex gap-0 -mb-px overflow-x-auto">
                  {(["queries", "pages", "devices", "countries"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        {activeTab === "queries" ? "Query" : activeTab === "pages" ? "Page" : activeTab === "devices" ? "Device" : "Country"}
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Clicks</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Impressions</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">CTR</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(seo[activeTab] as SeoRow[]).map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium max-w-[240px] truncate">
                          {activeTab === "devices" ? (
                            <span className="flex items-center gap-1.5">
                              <DeviceIcon device={row.key} />
                              {row.key.charAt(0) + row.key.slice(1).toLowerCase()}
                            </span>
                          ) : activeTab === "countries" ? (
                            <span className="flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              {countryNames[row.key] ?? row.key.toUpperCase()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              {row.key}
                              {activeTab === "pages" && (
                                <a
                                  href={`https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(row.key)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary opacity-0 group-hover:opacity-100"
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                </a>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="text-right px-4 py-2.5 tabular-nums">{formatCompact(row.clicks)}</td>
                        <td className="text-right px-4 py-2.5 tabular-nums text-muted-foreground">{formatCompact(row.impressions)}</td>
                        <td className="text-right px-4 py-2.5 tabular-nums">
                          <span className={cn(
                            "font-medium",
                            row.ctr >= 0.06 ? "text-emerald-600" : row.ctr < 0.03 ? "text-red-500" : "text-foreground"
                          )}>
                            {(row.ctr * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right px-4 py-2.5 tabular-nums">
                          <span className={cn(
                            "font-medium",
                            row.position <= 3 ? "text-emerald-600" : row.position <= 10 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {row.position.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: bar chart + devices */}
            <div className="space-y-4">
              {/* Top queries bar chart */}
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold mb-3">Top Queries by Clicks</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={seo.queries.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatCompact} />
                    <YAxis type="category" dataKey="key" tick={{ fontSize: 9 }} width={120} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      formatter={(v: number) => [formatCompact(v), "Clicks"]}
                    />
                    <Bar dataKey="clicks" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Device breakdown */}
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold mb-3">Clicks by Device</p>
                <div className="space-y-2.5">
                  {(() => {
                    const total = seo.devices.reduce((s, d) => s + d.clicks, 0);
                    return seo.devices.map((d) => {
                      const pct = total > 0 ? (d.clicks / total) * 100 : 0;
                      return (
                        <div key={d.key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5 font-medium">
                              <DeviceIcon device={d.key} />
                              {d.key.charAt(0) + d.key.slice(1).toLowerCase()}
                            </span>
                            <span className="text-muted-foreground">{formatCompact(d.clicks)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Position vs CTR scatter summary */}
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold mb-3">CTR Trend by Query Rank</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={seo.queries.slice(0, 10).map((q, i) => ({ name: `#${i + 1}`, ctr: +(q.ctr * 100).toFixed(2), pos: +q.position.toFixed(1) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      formatter={(v: number) => [`${v}%`, "CTR"]}
                    />
                    <Line type="monotone" dataKey="ctr" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Setup help banner (shown for demo) */}
          {isDemo && (
            <div className="rounded-xl border border-dashed bg-muted/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold">Connect Google Search Console</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add your service account to Search Console and set{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">SEARCH_CONSOLE_SITE_URL</code> in your environment variables to see live data.
                </p>
              </div>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Open Search Console
                </Button>
              </a>
            </div>
          )}
        </>
      )}
      </PageContent>
    </>
  );
}
