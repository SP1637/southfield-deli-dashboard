"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact } from "@/lib/utils";
import type { TimeSeriesRow, TrafficByChannelRow } from "@/types";
import { CHANNEL_COLORS } from "@/lib/utils";

// ─── Single-metric area chart ────────────────────────────────────────────────

interface TimeSeriesChartProps {
  title: string;
  data: TimeSeriesRow[];
  color?: string;
  metric?: "value" | "value2";
  loading?: boolean;
}

export function TimeSeriesChart({
  title,
  data,
  color = "#6366f1",
  loading,
}: TimeSeriesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-52 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => {
                const [, m, day] = d.split("-");
                return `${months[parseInt(m) - 1]} ${parseInt(day)}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompact(v)}
              width={44}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(v: number) => [formatCompact(v), title]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${color})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Multi-channel line chart ─────────────────────────────────────────────────

interface ChannelChartProps {
  title: string;
  data: TrafficByChannelRow[];
  channels?: string[];
  loading?: boolean;
}

const CHANNEL_KEYS = ["organicSearch", "email", "referral", "organicVideo", "direct"];
const CHANNEL_LABELS: Record<string, string> = {
  organicSearch: "Organic Search",
  email: "Email",
  referral: "Referral",
  organicVideo: "Organic Video",
  direct: "Direct",
};

export function ChannelTimeSeriesChart({ title, data, channels = CHANNEL_KEYS, loading }: ChannelChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-52 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => {
                const [, m, day] = d.split("-");
                return `${months[parseInt(m) - 1]} ${parseInt(day)}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompact(v)}
              width={44}
            />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, name: string) => [formatCompact(v), CHANNEL_LABELS[name] ?? name]} />
            <Legend
              formatter={(value) => CHANNEL_LABELS[value] ?? value}
              wrapperStyle={{ fontSize: 11 }}
            />
            {channels.map((ch) => (
              <Line
                key={ch}
                type="monotone"
                dataKey={ch}
                stroke={CHANNEL_COLORS[CHANNEL_LABELS[ch]] ?? "#94a3b8"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
