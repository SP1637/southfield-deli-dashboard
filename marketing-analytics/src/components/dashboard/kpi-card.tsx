"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompact, formatDelta, formatCurrency } from "@/lib/utils";
import { Sparkline } from "./sparkline";

interface KpiCardProps {
  label: string;
  value: number;
  delta: number;
  format?: "currency" | "number";
  comparisonLabel?: string;
  loading?: boolean;
  sparkline?: number[];
  sparklineColor?: string;
  /** Optional sub-label e.g. "vs $6.1M spend" */
  subLabel?: string;
}

/** Animated counter that counts from 0 → target on mount */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * ease));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return val;
}

export function KpiCard({
  label,
  value,
  delta,
  format = "number",
  comparisonLabel = "vs prior period",
  loading,
  sparkline,
  sparklineColor = "#6366f1",
  subLabel,
}: KpiCardProps) {
  const animated = useCountUp(value);
  const positive = delta > 0;
  const neutral = delta === 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-3.5 w-24" />
          <Skeleton className="mb-2 h-8 w-28" />
          <Skeleton className="mb-3 h-3 w-36" />
          {sparkline && <Skeleton className="h-10 w-full" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
      <CardContent className="p-5">
        {/* Label */}
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </p>

        {/* Value */}
        <p className="mb-1 text-2xl font-bold tabular-nums text-foreground">
          {format === "currency"
            ? `$${formatCompact(animated)}`
            : formatCompact(animated)}
        </p>

        {/* Sub-label */}
        {subLabel && (
          <p className="mb-1 text-[11px] text-muted-foreground">{subLabel}</p>
        )}

        {/* Delta */}
        <div className={cn(
          "mb-3 flex items-center gap-1 text-xs font-medium",
          neutral
            ? "text-muted-foreground"
            : positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}>
          {neutral ? (
            <Minus className="h-3 w-3" />
          ) : positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{formatDelta(delta)}</span>
          <span className="font-normal text-muted-foreground">{comparisonLabel}</span>
        </div>

        {/* Sparkline */}
        {sparkline && sparkline.length > 1 && (
          <div className="-mx-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sparkline data={sparkline} color={sparklineColor} height={40} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
