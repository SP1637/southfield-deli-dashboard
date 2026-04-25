import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompact, formatDelta, formatCurrency } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  delta: number;
  /** "currency" | "number" — controls display formatting */
  format?: "currency" | "number";
  comparisonLabel?: string;
  loading?: boolean;
}

export function KpiCard({
  label,
  value,
  delta,
  format = "number",
  comparisonLabel = "from previous period",
  loading,
}: KpiCardProps) {
  const positive = delta >= 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="mb-2 h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mb-2 text-2xl font-bold tabular-nums text-foreground">
          {format === "currency" ? formatCurrency(value) : formatCompact(value)}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}
        >
          {positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{formatDelta(delta)}</span>
          <span className="font-normal text-muted-foreground">{comparisonLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
