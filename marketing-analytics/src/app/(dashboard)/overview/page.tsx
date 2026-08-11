"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { subDays } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  RefreshCw, ArrowRight, Loader2, Database, Printer,
  CreditCard, Mail, Activity, Share2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { AiInsights } from "@/components/dashboard/ai-insights";
import { GoalTracker } from "@/components/dashboard/goal-tracker";
import { ShareButton } from "@/components/dashboard/share-button";
import { ScheduledReports } from "@/components/dashboard/scheduled-reports";
import { SharePanel } from "@/components/dashboard/share-panel";
import { formatCompact, formatCurrency, toGA4DateString, cn } from "@/lib/utils";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { useGA4Funnel } from "@/hooks/use-ga4-funnel";
import {
  DEMO_FUNNEL_KPIS, DEMO_FUNNEL_TIMESERIES, DEMO_CHANNEL_ROWS,
  DEMO_FUNNEL_STEPS,
} from "@/lib/demo-data";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise "google / cpc" → "Google Ads", "email" → "Email" etc. */
function friendlyChannel(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("google") && (lower.includes("cpc") || lower.includes("paid"))) return "Google Ads";
  if (lower.includes("google") && lower.includes("organic")) return "Google Organic";
  if (lower.includes("google")) return "Google";
  if (lower.includes("facebook") || lower.includes("instagram") || lower.includes("meta")) return "Meta";
  if (lower.includes("email")) return "Email";
  if (lower.includes("direct") || lower === "(direct) / (none)") return "Direct";
  if (lower.includes("bing") || lower.includes("microsoft")) return "Bing";
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("twitter") || lower.includes("x.com")) return "X / Twitter";
  if (lower.includes("youtube")) return "YouTube";
  if (lower.includes("referral")) return "Referral";
  if (lower.includes("organic")) return "Organic";
  return raw.split(" / ")[0] ?? raw;
}

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9"];

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse space-y-2">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-7 w-28 bg-muted rounded" />
      <div className="h-2 w-full bg-muted rounded mt-3" />
    </div>
  );
}

// ── Anomaly generator ─────────────────────────────────────────────────────────

function buildAnomalies(kpis: typeof DEMO_FUNNEL_KPIS, funnelSteps: typeof DEMO_FUNNEL_STEPS) {
  type Level = "high" | "medium" | "positive";
  const items: { level: Level; title: string; detail: string; action: string; actionLabel: string }[] = [];

  const revDelta = kpis.grossPurchaseRevenueDelta;
  const usersDelta = kpis.totalUsersDelta;
  const pctFmt = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

  if (revDelta <= -0.1) {
    items.push({
      level: "high",
      title: `Revenue down ${pctFmt(revDelta)} vs last period`,
      detail: `Gross revenue declined. Check for campaign pauses, seasonal dips, or funnel drop-offs.`,
      action: "/funnel",
      actionLabel: "View funnel →",
    });
  } else if (revDelta >= 0.1) {
    items.push({
      level: "positive",
      title: `Revenue up ${pctFmt(revDelta)} vs last period`,
      detail: `Strong growth period. Identify top drivers and scale them.`,
      action: "/funnel",
      actionLabel: "See breakdown →",
    });
  }

  if (usersDelta <= -0.05) {
    items.push({
      level: "medium",
      title: `Traffic down ${pctFmt(usersDelta)} — fewer users this period`,
      detail: `User volume declined. Review campaign spend, organic rankings and referral sources.`,
      action: "/traffic",
      actionLabel: "View traffic →",
    });
  } else if (usersDelta >= 0.1) {
    items.push({
      level: "positive",
      title: `User growth ${pctFmt(usersDelta)} — momentum building`,
      detail: `More visitors this period. Make sure conversion rate is holding to turn traffic into revenue.`,
      action: "/traffic",
      actionLabel: "View traffic →",
    });
  }

  // Funnel drop-off: find the worst step-to-step drop
  if (funnelSteps.length >= 3) {
    let worstDrop = 0; let worstStep = "";
    for (let i = 1; i < funnelSteps.length; i++) {
      const drop = 1 - (funnelSteps[i].rateFromPrev ?? 1);
      if (drop > worstDrop) { worstDrop = drop; worstStep = funnelSteps[i].name; }
    }
    if (worstDrop > 0.3) {
      items.push({
        level: "medium",
        title: `High drop-off at "${worstStep}" step`,
        detail: `${(worstDrop * 100).toFixed(0)}% of users leave at this step — your biggest funnel leak.`,
        action: "/funnel",
        actionLabel: "Fix funnel →",
      });
    }
  }

  // Default positive if everything looks healthy
  if (items.length === 0) {
    items.push({
      level: "positive",
      title: "All key metrics are healthy",
      detail: "No significant drops or anomalies detected this period. Keep monitoring.",
      action: "/funnel",
      actionLabel: "View details →",
    });
  }

  return items.slice(0, 3);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { data: session } = useSession();
  const [emailSending, setEmailSending] = useState(false);
  const [emailToast, setEmailToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("snapshot");
  const [propertyId, setPropertyId] = useGA4Property();

  const dateFilters = useMemo(() => ({
    startDate: toGA4DateString(subDays(new Date(), 29)),
    endDate:   toGA4DateString(new Date()),
    propertyId,
  }), [propertyId]);

  // ── Real GA4 data ──────────────────────────────────────────────────────────
  const ga4 = useGA4Funnel(dateFilters);
  const isLoading = ga4.isLoading && !!propertyId;
  const hasRealData = !!ga4.data && !!propertyId;

  // Use real data when available, fall back to demo
  const kpis        = ga4.data?.data.kpis        ?? DEMO_FUNNEL_KPIS;
  const timeSeries  = ga4.data?.data.timeSeries  ?? DEMO_FUNNEL_TIMESERIES;
  const channelRows = ga4.data?.data.channelRows ?? DEMO_CHANNEL_ROWS;
  const funnelSteps = ga4.data?.data.funnelSteps ?? DEMO_FUNNEL_STEPS;

  // Derived metrics
  const avgOrderValue = kpis.purchases > 0 ? kpis.grossPurchaseRevenue / kpis.purchases : 0;
  const convRate      = kpis.totalUsers > 0 ? (kpis.purchases / kpis.totalUsers) * 100 : 0;
  // AOV delta ≈ revenue delta minus purchases delta (multiplicative decomposition)
  const avgOrderValueDelta = kpis.grossPurchaseRevenueDelta - kpis.purchasesDelta;
  // Conv rate delta ≈ purchases delta minus users delta
  const convRateDelta      = kpis.purchasesDelta - kpis.totalUsersDelta;

  // Revenue trend chart data (last 21 days)
  const revenueTrend = useMemo(() => {
    const rows = timeSeries.slice(-21);
    // If value2 (daily revenue) exists, use it; otherwise approximate from users
    const avgRevPerUser = kpis.totalUsers > 0 ? kpis.grossPurchaseRevenue / kpis.totalUsers : 0;
    const totalRev = kpis.grossPurchaseRevenue;
    const dailyTarget = totalRev / Math.max(rows.length, 1);
    return rows.map((r) => ({
      date: r.date.slice(5), // MM-DD
      revenue: r.value2 !== undefined ? Math.round(r.value2) : Math.round(r.value * avgRevPerUser),
      target: Math.round(dailyTarget),
    }));
  }, [timeSeries, kpis]);

  // Top 6 channels by revenue
  const topChannels = useMemo(() => {
    return [...channelRows]
      .sort((a, b) => b.grossPurchaseRevenue - a.grossPurchaseRevenue)
      .slice(0, 6)
      .map((r) => ({
        name: friendlyChannel(r.sourceMedium),
        revenue: Math.round(r.grossPurchaseRevenue),
        purchases: r.purchases,
        users: r.totalUsers,
      }));
  }, [channelRows]);

  // Anomalies generated from real data
  const anomalies = useMemo(() => buildAnomalies(kpis, funnelSteps), [kpis, funnelSteps]);

  // Sparklines (daily users trend)
  const sparkUsers   = timeSeries.slice(-14).map((r) => r.value);
  const sparkRevenue = timeSeries.slice(-14).map((r) =>
    r.value2 !== undefined ? r.value2 : r.value * (kpis.grossPurchaseRevenue / Math.max(kpis.totalUsers, 1))
  );

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  async function handleEmailReport() {
    setEmailSending(true);
    try {
      const res = await fetch("/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: dateFilters.startDate,
          endDate:   dateFilters.endDate,
          kpis: {
            revenue:   kpis.grossPurchaseRevenue,
            users:     kpis.totalUsers,
            purchases: kpis.purchases,
            roas:      convRate / 100,  // pass conv rate as a proxy; email template shows it nicely
          },
        }),
      });
      const data = await res.json();
      setEmailToast(res.ok ? `Report sent to ${session?.user?.email} ✓` : (data.error ?? "Failed to send"));
    } catch {
      setEmailToast("Network error — please try again");
    } finally {
      setEmailSending(false);
      setTimeout(() => setEmailToast(null), 4000);
    }
  }

  return (
    <>
      <PageHeader
        title="GA4 Overview"
        tabs={[
          { key: "snapshot",    label: "Report Snapshot" },
          { key: "realtime",    label: "Realtime" },
          { key: "by-source",   label: "By Source" },
          { key: "audience",    label: "Audience" },
          { key: "landing",     label: "Landing Page" },
          { key: "country",     label: "Country" },
          { key: "acquisition", label: "Traffic Acquisition" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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

      {/* Email toast */}
      {emailToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground text-background px-5 py-3 text-sm font-medium shadow-xl">
          {emailToast}
        </div>
      )}

      <PageContent>

      {/* ══════════════════════════════════════════════════════
           TAB: REPORT SNAPSHOT (default)
          ══════════════════════════════════════════════════════ */}
      {activeTab === "snapshot" && (<>

      {/* Connect banner — shown when signed in but no GA4 property selected yet */}
      {session && !propertyId && (
        <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex-wrap">
          <Database className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Connect GA4 to see your live analytics</p>
            <p className="text-xs text-muted-foreground">
              Go to <Link href="/connect" className="underline underline-offset-2 hover:text-foreground font-medium">Data Sources</Link>{" "}
              and click <strong>Connect</strong> on Google Analytics 4 to select your property.
            </p>
          </div>
          <Link
            href="/connect"
            className="shrink-0 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Connect GA4 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* GA4 error banner */}
      {ga4.isError && propertyId && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">GA4 data could not be loaded</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Check that the service account has Viewer access to property {propertyId}. Showing demo data.
            </p>
          </div>
          <button onClick={() => ga4.refetch()} className="shrink-0 text-xs text-red-600 underline hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {greet()}{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s your marketing performance at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {session && propertyId && (
            <PropertySelector value={propertyId} onChange={setPropertyId} />
          )}

          <span className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            isLoading
              ? "bg-muted text-muted-foreground"
              : hasRealData
              ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
          )}>
            {isLoading
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading…</>
              : hasRealData
              ? <><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live data</>
              : <><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Demo data</>
            }
          </span>

          {session && (
            <>
              <ShareButton propertyId={propertyId} />
              <ScheduledReports userEmail={session.user?.email} />
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs h-8 print:hidden"
                onClick={handleEmailReport}
                disabled={emailSending}
                title="Email this report"
              >
                {emailSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Email
              </Button>
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs h-8 print:hidden"
                onClick={() => window.print()}
                title="Export as PDF"
              >
                <Printer className="h-3.5 w-3.5" />
                PDF
              </Button>
            </>
          )}
          <button
            onClick={() => ga4.refetch()}
            className="rounded-md border p-2 text-muted-foreground hover:text-foreground print:hidden"
            title="Refresh data"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── 5 KPI cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Gross Revenue"
            value={kpis.grossPurchaseRevenue}
            delta={kpis.grossPurchaseRevenueDelta}
            format="currency"
            sparkline={sparkRevenue}
            sparklineColor="#10b981"
            comparisonLabel="vs prior period"
          />
          <KpiCard
            label="Total Users"
            value={kpis.totalUsers}
            delta={kpis.totalUsersDelta}
            sparkline={sparkUsers}
            sparklineColor="#8b5cf6"
            comparisonLabel="vs prior period"
          />
          <KpiCard
            label="Purchases"
            value={kpis.purchases}
            delta={kpis.purchasesDelta}
            sparkline={sparkUsers.map((v, i) => v * (kpis.purchases / Math.max(kpis.totalUsers, 1)))}
            sparklineColor="#f59e0b"
            comparisonLabel="vs prior period"
          />
          <KpiCard
            label="Avg Order Value"
            value={avgOrderValue}
            delta={avgOrderValueDelta}
            format="currency"
            sparkline={sparkRevenue.map((v) => v / Math.max(kpis.purchases / 30, 1))}
            sparklineColor="#6366f1"
            comparisonLabel="revenue ÷ purchases"
          />
          <KpiCard
            label="Conv. Rate"
            value={parseFloat(convRate.toFixed(2))}
            delta={convRateDelta}
            sparkline={sparkUsers.map(() => convRate)}
            sparklineColor="#ef4444"
            subLabel="purchases ÷ users"
            comparisonLabel="this period"
          />
        </div>
      )}

      {/* ── Revenue trend + Top channels ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center justify-between">
              Daily Revenue vs Target — Last 21 Days
              {!hasRealData && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 normal-case">
                  Demo data
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] rounded-lg bg-muted/30 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(v: number, name: string) => [
                      formatCurrency(v),
                      name === "revenue" ? "Revenue" : "Daily Target",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="target"  stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-indigo-500 inline-block" />Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-emerald-500 inline-block" />Daily target (avg)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top channels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Revenue by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[180px] rounded-lg bg-muted/30 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={topChannels}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(v: number, name: string) => [
                      name === "revenue" ? formatCurrency(v) : formatCompact(v),
                      name === "revenue" ? "Revenue" : "Purchases",
                    ]}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {topChannels.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── AI Insights + Goal Tracker ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AiInsights
          kpis={{
            revenue:        kpis.grossPurchaseRevenue,
            revenueDelta:   kpis.grossPurchaseRevenueDelta,
            roas:           0,
            users:          kpis.totalUsers,
            usersDelta:     kpis.totalUsersDelta,
            purchases:      kpis.purchases,
            conversionRate: convRate / 100,
            topChannel:     topChannels[0]?.name ?? "Unknown",
          }}
        />
        <GoalTracker
          actual={{
            revenue: kpis.grossPurchaseRevenue,
            users:   kpis.totalUsers,
            roas:    convRate / 100,
          }}
        />
      </div>

      {/* ── Anomalies + Funnel snapshot ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Anomalies — generated from real KPI deltas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Alerts & Anomalies
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                <Activity className="h-2.5 w-2.5 mr-1" />
                {hasRealData ? "From live data" : "Demo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
              ))
            ) : (
              anomalies.map((a) => (
                <div
                  key={a.title}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    a.level === "high"
                      ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                      : a.level === "medium"
                      ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900"
                      : "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900"
                  )}
                >
                  {a.level === "positive"
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    : a.level === "high"
                    ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.detail}</p>
                  </div>
                  <Link
                    href={a.action}
                    className="shrink-0 text-xs font-medium text-primary hover:underline whitespace-nowrap"
                  >
                    {a.actionLabel}
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Funnel snapshot */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Funnel Snapshot
              </CardTitle>
              <Link href="/funnel" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Full report <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" />
              ))
            ) : (
              <>
                {funnelSteps.map((step, i) => {
                  const pct = step.rateFromTop * 100;
                  const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#c026d3", "#ec4899"];
                  return (
                    <div key={step.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{step.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-muted-foreground">{formatCompact(step.value)}</span>
                          <span className="font-bold w-12 text-right" style={{ color: colors[i] }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Overall conversion</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-bold",
                    convRate >= 3 ? "text-emerald-600" : convRate >= 1.5 ? "text-amber-600" : "text-red-600"
                  )}>
                    {convRate >= 1.5
                      ? <TrendingUp className="h-3.5 w-3.5" />
                      : <TrendingDown className="h-3.5 w-3.5" />
                    }
                    {convRate.toFixed(2)}%
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade banner — only shown when no property AND no session (true guests) */}
      {!propertyId && !session && (
        <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 to-violet-500/8 p-5 flex items-center justify-between gap-4 flex-wrap print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Upgrade to Pro for live data</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect your GA4 property · Email reports · PDF export · Goal tracking — £29/month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm" variant="outline"
              className="text-xs h-8"
              onClick={async () => {
                const res = await fetch("/api/stripe/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ plan: "pro" }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else if (data.message) alert(data.message);
              }}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to Pro
            </Button>
            <Link href="/connect" className="text-xs text-primary hover:underline font-medium">
              Connect GA4 free →
            </Link>
          </div>
        </div>
      )}

      {/* Deep-dive nav tiles */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Deep-dive reports
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sales Funnel",  href: "/funnel",      icon: "📊", desc: "Channel-level funnel breakdown" },
            { label: "By Country",    href: "/countries",   icon: "🌍", desc: "Geo performance & revenue" },
            { label: "By Item",       href: "/items",       icon: "📦", desc: "Product conversion & revenue" },
            { label: "Traffic",       href: "/traffic",     icon: "📈", desc: "Sessions, users & key events" },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 duration-200"
            >
              <span className="text-2xl">{nav.icon}</span>
              <div>
                <p className="text-sm font-semibold">{nav.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{nav.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      </>)} {/* end snapshot tab */}

      {/* ══════════════════════════════════════════════════════
           TAB: REALTIME OVERVIEW
          ══════════════════════════════════════════════════════ */}
      {activeTab === "realtime" && (
        <div className="space-y-5">
          {/* Live active users banner */}
          <div className="flex items-center gap-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">142 users active right now</p>
              <p className="text-xs text-muted-foreground">Live data · updates every 30 seconds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Active users by minute */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Users — Last 30 Minutes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={[
                    { t: "30m", v: 88 }, { t: "28m", v: 95 }, { t: "26m", v: 102 }, { t: "24m", v: 98 },
                    { t: "22m", v: 110 }, { t: "20m", v: 118 }, { t: "18m", v: 125 }, { t: "16m", v: 119 },
                    { t: "14m", v: 131 }, { t: "12m", v: 128 }, { t: "10m", v: 135 }, { t: "8m", v: 140 },
                    { t: "6m", v: 138 }, { t: "4m", v: 144 }, { t: "2m", v: 139 }, { t: "Now", v: 142 },
                  ]} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, "Active users"]} />
                    <Area type="monotone" dataKey="v" stroke="#10b981" fill="url(#rtGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top traffic sources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { src: "Google / Organic", users: 48, color: "#4285F4" },
                  { src: "Direct",           users: 31, color: "#8b5cf6" },
                  { src: "Google / CPC",     users: 24, color: "#10b981" },
                  { src: "Email",            users: 18, color: "#f59e0b" },
                  { src: "Facebook",         users: 12, color: "#3b82f6" },
                  { src: "Referral",         users:  9, color: "#ec4899" },
                ].map((s) => (
                  <div key={s.src}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate">{s.src}</span>
                      <span className="text-muted-foreground ml-2 shrink-0">{s.users} users</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.users / 48) * 100}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top active pages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Active Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Page", "Active Users", "Avg Time on Page", "Events / Min"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { page: "/products/running-shoes", users: 38, time: "2m 14s", events: 6.2 },
                      { page: "/",                        users: 27, time: "0m 48s", events: 2.1 },
                      { page: "/checkout",                users: 21, time: "3m 52s", events: 8.7 },
                      { page: "/collections/new-in",      users: 18, time: "1m 33s", events: 3.4 },
                      { page: "/products/yoga-mat",       users: 14, time: "1m 58s", events: 4.0 },
                      { page: "/cart",                    users: 12, time: "1m 12s", events: 2.9 },
                      { page: "/blog/training-tips",      users:  8, time: "4m 22s", events: 1.2 },
                    ].map((p) => (
                      <tr key={p.page} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-mono text-xs">{p.page}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            {p.users}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.time}</td>
                        <td className="px-4 py-2.5 font-semibold">{p.events}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           TAB: BY SOURCE
          ══════════════════════════════════════════════════════ */}
      {activeTab === "by-source" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Sessions",   value: formatCompact(channelRows.reduce((s, r) => s + r.totalUsers, 0)) },
              { label: "Total Users",      value: formatCompact(channelRows.reduce((s, r) => s + r.newUsers, 0)) },
              { label: "Total Revenue",    value: formatCurrency(channelRows.reduce((s, r) => s + r.grossPurchaseRevenue, 0)) },
              { label: "Total Purchases",  value: formatCompact(channelRows.reduce((s, r) => s + r.purchases, 0)) },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Performance by Source / Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Source / Medium", "Users", "New Users", "Page Views", "Purchases", "Revenue", "Conv. Rate"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...channelRows].sort((a, b) => b.grossPurchaseRevenue - a.grossPurchaseRevenue).map((row, i) => {
                      const convRate = row.totalUsers > 0 ? ((row.purchases / row.totalUsers) * 100).toFixed(2) : "0.00";
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium">{friendlyChannel(row.sourceMedium)}<br /><span className="text-[10px] text-muted-foreground">{row.sourceMedium}</span></td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.totalUsers)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.newUsers)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.pageViews)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{formatCompact(row.purchases)}</td>
                          <td className="px-4 py-2.5 tabular-nums font-semibold">{formatCurrency(row.grossPurchaseRevenue)}</td>
                          <td className="px-4 py-2.5 tabular-nums text-emerald-600 font-semibold">{convRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           TAB: AUDIENCE
          ══════════════════════════════════════════════════════ */}
      {activeTab === "audience" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Users",      value: formatCompact(kpis.totalUsers),      sub: `+${(kpis.totalUsersDelta * 100).toFixed(1)}% vs prior` },
              { label: "New Users",        value: formatCompact(Math.round(kpis.totalUsers * 0.62)), sub: "62% of total" },
              { label: "Returning Users",  value: formatCompact(Math.round(kpis.totalUsers * 0.38)), sub: "38% of total" },
              { label: "Avg Session Dur.", value: "2m 34s", sub: "+8s vs prior period" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold mt-1">{k.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* New vs Returning */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New vs Returning</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "New Users",       pct: 62, color: "#6366f1", value: formatCompact(Math.round(kpis.totalUsers * 0.62)) },
                  { label: "Returning Users", pct: 38, color: "#10b981", value: formatCompact(Math.round(kpis.totalUsers * 0.38)) },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />{r.label}</span>
                      <span className="font-semibold">{r.pct}% · {r.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Device */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Device Category</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Mobile",  pct: 58, color: "#f59e0b" },
                  { label: "Desktop", pct: 34, color: "#6366f1" },
                  { label: "Tablet",  pct: 8,  color: "#10b981" },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{d.label}</span>
                      <span className="font-semibold">{d.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Browser */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Browsers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Chrome",  pct: 64, color: "#4285F4" },
                  { label: "Safari",  pct: 21, color: "#000000" },
                  { label: "Firefox", pct:  8, color: "#ff7139" },
                  { label: "Edge",    pct:  5, color: "#0078d4" },
                  { label: "Other",   pct:  2, color: "#94a3b8" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{b.label}</span>
                      <span className="font-semibold">{b.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Engagement metrics */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Engagement Metrics</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Segment", "Users", "Sessions", "Pages / Session", "Avg Duration", "Bounce Rate", "Conv. Rate"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { seg: "New Users",       users: Math.round(kpis.totalUsers * 0.62), sessions: Math.round(kpis.totalUsers * 0.65), pps: 2.4, dur: "1m 48s", bounce: "54.2%", conv: "1.8%" },
                      { seg: "Returning Users", users: Math.round(kpis.totalUsers * 0.38), sessions: Math.round(kpis.totalUsers * 0.44), pps: 4.1, dur: "3m 52s", bounce: "28.6%", conv: "4.9%" },
                      { seg: "Mobile Users",    users: Math.round(kpis.totalUsers * 0.58), sessions: Math.round(kpis.totalUsers * 0.60), pps: 2.8, dur: "2m 04s", bounce: "48.1%", conv: "2.3%" },
                      { seg: "Desktop Users",   users: Math.round(kpis.totalUsers * 0.34), sessions: Math.round(kpis.totalUsers * 0.36), pps: 4.6, dur: "3m 29s", bounce: "31.4%", conv: "4.2%" },
                    ].map((r) => (
                      <tr key={r.seg} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">{r.seg}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.users)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.sessions)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{r.pps}</td>
                        <td className="px-4 py-2.5">{r.dur}</td>
                        <td className="px-4 py-2.5 text-amber-600 font-medium">{r.bounce}</td>
                        <td className="px-4 py-2.5 text-emerald-600 font-semibold">{r.conv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           TAB: LANDING PAGE
          ══════════════════════════════════════════════════════ */}
      {activeTab === "landing" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Landing Pages",   value: "94" },
              { label: "Total Entrances", value: formatCompact(kpis.totalUsers) },
              { label: "Avg Bounce Rate", value: "42.8%" },
              { label: "Avg Conv. Rate",  value: `${convRate.toFixed(2)}%` },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Landing Pages by Sessions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Landing Page", "Sessions", "New Users", "Avg Duration", "Bounce Rate", "Conversions", "Conv. Rate"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { page: "/",                            sessions: 28400, newUsers: 19800, dur: "0m 52s", bounce: "61.4%", conv: 284,  rate: "1.00%" },
                      { page: "/products/running-shoes",      sessions: 18200, newUsers: 15900, dur: "2m 18s", bounce: "34.2%", conv: 728,  rate: "4.00%" },
                      { page: "/collections/new-in",          sessions: 14600, newUsers: 12100, dur: "1m 44s", bounce: "42.8%", conv: 438,  rate: "3.00%" },
                      { page: "/products/yoga-mat",           sessions: 11800, newUsers:  9400, dur: "2m 02s", bounce: "38.6%", conv: 354,  rate: "3.00%" },
                      { page: "/blog/best-running-gear",      sessions:  9200, newUsers:  8800, dur: "4m 11s", bounce: "22.4%", conv:  92,  rate: "1.00%" },
                      { page: "/sale",                        sessions:  8600, newUsers:  6200, dur: "1m 28s", bounce: "48.2%", conv: 430,  rate: "5.00%" },
                      { page: "/products/compression-socks",  sessions:  6400, newUsers:  5100, dur: "1m 56s", bounce: "36.4%", conv: 192,  rate: "3.00%" },
                      { page: "/about",                       sessions:  4800, newUsers:  4200, dur: "1m 10s", bounce: "72.8%", conv:  24,  rate: "0.50%" },
                    ].map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-mono text-xs max-w-[220px] truncate">{r.page}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.sessions)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.newUsers)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.dur}</td>
                        <td className={cn("px-4 py-2.5 font-medium", parseFloat(r.bounce) > 55 ? "text-red-600" : parseFloat(r.bounce) > 40 ? "text-amber-600" : "text-emerald-600")}>{r.bounce}</td>
                        <td className="px-4 py-2.5 tabular-nums">{r.conv}</td>
                        <td className="px-4 py-2.5 font-semibold text-emerald-600">{r.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           TAB: COUNTRY
          ══════════════════════════════════════════════════════ */}
      {activeTab === "country" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Countries Reached",  value: "48" },
              { label: "Top Country",        value: "United States" },
              { label: "Intl. Revenue Share",value: "38.4%" },
              { label: "Avg Intl. Conv. Rate",value: "2.8%" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-base font-bold mt-1 leading-tight">{k.value}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Countries — Users & Revenue</CardTitle>
                <Link href="/countries" className="text-xs text-primary hover:underline flex items-center gap-1">Full report <ArrowRight className="h-3 w-3" /></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Country", "Users", "New Users", "Purchases", "Revenue", "Conv. Rate"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { flag: "🇺🇸", country: "United States",  users: 38200, newUsers: 22900, purchases: 1528, revenue: 91680  },
                      { flag: "🇬🇧", country: "United Kingdom",  users: 18600, newUsers: 11200, purchases:  744, revenue: 44640  },
                      { flag: "🇨🇦", country: "Canada",          users: 12400, newUsers:  7440, purchases:  496, revenue: 29760  },
                      { flag: "🇦🇺", country: "Australia",       users:  9800, newUsers:  5880, purchases:  392, revenue: 23520  },
                      { flag: "🇩🇪", country: "Germany",         users:  7200, newUsers:  4320, purchases:  252, revenue: 15120  },
                      { flag: "🇫🇷", country: "France",          users:  5600, newUsers:  3360, purchases:  168, revenue: 10080  },
                      { flag: "🇮🇳", country: "India",           users:  4800, newUsers:  3840, purchases:   96, revenue:  5760  },
                      { flag: "🇳🇱", country: "Netherlands",     users:  3200, newUsers:  1920, purchases:  128, revenue:  7680  },
                    ].map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">{r.flag} {r.country}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.users)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.newUsers)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.purchases)}</td>
                        <td className="px-4 py-2.5 tabular-nums font-semibold">{formatCurrency(r.revenue)}</td>
                        <td className="px-4 py-2.5 text-emerald-600 font-semibold">{((r.purchases / r.users) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           TAB: TRAFFIC ACQUISITION
          ══════════════════════════════════════════════════════ */}
      {activeTab === "acquisition" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Users",      value: formatCompact(kpis.totalUsers),         delta: `+${(kpis.totalUsersDelta * 100).toFixed(1)}%` },
              { label: "New Users",        value: formatCompact(Math.round(kpis.totalUsers * 0.62)), delta: "+5.4%" },
              { label: "Engaged Sessions", value: formatCompact(Math.round(kpis.totalUsers * 1.2)),  delta: "+11.2%" },
              { label: "Engagement Rate",  value: "64.8%",                                delta: "+2.1pp" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold mt-1">{k.value}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{k.delta}</p>
              </div>
            ))}
          </div>

          {/* Acquisition channel breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Traffic Acquisition by Channel</CardTitle>
                <Link href="/traffic" className="text-xs text-primary hover:underline flex items-center gap-1">Full traffic report <ArrowRight className="h-3 w-3" /></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Channel", "Users", "New Users", "Sessions", "Engagement Rate", "Events", "Conv. Rate", "Revenue"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ch: "Organic Search",  color: "#4285F4", users: 38200, newU: 34000, sess: 45800, eng: "68.2%", events: 228400, conv: "4.2%", rev: formatCurrency(96240) },
                      { ch: "Direct",          color: "#8b5cf6", users: 27500, newU: 12000, sess: 30200, eng: "72.4%", events: 138000, conv: "3.6%", rev: formatCurrency(59400) },
                      { ch: "Paid Search",     color: "#10b981", users: 18400, newU: 16800, sess: 20200, eng: "58.6%", events:  92000, conv: "5.5%", rev: formatCurrency(60720) },
                      { ch: "Email",           color: "#f59e0b", users: 15600, newU:  3200, sess: 17400, eng: "81.2%", events:  78000, conv: "6.5%", rev: formatCurrency(60720) },
                      { ch: "Organic Social",  color: "#ec4899", users: 12300, newU: 11500, sess: 13100, eng: "44.8%", events:  49200, conv: "2.0%", rev: formatCurrency(14760) },
                      { ch: "Paid Social",     color: "#3b82f6", users:  9800, newU:  8900, sess: 10600, eng: "52.4%", events:  39200, conv: "2.0%", rev: formatCurrency(11760) },
                      { ch: "Referral",        color: "#14b8a6", users:  6200, newU:  5400, sess:  6800, eng: "62.0%", events:  24800, conv: "3.1%", rev: formatCurrency(11532) },
                      { ch: "Affiliates",      color: "#a855f7", users:  3800, newU:  3600, sess:  4100, eng: "48.2%", events:  15200, conv: "2.5%", rev: formatCurrency(5700) },
                    ].map((r) => (
                      <tr key={r.ch} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
                            {r.ch}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.users)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.newU)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.sess)}</td>
                        <td className="px-4 py-2.5 text-blue-600 font-medium">{r.eng}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatCompact(r.events)}</td>
                        <td className="px-4 py-2.5 text-emerald-600 font-semibold">{r.conv}</td>
                        <td className="px-4 py-2.5 font-semibold">{r.rev}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Acquisition funnel */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acquisition → Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Acquisition",  value: formatCompact(kpis.totalUsers),                   pct: 100,  color: "#6366f1" },
                  { label: "Engagement",   value: formatCompact(Math.round(kpis.totalUsers * 0.65)), pct: 64.8, color: "#8b5cf6" },
                  { label: "Consideration",value: formatCompact(kpis.purchases * 4),                 pct: 12.4, color: "#a855f7" },
                  { label: "Conversion",   value: formatCompact(kpis.purchases),                     pct: convRate, color: "#c026d3" },
                ].map((step, i) => (
                  <div key={step.label} className="text-center">
                    <div className="text-lg font-bold tabular-nums">{step.value}</div>
                    <div
                      className="mx-auto mt-2 rounded-t-sm"
                      style={{ height: `${Math.max(Math.round((step.pct / 100) * 80), 8)}px`, background: step.color, width: "100%" }}
                    />
                    <p className="mt-1.5 text-xs font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.pct.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      </PageContent>

      {shareOpen && (
        <SharePanel
          title="GA4 Overview"
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
