"use client";

import { cn } from "@/lib/utils";
import React from "react";

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

// ─── Page content wrapper ─────────────────────────────────────────────────────
/**
 * Wrap page content. Provides consistent padding on the light-gray bg.
 */
export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-6 space-y-5", className)}>
      {children}
    </div>
  );
}
