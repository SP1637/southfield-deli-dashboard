"use client";

import { useState, useEffect } from "react";
import { Menu, BarChart2, Printer, X, Zap } from "lucide-react";
import { Sidebar } from "./sidebar";
import { AIChat } from "./ai-chat";
import { cn } from "@/lib/utils";

// ── Platform pills shown in the banner ───────────────────────────────────────
const PLATFORM_PILLS = [
  { label: "GA4",         color: "#F9AB00" },
  { label: "Google Ads",  color: "#4285F4" },
  { label: "Meta",        color: "#0866FF" },
  { label: "TikTok",      color: "#fe2c55" },
  { label: "Shopify",     color: "#96BF48" },
  { label: "LinkedIn",    color: "#0A66C2" },
];

// ── Sample-data banner ────────────────────────────────────────────────────────
// Shows until the user has connected any real data source.
// Checks localStorage on the client so it disappears instantly once they connect.

function SampleDataBanner() {
  const [hasSource, setHasSource]   = useState(true);  // default true to avoid flash
  const [dismissed, setDismissed]   = useState(false);

  useEffect(() => {
    function check() {
      const ga4Connected  = /^\d{6,}$/.test((localStorage.getItem("ga4_selected_property") ?? "").trim());
      const adsConnected  = localStorage.getItem("ads_connected") === "1";
      setHasSource(ga4Connected || adsConnected);
    }
    check();
    const dis = sessionStorage.getItem("sample_banner_dismissed") === "1";
    setDismissed(dis);

    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  function dismiss() {
    sessionStorage.setItem("sample_banner_dismissed", "1");
    setDismissed(true);
  }

  if (hasSource || dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-[hsl(var(--sidebar-background))] px-4 py-2 shrink-0 print:hidden"
      style={{ borderColor: "hsl(var(--border))" }}>

      {/* Icon */}
      <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 shrink-0">
        <Zap className="h-3 w-3 text-primary" />
      </div>

      {/* Text */}
      <p className="text-xs text-muted-foreground shrink-0">
        <span className="font-semibold text-foreground">Sample data</span> — connect a source to see your real metrics
      </p>

      {/* Platform pills — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-1.5 flex-1 overflow-hidden">
        {PLATFORM_PILLS.map((p) => (
          <span
            key={p.label}
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap"
            style={{ borderColor: p.color + "55", color: p.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>
        ))}
        <span className="text-[10px] text-muted-foreground/60 ml-1">+ more</span>
      </div>

      {/* CTA */}
      <a
        href="/connect"
        className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Connect sources →
      </a>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
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
            <span className="font-bold text-sm text-foreground truncate">Nexoryx One</span>
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
          <div className="flex items-center gap-3 border-b bg-[hsl(var(--sidebar-background))] px-4 py-2 shrink-0 print:hidden"
            style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 shrink-0">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <p className="flex-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Sample data</span> — sign in to connect GA4, Google Ads, Meta, TikTok and more.
            </p>
            <a href="/login" className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
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
