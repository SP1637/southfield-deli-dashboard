"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { BarChart3, ArrowRight } from "lucide-react";
import { useDemoMode } from "./demo-context";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PageTab {
  key: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  actions?: React.ReactNode;
  /** Extra row below the title/tabs strip (e.g. filter bar) */
  subRow?: React.ReactNode;
}

/**
 * Databox-style page header:
 *   [Title]   [TAB1]  [TAB2]  [TAB3]          [actions]
 *
 * White background, bottom border, sticks to top of content area.
 */
export function PageHeader({
  title,
  tabs,
  activeTab,
  onTabChange,
  actions,
  subRow,
}: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-[hsl(var(--card))] border-b border-border shrink-0 print:hidden">
      {/* Main row */}
      <div className="flex items-center gap-0 px-6 h-[56px]">
        {/* Page title */}
        <h1 className="text-[17px] font-bold text-foreground mr-6 shrink-0">{title}</h1>

        {/* Inline tab navigation — Databox style */}
        {tabs && tabs.length > 0 && (
          <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
            {tabs.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className={cn(
                    "px-3.5 py-1.5 text-[12px] font-semibold tracking-wide uppercase rounded-md transition-colors whitespace-nowrap",
                    active
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right-side actions */}
        {actions && (
          <div className="ml-auto flex items-center gap-2 shrink-0 pl-4">
            {actions}
          </div>
        )}
      </div>

      {/* Optional sub-row (filter bar, date picker, etc.) */}
      {subRow && (
        <div className="px-6 pb-3 border-t border-border/50">
          {subRow}
        </div>
      )}
    </div>
  );
}

// ─── Empty state for real (non-demo) users ───────────────────────────────────
function RealUserEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-5 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold">No data connected yet</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Connect your marketing platforms to see real insights here.
          Takes less than 2 minutes.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href="/connect"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Connect platforms
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="/demo-login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Or view demo data →
        </a>
      </div>
    </div>
  );
}

// ─── Page content wrapper ─────────────────────────────────────────────────────
/**
 * Wrap page content. Provides consistent padding on the light-gray bg.
 * By default, non-demo users see an empty state (real data coming soon).
 * Pass publicPage to show content for all users (e.g. /ask, /connect).
 */
export function PageContent({
  children,
  className,
  publicPage = false,
}: {
  children: React.ReactNode;
  className?: string;
  publicPage?: boolean;
}) {
  const { isDemo } = useDemoMode();

  if (!publicPage && !isDemo) {
    return (
      <div className={cn("p-6", className)}>
        <RealUserEmptyState />
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-5", className)}>
      {children}
    </div>
  );
}
