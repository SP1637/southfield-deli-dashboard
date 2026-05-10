"use client";

import { useState, useEffect } from "react";
import { Menu, BarChart2, Printer, FlaskConical, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { AIChat } from "./ai-chat";
import { cn } from "@/lib/utils";

// ── Sample-data banner ────────────────────────────────────────────────────────
// Shows on every page until the user has a real GA4 property connected.
// Reads localStorage on the client so it disappears instantly once they connect.

function SampleDataBanner() {
  const [hasRealProperty, setHasRealProperty] = useState(true); // default true to avoid flash
  const [dismissed, setDismissed]             = useState(false);

  useEffect(() => {
    function evaluate(raw: string | null) {
      // A real property ID is 6+ digits only.
      const isReal = /^\d{6,}$/.test((raw ?? "").trim());
      setHasRealProperty(isReal);
    }

    evaluate(localStorage.getItem("ga4_selected_property"));
    const dis = sessionStorage.getItem("sample_banner_dismissed") === "1";
    setDismissed(dis);

    function onStorage(e: StorageEvent) {
      if (e.key === "ga4_selected_property") evaluate(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function dismiss() {
    sessionStorage.setItem("sample_banner_dismissed", "1");
    setDismissed(true);
  }

  if (hasRealProperty || dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-violet-50 dark:bg-violet-950/30 px-4 py-2 shrink-0 print:hidden"
      style={{ borderColor: "hsl(var(--border))" }}>
      <FlaskConical className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
      <p className="flex-1 text-xs text-violet-700 dark:text-violet-300">
        <span className="font-semibold">Sample data</span> — connect your GA4 property to see your real analytics.
      </p>
      <a
        href="/connect"
        className="shrink-0 rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
      >
        Connect GA4 →
      </a>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-violet-400 hover:text-violet-700 dark:hover:text-violet-200"
        title="Dismiss for this session"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
  isDemo?: boolean;
}

export function DashboardShell({ children, isDemo = false }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--page-bg, 220 14% 96%))" }}>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — offset by sidebar width */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-[230px]">

        {/* ── Mobile top bar ── */}
        <header className="flex md:hidden items-center h-14 gap-3 px-4 border-b bg-white dark:bg-[hsl(var(--sidebar-background))] sticky top-0 z-20"
          style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground truncate">Marketing Intel</span>
          </div>
          <button
            onClick={() => window.print()}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors print:hidden"
            title="Export as PDF"
          >
            <Printer className="h-4 w-4" />
          </button>
        </header>

        {/* ── Not-logged-in demo banner (unauthenticated visitors) ── */}
        {isDemo && (
          <div className="flex items-center justify-between border-b bg-amber-50 dark:bg-amber-950/30 px-6 py-2 shrink-0 print:hidden"
            style={{ borderColor: "hsl(var(--border))" }}>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Demo mode</span> — sign in to connect your data sources.
            </p>
            <a href="/login" className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 shrink-0">
              Sign in →
            </a>
          </div>
        )}

        {/* ── Sample data banner (signed in but no GA4 property set) ── */}
        {!isDemo && <SampleDataBanner />}

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* AI Chat FAB */}
      <AIChat />
    </div>
  );
}
