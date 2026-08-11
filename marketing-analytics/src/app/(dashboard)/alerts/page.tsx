"use client";

/**
 * Alerts page — AI-detected campaign issues + custom KPI threshold alerts.
 * Top section: AI smart alerts from detectIssues() with one-click fix actions.
 * Bottom section: user-defined KPI threshold alerts (localStorage).
 */

import { useState, useEffect } from "react";
import {
  Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle,
  TrendingUp, TrendingDown, Activity, Mail, Smartphone,
  CheckCircle2, X, Sparkles, Zap, ChevronDown, ChevronUp,
  ShieldAlert, TrendingDown as TrendDown, Rocket, Eye,
  BarChart2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { detectIssues, computeHealthScore, type AiIssue, type Severity } from "@/lib/ai-engine";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Alert {
  id: string;
  name: string;
  metric: string;
  condition: "above" | "below" | "change_pct";
  threshold: number;
  period: string;
  channels: ("email" | "in_app")[];
  active: boolean;
  lastTriggered?: string;
  createdAt: string;
}

const METRICS = [
  { value: "sessions",        label: "Sessions" },
  { value: "revenue",         label: "Revenue (£)" },
  { value: "conversions",     label: "Conversions" },
  { value: "conversion_rate", label: "Conversion Rate (%)" },
  { value: "bounce_rate",     label: "Bounce Rate (%)" },
  { value: "roas",            label: "ROAS (×)" },
  { value: "cac",             label: "CAC (£)" },
  { value: "cpc",             label: "CPC (£)" },
  { value: "impressions",     label: "Impressions" },
  { value: "ctr",             label: "CTR (%)" },
];

const CONDITIONS = [
  { value: "above",      label: "Goes above" },
  { value: "below",      label: "Falls below" },
  { value: "change_pct", label: "Changes by more than (%)" },
];

const PERIODS = [
  { value: "hourly",  label: "Hourly" },
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
];

const LS_KEY = "marketing-intelligence_alerts";

const defaultForm = {
  name: "",
  metric: "sessions",
  condition: "below" as Alert["condition"],
  threshold: "",
  period: "daily",
  channelEmail: false,
  channelInApp: true,
};

function loadAlerts(): Alert[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveAlerts(alerts: Alert[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(alerts)); } catch {}
}

// ── Severity helpers ──────────────────────────────────────────────────────────

function severityConfig(s: Severity) {
  switch (s) {
    case "critical":    return { label: "Critical",     color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",    icon: ShieldAlert,  badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" };
    case "warning":     return { label: "Warning",      color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", icon: AlertTriangle, badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" };
    case "opportunity": return { label: "Opportunity",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", icon: Rocket, badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" };
    case "info":        return { label: "Info",         color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",  icon: Eye,          badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" };
  }
}

// ── AI Issue Card ─────────────────────────────────────────────────────────────

function AiIssueCard({ issue, onAck, onResolve }: {
  issue: AiIssue;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fixing, setFix]        = useState(false);
  const cfg = severityConfig(issue.severity);
  const SeverityIcon = cfg.icon;

  function handleFix() {
    setFix(true);
    setTimeout(() => {
      setFix(false);
      onResolve(issue.id);
    }, 1800);
  }

  return (
    <div className={cn("rounded-xl border p-4 transition-all", cfg.bg, issue.status === "resolved" && "opacity-50")}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("shrink-0 rounded-lg p-2 border mt-0.5", cfg.bg)}>
          <SeverityIcon className={cn("h-4 w-4", cfg.color)} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.badge)}>
              {cfg.label}
            </span>
            {issue.platform && (
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {issue.platform.replace("_", " ")}
              </span>
            )}
            {issue.status !== "new" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                {issue.status}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{issue.title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{issue.description}</p>

          {/* Impact line */}
          <p className={cn("text-xs font-medium mt-1.5", cfg.color)}>
            💰 {issue.impact}
          </p>

          {/* Expanded fix detail */}
          {expanded && (
            <div className="mt-3 rounded-lg border bg-background/60 p-3 text-xs text-foreground leading-relaxed whitespace-pre-line">
              <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">AI-Recommended Fix</p>
              {issue.fix}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      {issue.status !== "resolved" && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs px-3"
            onClick={handleFix}
            disabled={fixing}
          >
            {fixing ? (
              <><RefreshCw className="h-3 w-3 animate-spin" /> Applying fix…</>
            ) : (
              <><Zap className="h-3 w-3" /> {issue.fixTitle}</>
            )}
          </Button>
          {issue.status === "new" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs px-3"
              onClick={() => onAck(issue.id)}
            >
              <Eye className="h-3 w-3" />
              Acknowledge
            </Button>
          )}
          <button
            onClick={() => onResolve(issue.id)}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Mark resolved
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  // ── AI Issues ────────────────────────────────────────────────────────────────
  const [aiIssues, setAiIssues] = useState<AiIssue[]>([]);
  const [issueFilter, setFilter] = useState<"all" | "critical" | "opportunity" | "warning">("all");
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    setAiIssues(detectIssues());
  }, []);

  function ackIssue(id: string) {
    setAiIssues(prev => prev.map(i => i.id === id ? { ...i, status: "acknowledged" as const } : i));
  }
  function resolveIssue(id: string) {
    setAiIssues(prev => prev.map(i => i.id === id ? { ...i, status: "resolved" as const } : i));
  }

  const health = computeHealthScore();

  const filteredIssues = aiIssues.filter(i => {
    if (!showResolved && i.status === "resolved") return false;
    if (issueFilter !== "all" && i.severity !== issueFilter) return false;
    return true;
  });

  const criticalCount    = aiIssues.filter(i => i.severity === "critical" && i.status !== "resolved").length;
  const opportunityCount = aiIssues.filter(i => i.severity === "opportunity" && i.status !== "resolved").length;
  const warningCount     = aiIssues.filter(i => i.severity === "warning" && i.status !== "resolved").length;

  // ── Custom Alerts ─────────────────────────────────────────────────────────────
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [ready, setReady]       = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(defaultForm);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setAlerts(loadAlerts());
    setReady(true);
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function updateForm(key: keyof typeof defaultForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function persist(updated: Alert[]) {
    saveAlerts(updated);
    setAlerts(updated);
  }

  function createAlert() {
    if (!form.name || !form.threshold) return;
    setSaving(true);
    const channels: Alert["channels"] = [];
    if (form.channelInApp) channels.push("in_app");
    if (form.channelEmail) channels.push("email");
    const newAlert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: form.name,
      metric: form.metric,
      condition: form.condition,
      threshold: Number(form.threshold),
      period: form.period,
      channels,
      active: true,
      createdAt: new Date().toISOString(),
    };
    persist([...alerts, newAlert]);
    fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAlert) }).catch(() => {});
    setForm(defaultForm);
    setShowForm(false);
    setSaving(false);
    showToast("Alert created!", true);
  }

  function toggleAlert(alert: Alert) {
    persist(alerts.map(a => a.id === alert.id ? { ...a, active: !a.active } : a));
  }

  function deleteAlert(id: string) {
    persist(alerts.filter(a => a.id !== id));
    fetch(`/api/alerts?id=${id}`, { method: "DELETE" }).catch(() => {});
    showToast("Alert deleted", true);
  }

  const metricLabel = (v: string) => METRICS.find(m => m.value === v)?.label ?? v;
  const condLabel   = (v: string) => CONDITIONS.find(c => c.value === v)?.label ?? v;

  return (
    <>
      <PageHeader title="Alerts & AI Issues" />

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg",
          toast.ok ? "bg-green-600" : "bg-red-600"
        )}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <PageContent>

        {/* ── AI Smart Alerts section ────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Smart Alerts</p>
                <p className="text-xs text-muted-foreground">Auto-detected issues across all campaigns</p>
              </div>
            </div>

            {/* Health score pill */}
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium bg-card">
              <div className="h-2 w-2 rounded-full" style={{ background: health.color }} />
              <span>Portfolio Health: </span>
              <span className="font-bold" style={{ color: health.color }}>{health.score}/100 · {health.label}</span>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            {[
              { label: "Critical",     count: criticalCount,    color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",     filter: "critical" as const },
              { label: "Warnings",     count: warningCount,     color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800", filter: "warning" as const },
              { label: "Opportunities",count: opportunityCount, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800", filter: "opportunity" as const },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setFilter(issueFilter === s.filter ? "all" : s.filter)}
                className={cn(
                  "rounded-xl border p-3 text-center transition-all hover:shadow-sm cursor-pointer",
                  s.bg,
                  issueFilter === s.filter && "ring-2 ring-primary ring-offset-1"
                )}
              >
                <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.count}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "critical", "warning", "opportunity"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
                  issueFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "all" ? "All Issues" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setShowResolved(!showResolved)}
              className={cn(
                "ml-auto rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
                showResolved ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {showResolved ? "Hide resolved" : "Show resolved"}
            </button>
          </div>

          {/* Issue cards */}
          {filteredIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">No issues in this category</p>
              <p className="text-xs text-muted-foreground mt-1">
                {issueFilter === "all" ? "All AI-detected issues have been resolved!" : `No ${issueFilter} issues active.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredIssues.map(issue => (
                <AiIssueCard
                  key={issue.id}
                  issue={issue}
                  onAck={ackIssue}
                  onResolve={resolveIssue}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────────── */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground font-medium">
              Custom KPI Alerts
            </span>
          </div>
        </div>

        {/* ── Custom KPI Alerts ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Your Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when specific metrics cross thresholds</p>
            </div>
            <Button className="gap-2 shrink-0" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Alert
            </Button>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Create Alert</p>
                <button onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Alert Name</label>
                <input
                  value={form.name}
                  onChange={e => updateForm("name", e.target.value)}
                  placeholder="e.g. Low conversion rate warning"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Metric</label>
                  <select value={form.metric} onChange={e => updateForm("metric", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Condition</label>
                  <select value={form.condition} onChange={e => updateForm("condition", e.target.value as Alert["condition"])}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Threshold value</label>
                  <input type="number" value={form.threshold} onChange={e => updateForm("threshold", e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Check Frequency</label>
                  <select value={form.period} onChange={e => updateForm("period", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notify via</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.channelInApp} onChange={e => updateForm("channelInApp", e.target.checked)} className="h-4 w-4 rounded" />
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />In-app
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.channelEmail} onChange={e => updateForm("channelEmail", e.target.checked)} className="h-4 w-4 rounded" />
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />Email
                    </label>
                  </div>
                </div>
              </div>
              {form.name && form.threshold && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                  <strong>Preview:</strong> Notify when <strong>{metricLabel(form.metric)}</strong>{" "}
                  {condLabel(form.condition).toLowerCase()} <strong>{form.threshold}</strong> — checked {form.period}.
                </div>
              )}
              <Button className="gap-2" onClick={createAlert} disabled={saving || !form.name || !form.threshold}>
                <Bell className="h-4 w-4" />
                {saving ? "Saving…" : "Create Alert"}
              </Button>
            </div>
          )}

          {!ready ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="rounded-xl border bg-card p-5 animate-pulse h-20" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No custom alerts yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Create threshold-based alerts for your KPIs</p>
              <Button variant="outline" className="gap-2" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />Create Alert
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map(alert => {
                const CondIcon = alert.condition === "above" ? TrendingUp
                  : alert.condition === "below" ? TrendingDown : Activity;
                return (
                  <div key={alert.id} className={cn("rounded-xl border bg-card p-4 flex items-start gap-4 transition-opacity", !alert.active && "opacity-60")}>
                    <div className={cn("shrink-0 rounded-lg p-2.5 border", alert.active
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                      : "bg-muted/40 border-muted text-muted-foreground")}>
                      <CondIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{alert.name}</p>
                        <Badge variant="outline" className={cn("text-[10px]", alert.active
                          ? "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
                          : "text-muted-foreground")}>
                          {alert.active ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">{alert.period}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Trigger when <strong className="text-foreground">{metricLabel(alert.metric)}</strong>{" "}
                        {condLabel(alert.condition).toLowerCase()}{" "}
                        <strong className="text-foreground">{alert.threshold}</strong>
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        {alert.channels.map(ch => (
                          <span key={ch} className="flex items-center gap-1">
                            {ch === "email" ? <Mail className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                            {ch === "email" ? "Email" : "In-app"}
                          </span>
                        ))}
                        {alert.lastTriggered && (
                          <span className="text-amber-600 dark:text-amber-400">
                            Last triggered {new Date(alert.lastTriggered).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <button onClick={() => toggleAlert(alert)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground" title={alert.active ? "Pause" : "Resume"}>
                        {alert.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <button onClick={() => deleteAlert(alert.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground">Pro tip:</strong> Set a{" "}
            <em>ROAS below 2×</em> alert to catch declining campaigns early.
            Combined with AI Smart Alerts above, you&apos;ll always know exactly where budget is being wasted.
          </span>
        </div>

      </PageContent>
    </>
  );
}
