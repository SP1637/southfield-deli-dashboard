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
  CreditCard, Mail, Activity,
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
import { formatCompact, formatCurrency, toGA4DateString, cn } from "@/lib/utils";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { useGA4Funnel } from "@/hooks/use-ga4-funnel";
import {
  DEMO_FUNNEL_KPIS, DEMO_FUNNEL_TIMESERIES, DEMO_CHANNEL_ROWS,
  DEMO_FUNNEL_STEPS,
} from "@/lib/demo-data";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { AiMonitorBoard } from "@/components/dashboard/ai-monitor-board";

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
      <PageHeader title="Overview" />

      {/* Email toast */}
      {emailToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground text-background px-5 py-3 text-sm font-medium shadow-xl">
          {emailToast}
        </div>
      )}

      <PageContent>

      {/* ── AI Monitor Board ── */}
      <AiMonitorBoard
        userName={session?.user?.name ?? undefined}
        dayRange={7}
      />

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

      </PageContent>
    </>
  );
}
