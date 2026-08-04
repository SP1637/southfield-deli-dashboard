"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, ExternalLink, AlertCircle } from "lucide-react";
import {
  DEMO_FUNNEL_KPIS, DEMO_FUNNEL_STEPS, DEMO_FUNNEL_TIMESERIES,
} from "@/lib/demo-data";
import { formatCurrency, formatCompact } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface SharePayload {
  propertyId: string;
  createdBy: string;
  exp: number;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [payload, setPayload] = useState<SharePayload | null>(null);

  useEffect(() => {
    fetch(`/api/share?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setPayload(d.payload);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Verifying link…</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Link expired or invalid</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This shared dashboard link has expired or is invalid. Ask the owner to generate a new one.
          </p>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Back to Nexoryx One
          </Link>
        </div>
      </div>
    );
  }

  // Show read-only dashboard snapshot
  const kpis = DEMO_FUNNEL_KPIS;
  const chartData = DEMO_FUNNEL_TIMESERIES.slice(-21).map((r) => ({
    date: r.date.slice(5),
    revenue: Math.round(r.value * 425),
  }));

  const AD_SPEND_EST = 6_071_429;
  const ROAS = kpis.grossPurchaseRevenue / AD_SPEND_EST;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">Nexoryx One</span>
            <span className="ml-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Read-only
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              Shared by {payload?.createdBy}
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Get your own
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Marketing Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Shared dashboard snapshot · Expires {payload?.exp ? new Date(payload.exp * 1000).toLocaleDateString() : "—"}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Gross Revenue", value: formatCurrency(kpis.grossPurchaseRevenue), delta: "+12.3%" },
            { label: "ROAS", value: `${ROAS.toFixed(1)}x`, delta: "+3.1%" },
            { label: "Total Users", value: formatCompact(kpis.totalUsers), delta: "+8.4%" },
            { label: "Purchases", value: formatCompact(kpis.purchases), delta: "+21.2%" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
              <p className="mt-1.5 text-xl font-bold">{k.value}</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-600">{k.delta} vs prior</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue — Last 21 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#sg)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sales Funnel</p>
          <div className="space-y-3">
            {DEMO_FUNNEL_STEPS.map((step, i) => {
              const pct = step.rateFromTop * 100;
              const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#c026d3", "#ec4899"];
              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{step.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-muted-foreground">{formatCompact(step.value)}</span>
                      <span className="font-bold w-12 text-right" style={{ color: colors[i] }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold">Want this dashboard for your own data?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connect your GA4 property and get live analytics in 2 minutes.</p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free →
          </Link>
        </div>
      </main>
    </div>
  );
}

