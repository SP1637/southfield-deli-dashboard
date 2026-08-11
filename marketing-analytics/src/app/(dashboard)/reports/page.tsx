"use client";

/**
 * AI Reports — One-click campaign intelligence reports powered by the local AI engine.
 * Uses generateAiReport() from ai-engine to produce full narrative reports
 * from the campaign dataset — no API key required.
 */

import { useState } from "react";
import {
  FileText, Sparkles, RefreshCw, Download, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Zap, Clock, CheckCircle2,
  AlertTriangle, Target, BarChart2, ArrowRight, Copy,
  BadgeCheck, Share2, Mail, CalendarClock, Link2, X,
  Send, Calendar, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { generateAiReport, computeHealthScore, type AiReport } from "@/lib/ai-engine";
import { CAMPAIGNS } from "@/lib/campaign-data";

// ── Share Panel ───────────────────────────────────────────────────────────────

function SharePanel({ report, onClose, onPrint, onCopy }: {
  report: AiReport | null;
  onClose: () => void;
  onPrint: () => void;
  onCopy: () => void;
}) {
  const [view, setView]         = useState<"menu" | "email" | "schedule">("menu");
  const [email, setEmail]       = useState("");
  const [schedFreq, setSchedFreq] = useState("weekly");
  const [schedDay, setSchedDay]   = useState("Monday");
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [schedSaved, setSchedSaved] = useState(false);

  function handleShareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function handleSendEmail() {
    if (!email.trim()) return;
    setEmailSent(true);
    setTimeout(() => { setEmailSent(false); setView("menu"); setEmail(""); }, 1800);
  }

  function handleSaveSchedule() {
    setSchedSaved(true);
    setTimeout(() => { setSchedSaved(false); setView("menu"); }, 1800);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-card border-l shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            {view !== "menu" && (
              <button onClick={() => setView("menu")} className="text-muted-foreground hover:text-foreground mr-1">
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            )}
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">
              {view === "menu" ? "Share this report" : view === "email" ? "Send Email" : "Schedule Email"}
            </span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu view */}
        {view === "menu" && (
          <div className="flex-1 p-3 space-y-1">
            {[
              { icon: Mail,         label: "Send Email",      sub: "Email this report to your team",    action: () => setView("email")    },
              { icon: CalendarClock,label: "Schedule Email",  sub: "Auto-send on a recurring schedule", action: () => setView("schedule") },
              { icon: Link2,        label: "Share Link",      sub: linkCopied ? "Link copied!" : "Copy a shareable link to this page", action: handleShareLink },
              { icon: Download,     label: "Download File",   sub: "Export as PDF to your device",      action: onPrint },
            ].map(({ icon: Icon, label, sub, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left hover:bg-muted/60 transition-colors group border border-transparent hover:border-border"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Icon className={cn("h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors", label === "Share Link" && linkCopied && "text-emerald-600")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className={cn("text-xs text-muted-foreground mt-0.5", label === "Share Link" && linkCopied && "text-emerald-600 font-medium")}>{sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Send Email view */}
        {view === "email" && (
          <div className="flex-1 p-5 space-y-4">
            <p className="text-xs text-muted-foreground">Send the current report to one or more email addresses.</p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipient email(s)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. team@company.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">Separate multiple addresses with commas</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-semibold">What's included:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Executive summary &amp; health score</li>
                <li>• Platform performance breakdown</li>
                <li>• Top wins &amp; critical issues</li>
                <li>• AI recommendations &amp; next steps</li>
              </ul>
            </div>
            <button
              onClick={handleSendEmail}
              disabled={!email.trim() || emailSent}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                emailSent ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {emailSent ? <><CheckCircle2 className="h-4 w-4" /> Sent!</> : <><Send className="h-4 w-4" /> Send Report</>}
            </button>
          </div>
        )}

        {/* Schedule Email view */}
        {view === "schedule" && (
          <div className="flex-1 p-5 space-y-4">
            <p className="text-xs text-muted-foreground">Automatically send this report to your team on a recurring schedule.</p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipient email(s)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. team@company.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Frequency</label>
                <select value={schedFreq} onChange={e => setSchedFreq(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Send on</label>
                <select value={schedDay} onChange={e => setSchedDay(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
              <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {schedFreq === "daily" ? "Every day" : schedFreq === "weekly" ? `Every ${schedDay}` : `1st of every month`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Report will be generated &amp; sent automatically</p>
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={!email.trim() || schedSaved}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                schedSaved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {schedSaved ? <><CheckCircle2 className="h-4 w-4" /> Schedule saved!</> : <><Calendar className="h-4 w-4" /> Save Schedule</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function RichBody({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => {
        // Bullet list items
        if (para.startsWith("•")) {
          const items = para.split("\n").filter(Boolean);
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {items.map((item, j) => {
                const content = item.replace(/^•\s*/, "");
                const parts = content.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span>
                      {parts.map((p, k) =>
                        p.startsWith("**") && p.endsWith("**")
                          ? <strong key={k} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>
                          : p
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered items
        if (/^\d+\./.test(para)) {
          const items = para.split("\n").filter(Boolean);
          return (
            <ol key={i} className="space-y-1.5 pl-1">
              {items.map((item, j) => {
                const content = item.replace(/^\d+\.\s*/, "");
                const parts = content.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{j + 1}</span>
                    <span className="mt-0.5">
                      {parts.map((p, k) =>
                        p.startsWith("**") && p.endsWith("**")
                          ? <strong key={k} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>
                          : p
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph with **bold**
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {parts.map((p, k) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={k} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

// ── Report period options ─────────────────────────────────────────────────────

const PERIODS = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This quarter",
  "Last 6 months",
];

// ── Health score ring ─────────────────────────────────────────────────────────

function HealthRing({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={6} />
        <circle cx={36} cy={36} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute text-center">
        <p className="text-base font-bold tabular-nums" style={{ color }}>{score}</p>
        <p className="text-[9px] text-muted-foreground leading-none">/100</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod]           = useState("Last 30 days");
  const [loading, setLoading]         = useState(false);
  const [report, setReport]           = useState<AiReport | null>(null);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [copied, setCopied]           = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);

  const health = computeHealthScore();

  function handleGenerate() {
    setLoading(true);
    setReport(null);
    setOpenSection(null);

    // Simulate slight delay for effect, then generate from engine
    setTimeout(() => {
      const r = generateAiReport(period);
      setReport(r);
      setOpenSection(0);
      setLoading(false);
    }, 900);
  }

  function handleCopy() {
    if (!report) return;
    const text = [
      `# ${report.title}`,
      `Period: ${report.period}`,
      `Generated: ${report.generatedAt.toLocaleString()}`,
      `Health Score: ${report.healthScore}/100`,
      "",
      "## Executive Summary",
      report.executiveSummary.replace(/\*\*/g, ""),
      "",
      ...report.sections.map(s => [`## ${s.emoji} ${s.heading}`, s.body.replace(/\*\*/g, ""), ""].join("\n")),
      "## Top Wins",
      ...report.topWins.map(w => `• ${w}`),
      "",
      "## Critical Issues",
      ...report.criticalIssues.map(i => `• ${i}`),
      "",
      "## Next Steps",
      ...report.nextSteps.map(s => `• ${s}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function printReport() { window.print(); }

  return (
    <>
      <PageHeader title="AI Reports" />
      <PageContent>

        {/* ── Report Builder Panel ──────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Generate Campaign Intelligence Report
              </p>
              <p className="text-xs text-muted-foreground">
                AI analyses all {CAMPAIGNS.length} campaigns across 6 platforms and writes a full narrative report with recommendations.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Period</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* Health score preview */}
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ background: health.color }} />
                <span className="text-muted-foreground">Portfolio Health:</span>
                <span className="font-bold" style={{ color: health.color }}>{health.score}/100 · {health.label}</span>
              </div>
            </div>
          </div>
          <Button className="gap-2 shrink-0" onClick={handleGenerate} disabled={loading}>
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Sparkles className="h-4 w-4" /> Generate Report</>
            }
          </Button>
        </div>

        {/* ── Loading state ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="rounded-xl border bg-card p-10 text-center space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Analysing {CAMPAIGNS.length} campaigns across 6 platforms…</p>
            <p className="text-xs text-muted-foreground">Generating executive summary, platform breakdowns, and budget reallocation plan</p>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!report && !loading && (
          <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No report generated yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Click Generate Report above to create a full campaign intelligence report</p>
            <Button variant="outline" className="gap-2" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4" />Generate Now
            </Button>
          </div>
        )}

        {/* ── Generated report ──────────────────────────────────────────────── */}
        {report && (
          <div className="space-y-4">

            {/* Report meta bar */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-base">{report.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Period: <strong>{report.period}</strong> · Generated {report.generatedAt.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Sparkles className="h-3 w-3 text-violet-500" />AI-written
                  </Badge>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                    {copied ? <><BadgeCheck className="h-3 w-3 text-green-500" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={printReport}>
                    <Download className="h-3 w-3" />Export PDF
                  </Button>
                  <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShareOpen(true)}>
                    <Share2 className="h-3 w-3" />Share
                  </Button>
                </div>
              </div>

              {/* KPI strip */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Sections",  value: `${report.sections.length} sections`, icon: FileText },
                  { label: "Period",    value: report.period,                         icon: Clock },
                  { label: "Campaigns", value: "14 analysed",                         icon: BarChart2 },
                  { label: "Status",    value: "Ready",                               icon: CheckCircle2 },
                ].map(s => {
                  const SIcon = s.icon;
                  return (
                    <div key={s.label} className="rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <SIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
                      </div>
                      <p className="text-xs font-semibold">{s.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Executive Summary + Health Score */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-start gap-4">
                <HealthRing score={report.healthScore} color={health.color} label={health.label} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-1">Executive Summary</p>
                  <RichBody text={report.executiveSummary} />
                </div>
              </div>
            </div>

            {/* Wins + Issues + Next Steps — horizontal strip */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Top wins */}
              <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />Top Wins
                </p>
                <ul className="space-y-2">
                  {report.topWins.map((w, i) => (
                    <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5 leading-relaxed">
                      <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-emerald-600" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Critical issues */}
              <div className="rounded-xl border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 p-4">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />Critical Issues
                </p>
                <ul className="space-y-2">
                  {report.criticalIssues.length === 0 ? (
                    <li className="text-xs text-muted-foreground">No critical issues found.</li>
                  ) : report.criticalIssues.map((issue, i) => (
                    <li key={i} className="text-xs text-red-800 dark:text-red-300 flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-red-600" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next steps */}
              <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-4">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />Next Steps
                </p>
                <ul className="space-y-2">
                  {report.nextSteps.slice(0, 5).map((step, i) => (
                    <li key={i} className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-1.5 leading-relaxed">
                      <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 text-blue-600" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Collapsible sections */}
            {report.sections.map((section, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                >
                  <span className="font-semibold text-sm">
                    {section.emoji} {section.heading}
                  </span>
                  {openSection === i
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                </button>
                {openSection === i && (
                  <div className="border-t px-5 pb-5 pt-4">
                    <RichBody text={section.body} />
                  </div>
                )}
              </div>
            ))}

            {/* Bottom action bar */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={printReport}>
                <Download className="h-4 w-4" />Export as PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleGenerate} disabled={loading}>
                <RefreshCw className="h-4 w-4" />Regenerate
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleCopy}>
                {copied ? <><BadgeCheck className="h-4 w-4 text-green-500" />Copied!</> : <><Copy className="h-4 w-4" />Copy as text</>}
              </Button>
              <Button className="gap-2" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4" />Share report
              </Button>
            </div>
          </div>
        )}

      </PageContent>

      {/* GA4-style share panel */}
      {shareOpen && (
        <SharePanel
          report={report}
          onClose={() => setShareOpen(false)}
          onPrint={printReport}
          onCopy={handleCopy}
        />
      )}
    </>
  );
}
