"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut, X, Sun, Moon, Monitor, ChevronRight,
  FileBarChart, Sparkles, Bell, TrendingUp,
  LayoutDashboard, DollarSign, Share2, Target,
  Megaphone, Search, Instagram, Mail, Globe,
  Route, Users, Heart, Layers,
  BarChart3, Eye, LineChart,
  Zap, Brain, Calculator,
  Calendar, Plug, UserCog, Settings,
  Home, BarChart2, Radio, CheckSquare,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useDemoMode } from "./demo-context";
import Image from "next/image";
import React from "react";

interface NavItem { label: string; href: string; icon: React.ElementType; badge?: string }

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "intelligence",
    label: "INTELLIGENCE",
    items: [
      { label: "Executive Brief",      href: "/executive-brief",       icon: FileBarChart },
      { label: "Captain AI",             href: "/ask",                   icon: Sparkles,   badge: "AI" },
      { label: "Decisions",            href: "/decisions",             icon: CheckSquare },
      { label: "Alerts & Opps",        href: "/alerts",                icon: Bell },
    ],
  },
  {
    id: "performance",
    label: "PERFORMANCE",
    items: [
      { label: "Marketing Performance",href: "/marketing-performance", icon: BarChart2 },
      { label: "Campaigns",            href: "/campaigns",             icon: Megaphone },
      { label: "Channels",             href: "/channels",              icon: BarChart3 },
      { label: "Revenue & ROI",        href: "/revenue-roi",           icon: DollarSign },
      { label: "Attribution",          href: "/attribution",           icon: Share2 },
      { label: "Goals",                href: "/goals",                 icon: Target },
    ],
  },
  {
    id: "audience",
    label: "AUDIENCE",
    items: [
      { label: "Audience Overview",    href: "/audience",              icon: Users },
      { label: "Customer Journey",     href: "/customer-journey",      icon: Route },
      { label: "Funnel & Conversion",  href: "/funnel",                icon: BarChart3 },
      { label: "Segments",             href: "/segmentation",          icon: Layers },
      { label: "Retention & LTV",      href: "/retention",             icon: Heart },
    ],
  },
  {
    id: "channels",
    label: "CHANNELS",
    items: [
      { label: "Paid Media",           href: "/ads",                   icon: Radio },
      { label: "Search & SEO",         href: "/seo",                   icon: Search },
      { label: "Social",               href: "/media",                 icon: Instagram },
      { label: "Email",                href: "/email-marketing",       icon: Mail },
      { label: "Website & Content",    href: "/overview",              icon: Globe },
    ],
  },
  {
    id: "market",
    label: "MARKET",
    items: [
      { label: "Competitors",          href: "/competitors",           icon: Eye },
      { label: "Market & Trends",      href: "/market-trends",         icon: LineChart },
    ],
  },
  {
    id: "optimize",
    label: "OPTIMIZE",
    items: [
      { label: "Optimization Hub",     href: "/optimization-hub",      icon: Zap },
    ],
  },
  {
    id: "plan",
    label: "PLAN",
    items: [
      { label: "Marketing Plan",       href: "/planning",              icon: Layers },
      { label: "Campaign Planner",     href: "/campaign-planner",      icon: Megaphone },
      { label: "Budget Planner",       href: "/budget",                icon: Calculator },
      { label: "Calendar",             href: "/marketing-calendar",    icon: Calendar },
      { label: "Forecasts & Scenarios",href: "/forecasts",             icon: TrendingUp },
    ],
  },
];

const DATA_ADMIN: NavItem[] = [
  { label: "Data Hub",               href: "/connect",               icon: Plug },
  { label: "Team",                   href: "/settings/team",         icon: UserCog },
  { label: "Settings",               href: "/settings",              icon: Settings },
];

function SidebarSection({
  section, pathname, onClose, defaultOpen,
}: {
  section: NavSection; pathname: string;
  onClose?: () => void; defaultOpen: boolean;
}) {
  const storageKey = `sidebar_section_${section.id}`;
  // Initialize with defaultOpen to match SSR — read localStorage after mount to avoid hydration mismatch
  const [open, setOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setOpen(stored === "1");
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(storageKey, next ? "1" : "0"); } catch {}
  }

  // Auto-expand when navigating into this section
  React.useEffect(() => {
    if (defaultOpen && !open) {
      setOpen(true);
      try { localStorage.setItem(storageKey, "1"); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpen]);

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-3 pt-3 pb-1 rounded hover:opacity-80 transition-opacity"
      >
        <span className="text-[9.5px] font-bold tracking-widest"
          style={{ color: "hsl(var(--sidebar-section-label))" }}>
          {section.label}
        </span>
        <ChevronRight
          className={cn("h-3 w-3 transition-transform duration-200 shrink-0", open && "rotate-90")}
          style={{ color: "hsl(var(--sidebar-section-label))" }}
        />
      </button>

      {open && section.items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={onClose}
            className={cn(
              "group flex items-center gap-2.5 rounded-md mx-1 px-2.5 py-[6px] text-[13px] font-medium transition-colors select-none",
              active
                ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/50] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            )}
          >
            <Icon className={cn("h-[14px] w-[14px] shrink-0 transition-colors",
              active
                ? "text-[hsl(var(--sidebar-accent-foreground))]"
                : "text-[hsl(var(--sidebar-muted))] group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
            )} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground leading-none">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

interface SidebarProps { isOpen?: boolean; onClose?: () => void }

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { isDemo } = useDemoMode();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  function exitDemo() {
    document.cookie = "nexoryx_demo=; path=/; max-age=0";
    window.location.href = "/login";
  }

  const homeActive = pathname === "/home";

  // Auto-open the section that contains the active route
  function isSectionActive(section: NavSection) {
    return section.items.some(
      (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
    );
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[230px] flex-col border-r",
        "transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{ background: "hsl(var(--sidebar-background))", borderColor: "hsl(var(--sidebar-border))" }}
    >
      {/* Logo */}
      <div className="flex h-[56px] items-center gap-2.5 px-4 border-b shrink-0"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-[14px] font-bold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
          Nexoryx One
        </span>
        <button onClick={onClose} className="md:hidden ml-auto shrink-0 rounded p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Demo mode badge */}
      {isDemo && (
        <div className="mx-3 my-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Demo Mode</p>
            <p className="text-[10px] text-muted-foreground">Sample data only</p>
          </div>
          <button
            onClick={exitDemo}
            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Exit
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1">
        {/* Overview */}
        <Link
          href="/home"
          onClick={onClose}
          className={cn(
            "flex items-center gap-2.5 rounded-md mx-1 px-2.5 py-[7px] text-[13px] font-semibold transition-colors",
            homeActive
              ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
              : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/50] hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
        >
          <Home className={cn("h-[14px] w-[14px] shrink-0",
            homeActive ? "text-[hsl(var(--sidebar-accent-foreground))]" : "text-[hsl(var(--sidebar-muted))]"
          )} />
          Overview
        </Link>

        {/* Main sections */}
        {NAV_SECTIONS.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            pathname={pathname}
            onClose={onClose}
            defaultOpen={isSectionActive(section) || section.id === "intelligence"}
          />
        ))}

        {/* Divider before admin */}
        <div className="border-t mx-3 my-2" style={{ borderColor: "hsl(var(--sidebar-border))" }} />

        {/* Data & Admin */}
        <div>
          <p className="px-3 pt-1 pb-1 text-[9.5px] font-bold tracking-widest"
            style={{ color: "hsl(var(--sidebar-section-label))" }}>
            DATA & ADMIN
          </p>
          {DATA_ADMIN.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md mx-1 px-2.5 py-[6px] text-[13px] font-medium transition-colors select-none",
                  active
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/50] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                )}
              >
                <Icon className={cn("h-[14px] w-[14px] shrink-0",
                  active ? "text-[hsl(var(--sidebar-accent-foreground))]" : "text-[hsl(var(--sidebar-muted))] group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
                )} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Theme toggle */}
      <div className="px-4 py-2.5 border-t shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          {([
            { value: "light",  icon: Sun },
            { value: "system", icon: Monitor },
            { value: "dark",   icon: Moon },
          ] as const).map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={value.charAt(0).toUpperCase() + value.slice(1)}
              className={cn(
                "flex flex-1 items-center justify-center py-1.5 transition-colors",
                mounted && theme === value ? "bg-primary text-white" : "hover:bg-[hsl(var(--sidebar-accent))]"
              )}
              style={{ color: mounted && theme === value ? "white" : "hsl(var(--sidebar-muted))" }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* User */}
      {session?.user && (
        <div className="px-3 py-3 border-t shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-2.5">
            {session.user.image ? (
              <Image src={session.user.image} alt="Avatar" width={30} height={30} className="rounded-full shrink-0" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white shrink-0">
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-medium" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                {session.user.name}
              </p>
              <p className="truncate text-[11px]" style={{ color: "hsl(var(--sidebar-muted))" }}>
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
