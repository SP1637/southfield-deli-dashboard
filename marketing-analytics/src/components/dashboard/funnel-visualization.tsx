"use client";

import { cn, formatCompact, formatPercent } from "@/lib/utils";
import type { FunnelStep } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelVisualizationProps {
  steps: FunnelStep[];
  loading?: boolean;
}

const STEP_COLORS = [
  { bar: "bg-indigo-500", light: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400" },
  { bar: "bg-violet-500", light: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400" },
  { bar: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400" },
  { bar: "bg-fuchsia-500", light: "bg-fuchsia-50 dark:bg-fuchsia-950/30", text: "text-fuchsia-600 dark:text-fuchsia-400" },
  { bar: "bg-pink-500", light: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-600 dark:text-pink-400" },
];

const BAR_MAX_H = 160; // px — height of the tallest bar (step 0)

export function FunnelVisualization({ steps, loading }: FunnelVisualizationProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="mb-6 h-4 w-16" />
        <div className="flex items-end gap-2">
          {[100, 60, 48, 38, 28].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton className="w-full" style={{ height: `${h}px` }} />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-12 w-full" />
      </div>
    );
  }

  if (!steps.length) return null;
  const topValue = steps[0].value || 1;

  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Funnel
      </p>

      {/* ── Bar columns + step-to-step arrows ───────────────────────────────── */}
      <div className="flex items-end">
        {steps.map((step, i) => {
          const barH = Math.max(Math.round((step.value / topValue) * BAR_MAX_H), 8);
          const color = STEP_COLORS[i] ?? STEP_COLORS[STEP_COLORS.length - 1];

          return (
            <div key={step.name} className="flex flex-1 items-end">
              {/* Column */}
              <div className="flex flex-1 flex-col items-center">
                {/* Value above bar */}
                <span className="mb-1.5 text-sm font-bold tabular-nums text-foreground">
                  {formatCompact(step.value)}
                </span>

                {/* Bar */}
                <div
                  className={cn("w-full rounded-t-sm transition-all duration-700", color.bar)}
                  style={{ height: `${barH}px` }}
                />

                {/* Step name */}
                <p className="mt-2 text-center text-xs font-medium text-foreground leading-tight px-1">
                  {step.name}
                </p>

                {/* Cumulative rate from top */}
                <p className={cn("mt-0.5 text-xs font-semibold", color.text)}>
                  {formatPercent(step.rateFromTop)}
                </p>
              </div>

              {/* Arrow + step-to-step rate (between columns) */}
              {i < steps.length - 1 && (
                <div className="flex w-8 shrink-0 flex-col items-center pb-[52px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {steps[i + 1].rateFromPrev !== null
                        ? formatPercent(steps[i + 1].rateFromPrev!, 2)
                        : ""}
                    </span>
                    <svg width="16" height="10" viewBox="0 0 16 10" className="text-muted-foreground/50">
                      <path d="M0 5 H12 M8 1 L14 5 L8 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Cumulative conversion summary row ───────────────────────────────── */}
      <div className="mt-5 grid grid-cols-4 gap-2 rounded-lg border bg-muted/40 p-3">
        {steps.slice(1).map((step) => (
          <div key={step.name} className="text-center">
            <p className="text-[10px] text-muted-foreground leading-tight">
              Views → {step.name.replace("Adds to ", "").replace("Payment Info", "Payment").replace("Purchases", "Purchase")}
            </p>
            <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
              {formatPercent(step.rateFromTop)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
