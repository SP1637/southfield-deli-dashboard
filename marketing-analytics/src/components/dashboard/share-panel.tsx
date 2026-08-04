"use client";

import { useState } from "react";
import {
  Share2, Mail, CalendarClock, Link2, Download,
  X, ChevronRight, Send, Calendar, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SharePanelProps {
  title?: string;       // e.g. "Sales by Country"
  onClose: () => void;
  onPrint?: () => void;
}

export function SharePanel({ title = "this report", onClose, onPrint }: SharePanelProps) {
  const [view, setView]             = useState<"menu" | "email" | "schedule">("menu");
  const [email, setEmail]           = useState("");
  const [schedFreq, setSchedFreq]   = useState("weekly");
  const [schedDay, setSchedDay]     = useState("Monday");
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [schedSaved, setSchedSaved] = useState(false);

  function handleShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
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

  function handlePrint() {
    onPrint ? onPrint() : window.print();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-card border-l shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            {view !== "menu" && (
              <button
                onClick={() => setView("menu")}
                className="text-muted-foreground hover:text-foreground mr-0.5"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            )}
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">
              {view === "menu"
                ? "Share this report"
                : view === "email"
                ? "Send Email"
                : "Schedule Email"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Main menu ── */}
        {view === "menu" && (
          <div className="flex-1 p-3 space-y-1 overflow-y-auto">
            {[
              {
                icon: Mail,
                label: "Send Email",
                sub: "Email this report to your team",
                action: () => setView("email"),
              },
              {
                icon: CalendarClock,
                label: "Schedule Email",
                sub: "Auto-send on a recurring schedule",
                action: () => setView("schedule"),
              },
              {
                icon: Link2,
                label: "Share Link",
                sub: linkCopied ? "Link copied!" : "Copy a shareable link to this page",
                action: handleShareLink,
                highlight: linkCopied,
              },
              {
                icon: Download,
                label: "Download File",
                sub: "Export as PDF to your device",
                action: handlePrint,
              },
            ].map(({ icon: Icon, label, sub, action, highlight }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left hover:bg-muted/60 transition-colors group border border-transparent hover:border-border"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Icon
                    className={cn(
                      "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors",
                      highlight && "text-emerald-600"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className={cn("text-xs text-muted-foreground mt-0.5", highlight && "text-emerald-600 font-medium")}>
                    {sub}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* ── Send Email ── */}
        {view === "email" && (
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Send <strong>{title}</strong> to one or more email addresses.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recipient email(s)
              </label>
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
              <p className="text-xs font-semibold">What&apos;s included:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Full data table &amp; chart snapshot</li>
                <li>• AI summary &amp; top insights</li>
                <li>• Period &amp; date generated</li>
              </ul>
            </div>
            <button
              onClick={handleSendEmail}
              disabled={!email.trim() || emailSent}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                emailSent
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {emailSent
                ? <><CheckCircle2 className="h-4 w-4" /> Sent!</>
                : <><Send className="h-4 w-4" /> Send Report</>}
            </button>
          </div>
        )}

        {/* ── Schedule Email ── */}
        {view === "schedule" && (
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Automatically send <strong>{title}</strong> to your team on a recurring schedule.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recipient email(s)
              </label>
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
                <select
                  value={schedFreq}
                  onChange={e => setSchedFreq(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Send on</label>
                <select
                  value={schedDay}
                  onChange={e => setSchedDay(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
              <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {schedFreq === "daily"
                  ? "Every day"
                  : schedFreq === "weekly"
                  ? `Every ${schedDay}`
                  : "1st of every month"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Report will be generated &amp; sent automatically
              </p>
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={!email.trim() || schedSaved}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
                schedSaved
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {schedSaved
                ? <><CheckCircle2 className="h-4 w-4" /> Schedule saved!</>
                : <><Calendar className="h-4 w-4" /> Save Schedule</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
