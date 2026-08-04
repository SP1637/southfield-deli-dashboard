"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut, X, Sun, Moon, Monitor, ChevronRight,
  FileBarChart, Sparkles, Lightbulb, Bell, TrendingUp,
  LayoutDashboard, Award, DollarSign, Percent, Share2, Target,
  Megaphone, Search, Instagram, Mail, Globe, ShoppingBag, Link2,
  Paintbrush, FileText, Video,
  Route, Users, UserPlus, Heart, Gem, Layers,
  BarChart3, UserCheck, ArrowUpRight, Wallet, Package, ShoppingCart,
  Eye, Radio, GitMerge, LineChart, Tag, Trophy,
  Zap, AlertTriangle, Brain, Sliders, Wand2, Sprout,
  Calendar, Calculator, Flag, Activity,
  Plug, Database, Code2, UserCog, Settings,
  BookOpen, Star, GitBranch,
  Home, BarChart2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

interface NavItem { label: string; href: string; icon: React.ElementType; badge?: string }

const DECISION_INTELLIGENCE: NavItem[] = [
  { label: "Executive Summary",    href: "/executive-summary",   icon: FileBarChart },
  { label: "Ask Captain AI",       href: "/ask",                 icon: Sparkles,   badge: "AI" },
  { label: "Recommendations",      href: "/recommendations",     icon: Lightbulb },
  { label: "Smart Alerts",         href: "/alerts",              icon: Bell },
  { label: "Forecasts",            href: "/forecasts",           icon: TrendingUp },
];

const BUSINESS_PERFORMANCE: NavItem[] = [
  { label: "Executive Dashboard",  href: "/executive-dashboard", icon: LayoutDashboard },
  { label: "Marketing Score",      href: "/marketing-score",     icon: Award },
  { label: "Revenue Intelligence", href: "/revenue-intelligence",icon: DollarSign },
  { label: "ROI",                  href: "/roi",                 icon: Percent },
  { label: "Attribution",          href: "/attribution",         icon: Share2 },
  { label: "Goals & OKRs",         href: "/goals",               icon: Target },
];

const MARKETING_INTELLIGENCE: NavItem[] = [
  { label: "Marketing Overview",    href: "/marketing-overview",   icon: LayoutDashboard },
  { label: "Campaign Intelligence", href: "/campaigns",            icon: Wand2 },
  { label: "Channel Performance",   href: "/channel-performance",  icon: BarChart2 },
  { label: "Audience Performance",  href: "/audience",             icon: Users },
  { label: "Content Performance",   href: "/content-performance",  icon: FileText },
  { label: "Creative Performance",  href: "/creative-performance", icon: Paintbrush },
  { label: "SEO Intelligence",      href: "/seo",                  icon: Search },
  { label: "Website Intelligence",  href: "/overview",             icon: Globe },
  { label: "Email Intelligence",    href: "/email-marketing",      icon: Mail },
  { label: "Social Intelligence",   href: "/media",                icon: Instagram },
  { label: "Video Intelligence",    href: "/video-intelligence",   icon: Video },
  { label: "Affiliate Intelligence",href: "/affiliate",            icon: Link2 },
];

const REVENUE_INTELLIGENCE: NavItem[] = [
  { label: "Revenue",              href: "/revenue",              icon: DollarSign },
  { label: "Orders",               href: "/orders",               icon: ShoppingCart },
  { label: "Profit",               href: "/profit",               icon: TrendingUp },
  { label: "Margin",               href: "/margin",               icon: Percent },
  { label: "ROAS",                 href: "/roas",                 icon: Target },
  { label: "CAC",                  href: "/cac",                  icon: UserPlus },
  { label: "LTV",                  href: "/ltv",                  icon: Gem },
  { label: "Revenue Attribution",  href: "/revenue-attribution",  icon: Share2 },
  { label: "Forecast",             href: "/forecasts",            icon: Activity },
  { label: "Revenue Opportunities",href: "/revenue-opportunities", icon: Zap },
];

const CUSTOMER_INTELLIGENCE: NavItem[] = [
  { label: "Customer Journey",     href: "/customer-journey",    icon: Route },
  { label: "Behaviour",            href: "/behaviour",           icon: Eye },
  { label: "Funnels",              href: "/funnel",              icon: BarChart3 },
  { label: "Retention",            href: "/retention",           icon: Heart },
  { label: "Churn",                href: "/churn",               icon: AlertTriangle },
  { label: "Segments",             href: "/segmentation",        icon: Layers },
  { label: "Cohorts",              href: "/cohorts",             icon: Users },
  { label: "Demographics",         href: "/demographics",        icon: UserCheck },
  { label: "Lifetime Value",       href: "/ltv",                 icon: Gem },
  { label: "Personas",             href: "/personas",            icon: UserPlus },
];

const SALES_INTELLIGENCE: NavItem[] = [
  { label: "Sales Funnel",         href: "/funnel",              icon: BarChart3 },
  { label: "Lead Performance",     href: "/lead-performance",    icon: UserCheck },
  { label: "Conversion Analysis",  href: "/conversion-analysis", icon: ArrowUpRight },
  { label: "Revenue Pipeline",     href: "/revenue-pipeline",    icon: Wallet },
  { label: "Products",             href: "/items",               icon: Package },
  { label: "Orders",               href: "/orders",              icon: ShoppingCart },
];

const COMPETITOR_INTELLIGENCE: NavItem[] = [
  { label: "Competitors",          href: "/competitors",         icon: Eye },
  { label: "Share of Voice",       href: "/share-of-voice",      icon: Radio },
  { label: "SEO Gap",              href: "/seo-gap",             icon: GitBranch },
  { label: "Keyword Gap",          href: "/keyword-gap",         icon: GitMerge },
  { label: "Ad Library",           href: "/ad-library",          icon: BookOpen },
  { label: "Pricing",              href: "/pricing",             icon: Tag },
  { label: "Offers",               href: "/offers",              icon: Percent },
  { label: "Content",              href: "/competitor-content",  icon: FileText },
  { label: "Social Growth",        href: "/social-growth",       icon: TrendingUp },
  { label: "Reviews",              href: "/reviews",             icon: Star },
  { label: "Market Trends",        href: "/market-trends",       icon: LineChart },
];

const AI_DECISION_CENTER: NavItem[] = [
  { label: "Opportunities",        href: "/opportunities",       icon: Zap },
  { label: "Problems",             href: "/problems",            icon: AlertTriangle },
  { label: "Predictions",          href: "/predictions",         icon: Brain },
  { label: "Budget Optimizer",     href: "/budget-optimizer",    icon: Sliders },
  { label: "Campaign Optimizer",   href: "/campaigns",           icon: Wand2 },
  { label: "Growth Ideas",         href: "/growth-ideas",        icon: Sprout },
];

const PLANNING: NavItem[] = [
  { label: "Campaign Calendar",    href: "/campaign-calendar",   icon: Calendar },
  { label: "Budget Planner",       href: "/budget",              icon: Calculator },
  { label: "Objectives",           href: "/objectives",          icon: Flag },
  { label: "Forecast Simulator",   href: "/forecast-simulator",  icon: Activity },
];

const INTEGRATIONS: NavItem[] = [
  { label: "Connect Platforms",    href: "/connect",             icon: Plug },
  { label: "Data Sources",         href: "/data-sources",        icon: Database },
  { label: "API",                  href: "/api-docs",            icon: Code2 },
  { label: "Users",                href: "/settings/team",       icon: UserCog },
  { label: "Settings",             href: "/settings",            icon: Settings },
];

function NavSection({
  label, items, pathname, onClose, defaultOpen = true,
}: {
  label: string; items: NavItem[]; pathname: string;
  onClose?: () => void; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-1 rounded hover:opacity-80 transition-opacity"
      >
        <span className="text-[10.5px] font-semibold" style={{ color: "hsl(var(--sidebar-section-label))" }}>
          {label}
        </span>
        <ChevronRight
          className={cn("h-3 w-3 transition-transform duration-200 shrink-0", open && "rotate-90")}
          style={{ color: "hsl(var(--sidebar-section-label))" }}
        />
      </button>

      {open && items.map((item) => {
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
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const homeActive = pathname === "/home";

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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-1">
        {/* Home standalone */}
        <Link
          href="/home"
          onClick={onClose}
          className={cn(
            "flex items-center gap-2.5 rounded-md mx-1 px-2.5 py-[7px] text-[13.5px] font-semibold transition-colors",
            homeActive
              ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
              : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/50] hover:text-[hsl(var(--sidebar-accent-foreground))]"
          )}
        >
          <Home className={cn("h-[15px] w-[15px] shrink-0",
            homeActive ? "text-[hsl(var(--sidebar-accent-foreground))]" : "text-[hsl(var(--sidebar-muted))]"
          )} />
          🏠 Home
        </Link>

        <div className="border-t mx-3 my-2" style={{ borderColor: "hsl(var(--sidebar-border))" }} />

        <NavSection label="🧠 Decision Intelligence"   items={DECISION_INTELLIGENCE}   pathname={pathname} onClose={onClose} defaultOpen={true} />
        <NavSection label="📊 Business Performance"    items={BUSINESS_PERFORMANCE}    pathname={pathname} onClose={onClose} defaultOpen={true} />
        <NavSection label="📢 Marketing Intelligence"   items={MARKETING_INTELLIGENCE}  pathname={pathname} onClose={onClose} defaultOpen={true} />
        <NavSection label="💰 Revenue Intelligence"     items={REVENUE_INTELLIGENCE}    pathname={pathname} onClose={onClose} defaultOpen={false} />
        <NavSection label="📈 Customer Intelligence"   items={CUSTOMER_INTELLIGENCE}   pathname={pathname} onClose={onClose} defaultOpen={false} />
        <NavSection label="💰 Sales Intelligence"      items={SALES_INTELLIGENCE}      pathname={pathname} onClose={onClose} defaultOpen={true} />
        <NavSection label="🔍 Competitor Intelligence" items={COMPETITOR_INTELLIGENCE}  pathname={pathname} onClose={onClose} defaultOpen={false} />
        <NavSection label="🤖 AI Decision Center"      items={AI_DECISION_CENTER}      pathname={pathname} onClose={onClose} defaultOpen={true} />
        <NavSection label="📅 Planning"                items={PLANNING}                pathname={pathname} onClose={onClose} defaultOpen={false} />

        <div className="border-t mx-3 my-2" style={{ borderColor: "hsl(var(--sidebar-border))" }} />

        <NavSection label="⚙️ Integrations"            items={INTEGRATIONS}            pathname={pathname} onClose={onClose} defaultOpen={false} />
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
