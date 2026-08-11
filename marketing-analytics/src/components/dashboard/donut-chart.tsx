"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS, formatCompact, truncateSourceMedium } from "@/lib/utils";

interface DonutSlice {
  name: string;
  value: number;
}

interface DonutChartProps {
  title: string;
  data: DonutSlice[];
  loading?: boolean;
}

export function DonutChart({ title, data, loading }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
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
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(v: number, name: string) => [
                `${formatCompact(v)} (${((v / total) * 100).toFixed(1)}%)`,
                truncateSourceMedium(name),
              ]}
            />
            <Legend
              formatter={(value) => truncateSourceMedium(value, 20)}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
