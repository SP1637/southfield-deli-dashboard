"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";

// ── Attribution data ──────────────────────────────────────────────────────────

type ModelKey = "last_click" | "first_click" | "linear" | "time_decay" | "data_driven";

const CHANNELS = [
  { name: "YouTube",      color: "#ef4444", emoji: "▶️" },
  { name: "Email",        color: "#10b981", emoji: "✉️" },
  { name: "Google",       color: "#4285F4", emoji: "🔍" },
  { name: "Direct",       color: "#8b5cf6", emoji: "🎯" },
  { name: "Bing",         color: "#f59e0b", emoji: "🔎" },
  { name: "OpenAI Ref.",  color: "#0ea5e9", emoji: "🤖" },
];

// Revenue attribution per model (sums to $25.5M)
const ATTRIBUTION: Record<ModelKey, number[]> = {
  last_click:  [6_200_000, 3_100_000, 4_200_000, 5_100_000, 3_900_000, 3_000_000],
  first_click: [7_800_000, 1_900_000, 3_600_000, 5_600_000, 3_500_000, 3_100_000],
  linear:      [5_000_000, 2_600_000, 2_500_000, 2_600_000, 2_600_000, 2_600_000],
  time_decay:  [6_800_000, 2_800_000, 3_900_000, 4_200_000, 4_000_000, 3_800_000],
  data_driven: [5_900_000, 3_400_000, 3_800_000, 4_400_000, 3_700_000, 4_300_000],
};

const TOTAL = 25_500_000;

const MODEL_INFO: Record<ModelKey, { label: string; description: string }> = {
  last_click:  { label: "Last Click",   description: "100% credit to the last touchpoint before conversion." },
  first_click: { label: "First Click",  description: "100% credit to the first touchpoint that introduced the user." },
  linear:      { label: "Linear",       description: "Equal credit split across all touchpoints in the journey." },
  time_decay:  { label: "Time Decay",   description: "More credit to touchpoints closer to the conversion." },
  data_driven: { label: "Data-Driven",  description: "ML-weighted credit based on actual conversion path patterns." },
};

// Conversion path data (simplified)
const PATHS = [
  { path: "YouTube → Email → Purchase",        conversions: 84_200, revenue: 2_520_000 },
  { path: "Google → Direct → Purchase",        conversions: 71_300, revenue: 2_139_000 },
  { path: "Direct → Purchase",                 conversions: 68_900, revenue: 2_067_000 },
  { path: "Email → Purchase",                  conversions: 62_100, revenue: 1_863_000 },
  { path: "YouTube → Direct → Purchase",       conversions: 58_400, revenue: 1_752_000 },
  { path: "Bing → Email → Purchase",           conversions: 47_200, revenue: 1_416_000 },
  { path: "OpenAI → Google → Purchase",        conversions: 41_800, revenue: 1_254_000 },
  { path: "Email → YouTube → Purchase",        conversions: 38_700, revenue: 1_161_000 },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function AttributionPage() {
  const [model, setModel] = useState<ModelKey>("data_driven");

  const revenues = ATTRIBUTION[model];
  const chartData = CHANNELS.map((ch, i) => ({
    name: ch.name,
    revenue: revenues[i],
    pct: parseFloat(((revenues[i] / TOTAL) * 100).toFixed(1)),
    color: ch.color,
  })).sort((a, b) => b.revenue - a.revenue);

  // Compare data_driven vs last_click delta
  const deltas = CHANNELS.map((ch, i) => ({
    name: ch.name,
    ddRevenue: ATTRIBUTION.data_driven[i],
    lcRevenue: ATTRIBUTION.last_click[i],
    delta: ATTRIBUTION.data_driven[i] - ATTRIBUTION.last_click[i],
    color: ch.color,
  }));

  // Multi-model comparison
  const comparison = CHANNELS.map((ch, i) => ({
    name: ch.name,
    last_click:  ATTRIBUTION.last_click[i],
    linear:      ATTRIBUTION.linear[i],
    data_driven: ATTRIBUTION.data_driven[i],
  }));

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Attribution Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Understand which channels truly drive conversions using multiple attribution models
        </p>
      </div>

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
        </p>
      </div>

      {/* Row 1: Revenue distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attributed Revenue — {MODEL_INFO[model].label}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            {chartData.map((d) => (
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
            ))}
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
          <p className="mt-3 text-xs text-muted-foreground">
            💡 <strong>Data-Driven</strong> redistributes credit away from Last Click, revealing that
            Email is undervalued by <strong>{formatCurrency(ATTRIBUTION.data_driven[1] - ATTRIBUTION.last_click[1])}</strong> compared to Last Click.
          </p>
        </CardContent>
      </Card>

      {/* Row 3: Budget recommendation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Budget Reallocation Opportunity
            </CardTitle>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Est. uplift: +$340K
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {["Channel", "Last-Click Revenue", "Data-Driven Revenue", "Difference", "Recommendation"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deltas.sort((a, b) => b.delta - a.delta).map((d) => (
                  <tr key={d.name} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{d.name}</td>
                    <td className="px-4 py-2.5 tabular-nums text-right">{formatCurrency(d.lcRevenue)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-right">{formatCurrency(d.ddRevenue)}</td>
                    <td className={cn(
                      "px-4 py-2.5 tabular-nums text-right font-semibold",
                      d.delta > 0 ? "text-emerald-600" : d.delta < 0 ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {d.delta > 0 ? "+" : ""}{formatCurrency(d.delta)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {d.delta > 500_000 ? "⬆️ Increase budget" :
                       d.delta > 0 ? "✅ Hold steady" :
                       d.delta < -500_000 ? "⬇️ Reduce budget" :
                       "➡️ Monitor"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Top conversion paths */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top Conversion Paths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PATHS.map((p, i) => (
              <div key={p.path} className="flex items-center gap-4 rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.path}</p>
                  <div className="mt-0.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(p.conversions / PATHS[0].conversions) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums">{formatCompact(p.conversions)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
