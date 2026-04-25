"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TimeSeriesChart, ChannelTimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Traffic } from "@/hooks/use-ga4-traffic";
import { toGA4DateString, formatCompact } from "@/lib/utils";

function WeeklyMonthlyCharts({ data }: { data: ReturnType<typeof useGA4Traffic>["data"] }) {
  const weekly = (data?.data.weekly ?? []).slice(-26).map((w) => ({
    label: `W${w.week.slice(4)}`,
    value: w.totalUsers,
  }));
  const monthly = (data?.data.monthly ?? []).map((m) => ({
    label: new Date(`${m.month.slice(0, 4)}-${m.month.slice(4)}-01`).toLocaleString("default", { month: "short", year: "2-digit" }),
    value: m.totalUsers,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Traffic — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={40} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
              <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Traffic — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={40} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
              <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrafficPage() {
  const [propertyId, setPropertyId] = useState(process.env.NEXT_PUBLIC_GA4_PROPERTY_ID ?? "");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 51)),
    endDate: toGA4DateString(new Date()),
    propertyId,
  });

  const { data, isLoading, isError, error, refetch } = useGA4Traffic({ ...filters, propertyId });
  const d = data?.data;

  // Daily time series splits users + keyEvents
  const dailyUsers = (d?.dailyTimeSeries ?? []).map((r) => ({ date: r.date, value: r.value }));
  const dailyKeyEvents = (d?.dailyTimeSeries ?? []).map((r) => ({ date: r.date, value: r.value2 ?? 0 }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Traffic Overview</h1>
          <p className="text-sm text-muted-foreground">Users, sessions, and key events over time</p>
        </div>
        <div className="flex items-center gap-2">
          <PropertySelector value={propertyId} onChange={(id) => { setPropertyId(id); setFilters((f) => ({ ...f, propertyId: id })); }} />
          <button onClick={() => refetch()} className="rounded-md border p-2 text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={(f) => setFilters({ ...f, propertyId })}
        show={["channelGroup", "deviceCategory"]}
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(error as Error)?.message ?? "Failed to load data"}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Users" value={d?.kpis.totalUsers ?? 0} delta={0} loading={isLoading} />
        <KpiCard label="New Users" value={d?.kpis.newUsers ?? 0} delta={0} loading={isLoading} />
        <KpiCard label="Sessions" value={d?.kpis.sessions ?? 0} delta={0} loading={isLoading} />
        <KpiCard label="Key Events" value={d?.kpis.keyEvents ?? 0} delta={0} loading={isLoading} />
      </div>

      {/* Daily charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeSeriesChart title="Daily Total Users" data={dailyUsers} color="#6366f1" loading={isLoading} />
        <TimeSeriesChart title="Daily Key Events" data={dailyKeyEvents} color="#f59e0b" loading={isLoading} />
      </div>

      {/* Traffic by channel */}
      <ChannelTimeSeriesChart
        title="Daily Traffic by Channel"
        data={d?.byChannel ?? []}
        loading={isLoading}
      />

      {/* Weekly / monthly bar charts */}
      <WeeklyMonthlyCharts data={data} />
    </div>
  );
}
