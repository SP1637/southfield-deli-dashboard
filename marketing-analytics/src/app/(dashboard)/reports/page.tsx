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
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { generateAiReport, computeHealthScore, type AiReport } from "@/lib/ai-engine";
import { CAMPAIGNS } from "@/lib/campaign-data";

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
            </div>
          </div>
        )}

      </PageContent>
    </>
  );
}
