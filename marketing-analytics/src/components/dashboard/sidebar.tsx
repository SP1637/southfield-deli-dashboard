"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Globe, Package, TrendingUp, LayoutDashboard,
  LogOut, Share2, X, Sun, Moon, Monitor,
  FileText, Bell, Users, Layers, Map,
  Megaphone, Instagram, Search, BarChart2,
  Target, Hash, Sparkles, Tv2, Wallet,
  Plug, Home, ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

// ─── Nav structure (Databox-style) ───────────────────────────────────────────
interface NavItem { label: string; href: string; icon: React.ElementType; badge?: string }

// Top-level items (no section heading) — mirrors Databox's primary nav
const MAIN_NAV: NavItem[] = [
  { label: "Ask Genie",         href: "/ask",        icon: Sparkles, badge: "New" },
  { label: "Home",              href: "/overview",   icon: Home      },
  { label: "Metrics",           href: "/metrics",    icon: Hash      },
  { label: "Databoards",        href: "/campaigns",  icon: BarChart2 },
  { label: "Reports",           href: "/reports",    icon: FileText  },
  { label: "Goals & OKRs",      href: "/goals",      icon: Target    },
  { label: "Forecasts",         href: "/forecasts",  icon: TrendingUp},
  { label: "Spaces",            href: "/templates",  icon: Layers    },
  { label: "Data Manager",      href: "/connect",    icon: Plug      },
];

const ADS_NAV: NavItem[] = [
  { label: "All Campaigns",    href: "/ads",        icon: Megaphone },
  { label: "Budget Pacing",    href: "/budget",     icon: Wallet    },
];

const ANALYTICS_NAV: NavItem[] = [
  { label: "GA4 Overview",     href: "/overview",   icon: BarChart2 },
  { label: "Sales Funnel",     href: "/funnel",     icon: BarChart3 },
  { label: "Attribution",      href: "/attribution",icon: Share2    },
  { label: "Traffic",          href: "/traffic",    icon: TrendingUp},
  { label: "By Country",       href: "/countries",  icon: Globe     },
  { label: "By Item",          href: "/items",      icon: Package   },
  { label: "GTM Tags",         href: "/web-analytics/gtm", icon: LayoutDashboard },
];

const SEO_NAV: NavItem[] = [
  { label: "Search Console",   href: "/seo",        icon: Search    },
];

const SOCIAL_NAV: NavItem[] = [
  { label: "Social Insights",  href: "/media",      icon: Instagram },
];

const TOOLS_NAV: NavItem[] = [
  { label: "Alerts",           href: "/alerts",     icon: Bell      },
  { label: "TV Mode",          href: "/tv",         icon: Tv2       },
  { label: "Roadmap",          href: "/roadmap",    icon: Map       },
];

const SETTINGS_NAV: NavItem[] = [
  { label: "Team & Access",    href: "/settings/team",  icon: Users },
];

// ─── Section ──────────────────────────────────────────────────────────────────
function NavSection({
  label, items, pathname, onClose,
}: { label: string; items: NavItem[]; pathname: string; onClose?: () => void }) {
  return (
    <div>
      <p className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "hsl(var(--sidebar-section-label))" }}>
        {label}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href + "/")) || (item.href === "/overview" && pathname === "/overview");
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={onClose}
            className={cn(
              "group flex items-center gap-2.5 rounded-md mx-1 px-2.5 py-[7px] text-[13.5px] font-medium transition-colors select-none",
              active
                ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/50] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            )}
          >
            <Icon className={cn("h-[15px] w-[15px] shrink-0 transition-colors",
              active ? "text-[hsl(var(--sidebar-accent-foreground))]" : "text-[hsl(var(--sidebar-muted))] group-hover:text-[hsl(var(--sidebar-accent-foreground))]"
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[230px] flex-col border-r",
        "transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex h-[56px] items-center gap-2.5 px-4 border-b shrink-0"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-[14px] font-bold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
          Marketing Intel
        </span>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="md:hidden ml-auto shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-3 px-1">
        {/* Quick access — no label */}
        <div>
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md mx-1 px-2.5 py-[7px] text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/50] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                )}
              >
                <Icon className={cn("h-[15px] w-[15px] shrink-0",
                  active ? "text-[hsl(var(--sidebar-accent-foreground))]" : "text-[hsl(var(--sidebar-muted))]"
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

        <div className="border-t mx-3" style={{ borderColor: "hsl(var(--sidebar-border))" }} />

        <NavSection label="Ads"          items={ADS_NAV}          pathname={pathname} onClose={onClose} />
        <NavSection label="Web Analytics"items={ANALYTICS_NAV}    pathname={pathname} onClose={onClose} />
        <NavSection label="SEO"          items={SEO_NAV}           pathname={pathname} onClose={onClose} />
        <NavSection label="Social"       items={SOCIAL_NAV}        pathname={pathname} onClose={onClose} />
        <NavSection label="Tools"        items={TOOLS_NAV}         pathname={pathname} onClose={onClose} />

        <div className="border-t mx-3" style={{ borderColor: "hsl(var(--sidebar-border))" }} />

        <NavSection label="Settings"     items={SETTINGS_NAV}     pathname={pathname} onClose={onClose} />
      </nav>

      {/* ── Theme toggle ── */}
      <div className="px-4 py-2.5 border-t shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          {([
            { value: "light",  icon: Sun    },
            { value: "system", icon: Monitor},
            { value: "dark",   icon: Moon   },
          ] as const).map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={value.charAt(0).toUpperCase() + value.slice(1)}
              className={cn(
                "flex flex-1 items-center justify-center py-1.5 text-xs transition-colors",
                mounted && theme === value
                  ? "bg-primary text-white"
                  : "hover:bg-[hsl(var(--sidebar-accent))]"
              )}
              style={{ color: mounted && theme === value ? "white" : "hsl(var(--sidebar-muted))" }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* ── User ── */}
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
