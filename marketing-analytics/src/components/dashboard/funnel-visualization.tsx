"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompact, formatPercent } from "@/lib/utils";
import type { FunnelStep } from "@/types";

interface FunnelVisualizationProps {
  steps: FunnelStep[];
  loading?: boolean;
}

const STEP_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

export function FunnelVisualization({ steps, loading }: FunnelVisualizationProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1">
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton style={{ height: `${120 - i * 18}px` }} className="w-full" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = steps[0]?.value ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step bars with connecting arrows */}
        <div className="flex items-end gap-1">
          {steps.map((step, i) => {
            const heightPct = Math.max((step.value / maxValue) * 100, 5);
            return (
              <div key={step.name} className="flex flex-1 flex-col items-center gap-1">
                {/* Step value */}
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCompact(step.value)}
                </span>

                {/* Funnel bar */}
                <div className="relative flex w-full items-end justify-center">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-500",
                      STEP_COLORS[i]
                    )}
                    style={{ height: `${heightPct * 1.2}px`, minHeight: "12px" }}
                  />
                </div>

                {/* Step label */}
                <span className="text-center text-xs font-medium text-foreground leading-tight">
                  {step.name}
                </span>

                {/* Cumulative conversion from top */}
                <span className="text-xs text-muted-foreground">
                  {formatPercent(step.rateFromTop)}
                </span>

                {/* Step-to-step arrow + rate (between steps) */}
                {step.rateFromPrev !== null && i > 0 && (
                  <div className="absolute -left-6 bottom-[60px] hidden items-center gap-0.5 sm:flex">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      {formatPercent(step.rateFromPrev, 0)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step-to-step conversion row (desktop label row) */}
        <div className="mt-4 flex items-center justify-between">
          {steps.map((step, i) =>
            i < steps.length - 1 ? (
              <div key={`arrow-${i}`} className="flex flex-1 items-center justify-center gap-1 text-xs">
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                {step.rateFromPrev !== null && (
                  <span className="font-semibold text-foreground">
                    {formatPercent(steps[i + 1]?.rateFromPrev ?? 0)}
                  </span>
                )}
              </div>
            ) : null
          )}
        </div>

        {/* Absolute conversion labels */}
        <div className="mt-3 grid grid-cols-4 gap-2 border-t pt-3">
          {["Views → Cart", "Views → Checkout", "Views → Payment", "Views → Purchase"].map(
            (label, i) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">
                  {steps[i + 1] ? formatPercent(steps[i + 1].rateFromTop) : "—"}
                </p>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
