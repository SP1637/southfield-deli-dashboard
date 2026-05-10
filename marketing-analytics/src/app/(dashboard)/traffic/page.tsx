"use client";

import { useState } from "react";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TimeSeriesChart, ChannelTimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Traffic } from "@/hooks/use-ga4-traffic";
import { toGA4DateString, formatCompact } from "@/lib/utils";
import {
  DEMO_TRAFFIC_KPIS, DEMO_TRAFFIC_DAILY,
  DEMO_TRAFFIC_BY_CHANNEL, DEMO_WEEKLY, DEMO_MONTHLY,
} from "@/lib/demo-data";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

export default function TrafficPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useGA4Property();
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 51)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Traffic({ ...filters, propertyId });
  const kpis       = ga4.data?.data.kpis            ?? DEMO_TRAFFIC_KPIS;
  const daily      = ga4.data?.data.dailyTimeSeries  ?? DEMO_TRAFFIC_DAILY;
  const byChannel  = ga4.data?.data.byChannel        ?? DEMO_TRAFFIC_BY_CHANNEL;
  const weekly     = ga4.data?.data.weekly           ?? DEMO_WEEKLY;
  const monthly    = ga4.data?.data.monthly          ?? DEMO_MONTHLY;
  const loading    = ga4.isLoading && !!session;

  const dailyUsers     = daily.map((r) => ({ date: r.date, value: r.value }));
  const dailyKeyEvents = daily.map((r) => ({ date: r.date, value: r.value2 ?? 0 }));

  const weeklyChartData = weekly.map((w) => ({ label: w.week, value: w.totalUsers }));
  const monthlyChartData = monthly.map((m) => ({
    label: typeof m.month === "string" && m.month.length === 6
      ? new Date(`${m.month.slice(0, 4)}-${m.month.slice(4)}-01`).toLocaleString("default", { month: "short", year: "2-digit" })
      : m.month,
    value: m.totalUsers,
  }));

  return (
    <>
      <PageHeader title="Traffic Overview" />
      <PageContent>

      <FilterBar filters={filters} onChange={setFilters} show={["channelGroup", "deviceCategory"]} />

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Users" value={kpis.totalUsers} delta={0.12}  loading={loading} />
        <KpiCard label="New Users"   value={kpis.newUsers}   delta={0.08}  loading={loading} />
        <KpiCard label="Sessions"    value={kpis.sessions}   delta={0.15}  loading={loading} />
        <KpiCard label="Key Events"  value={kpis.keyEvents}  delta={0.21}  loading={loading} />
      </div>

      {/* Recent Traffic section */}
      <div>
        <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Traffic</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TimeSeriesChart title="Recent Daily Traffic — Total Users"    data={dailyUsers}     color="#6366f1" loading={loading} />
          <TimeSeriesChart title="Recent Daily Key Events — Key Events"  data={dailyKeyEvents} color="#f59e0b" loading={loading} />
        </div>
      </div>

      {/* By channel */}
      <ChannelTimeSeriesChart title="Recent Daily Traffic by Channels" data={byChannel} loading={loading} />

      {/* Weekly + Monthly */}
      <div>
        <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Weekly and Monthly Traffic</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Weekly Traffic — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
                  <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Monthly Traffic — Last 12 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [formatCompact(v), "Users"]} />
                  <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      </PageContent>
    </>
  );
}
