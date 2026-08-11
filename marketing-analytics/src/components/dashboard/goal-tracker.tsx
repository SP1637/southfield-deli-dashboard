"use client";

import { useState, useEffect } from "react";
import { Target, Pencil, Check, X, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCompact, cn } from "@/lib/utils";

const STORAGE_KEY    = "dashboard_goals";
const TEMPLATE_KEY   = "kpi_template";

interface Goals {
  revenue: number;
  users: number;
  roas: number;
}

const DEFAULT_GOALS: Goals = { revenue: 30_000_000, users: 1_500_000, roas: 5 };

/** Parse a human-readable target string like "£50,000/mo", "4×", "3.5%" → number */
function parseTargetNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[£$,×x%\/a-z\s]/gi, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Try to extract goals from a stored KPI template */
function goalsFromTemplate(): Partial<Goals> | null {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as { metrics?: { name: string; target?: string }[] };
    if (!Array.isArray(t.metrics)) return null;
    const find = (keywords: string[]) =>
      t.metrics!.find((m) => keywords.some((k) => m.name.toLowerCase().includes(k)));
    const revenueMetric = find(["revenue", "mrr", "arr"]);
    const roasMetric    = find(["roas", "return on ad"]);
    const userMetric    = find(["user", "subscriber", "contact"]);
    const result: Partial<Goals> = {};
    const rv = parseTargetNumber(revenueMetric?.target);
    const ro = parseTargetNumber(roasMetric?.target);
    const us = parseTargetNumber(userMetric?.target);
    // Convert monthly £50,000 → 50_000; already absolute otherwise
    if (rv) result.revenue = rv;
    if (ro) result.roas    = ro;
    if (us) result.users   = us;
    return Object.keys(result).length ? result : null;
  } catch {
    return null;
  }
}

interface GoalTrackerProps {
  actual: {
    revenue: number;
    users: number;
    roas: number;
  };
}

function GoalBar({ label, actual, target, format }: {
  label: string;
  actual: number;
  target: number;
  format: "currency" | "number" | "roas";
}) {
  const pct = Math.min((actual / target) * 100, 100);
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-primary" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const fmt = (v: number) =>
    format === "currency" ? formatCurrency(v) : format === "roas" ? `${v.toFixed(1)}x` : formatCompact(v);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {fmt(actual)} <span className="text-muted-foreground/50">/ {fmt(target)}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cn("text-[10px] font-semibold", pct >= 100 ? "text-emerald-600" : "text-muted-foreground")}>
        {pct >= 100 ? "✓ Goal reached!" : `${pct.toFixed(0)}% of target`}
      </p>
    </div>
  );
}

export function GoalTracker({ actual }: GoalTrackerProps) {
  const [goals, setGoals]           = useState<Goals>(DEFAULT_GOALS);
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState<Goals>(DEFAULT_GOALS);
  const [fromTemplate, setFromTemplate] = useState(false);

  useEffect(() => {
    try {
      // 1. User's manually-saved goals take priority
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Goals;
        setGoals(parsed);
        setDraft(parsed);
        return;
      }
      // 2. Fall back to targets from the applied KPI template
      const tplGoals = goalsFromTemplate();
      if (tplGoals) {
        const merged: Goals = { ...DEFAULT_GOALS, ...tplGoals };
        setGoals(merged);
        setDraft(merged);
        setFromTemplate(true);
      }
    } catch {}
  }, []);

  function startEdit() {
    setDraft({ ...goals });
    setEditing(true);
  }

  function saveEdit() {
    setGoals(draft);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {}
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            Goals &amp; Targets
            {fromTemplate && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary normal-case tracking-normal">
                <Layers className="h-2.5 w-2.5" />
                from template
              </span>
            )}
          </CardTitle>
          {editing ? (
            <div className="flex items-center gap-1">
              <button onClick={saveEdit} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={startEdit} className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors" title="Edit targets">
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Set your period targets:</p>
            {([
              { key: "revenue" as const, label: "Revenue target (£)", placeholder: "30000000" },
              { key: "users" as const, label: "Users target", placeholder: "1500000" },
              { key: "roas" as const, label: "ROAS target (x)", placeholder: "5" },
            ]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <input
                  type="number"
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: parseFloat(e.target.value) || 0 })}
                  placeholder={placeholder}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <GoalBar label="Revenue" actual={actual.revenue} target={goals.revenue} format="currency" />
            <GoalBar label="Total Users" actual={actual.users} target={goals.users} format="number" />
            <GoalBar label="ROAS" actual={actual.roas} target={goals.roas} format="roas" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
