"use client";

import { useState, useEffect } from "react";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScheduledReports({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [email, setEmail] = useState(userEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<{ frequency: string; enabled: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/reports/schedule")
      .then((r) => r.json())
      .then((d) => { if (d.prefs) setExisting(d.prefs); })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/reports/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency, email, enabled: true }),
      });
      const data = await res.json();
      if (data.saved) {
        setExisting({ frequency, enabled: true });
        setSaved(true);
        setTimeout(() => { setSaved(false); setOpen(false); }, 2000);
      }
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors print:hidden",
          existing?.enabled
            ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
            : "text-muted-foreground hover:text-foreground hover:border-foreground/30"
        )}
      >
        <CalendarClock className="h-3.5 w-3.5" />
        {existing?.enabled ? `${existing.frequency} report ✓` : "Schedule report"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border bg-card shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Scheduled Reports</p>
              <button onClick={() => setOpen(false)} className="rounded-md p-0.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Receive a PDF summary report by email automatically.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Frequency</label>
              <div className="mt-1 flex gap-2">
                {(["weekly", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
                      frequency === f ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Send to email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>
            <button
              onClick={save}
              disabled={saving || !email || saved}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              {saved ? "Saved!" : saving ? "Saving…" : "Activate schedule"}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              {frequency === "weekly" ? "Sends every Monday morning" : "Sends on the 1st of each month"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
