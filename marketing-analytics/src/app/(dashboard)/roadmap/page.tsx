"use client";

import {
  Map, CheckCircle2, Clock, Rocket, Sparkles, Zap,
  BarChart3, Globe, Bell, FileText, Users, Layers,
  Plug, Share2, Shield, CreditCard, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Feature list ──────────────────────────────────────────────────────────────

type Status = "done" | "in_progress" | "planned" | "coming_soon";

interface Feature {
  name: string;
  description: string;
  status: Status;
  category: string;
  icon: React.ElementType;
  since?: string;
}

const FEATURES: Feature[] = [
  // ── Done ──────────────────────────────────────────────────────────────────
  {
    name: "Google Analytics 4 Integration",
    description: "Service-account-based GA4 data pull — sessions, revenue, funnels, geo, traffic",
    status: "done",
    category: "Data Sources",
    icon: BarChart3,
    since: "v1.0",
  },
  {
    name: "Sales Funnel Dashboard",
    description: "Visualise your conversion funnel step-by-step with drop-off rates",
    status: "done",
    category: "Dashboards",
    icon: TrendingUp,
    since: "v1.0",
  },
  {
    name: "Attribution Analytics",
    description: "Channel attribution breakdown — organic, paid, social, email, referral",
    status: "done",
    category: "Dashboards",
    icon: Share2,
    since: "v1.0",
  },
  {
    name: "Geographic Analytics",
    description: "Revenue and sessions by country with world map visualisation",
    status: "done",
    category: "Dashboards",
    icon: Globe,
    since: "v1.0",
  },
  {
    name: "Dark / Light / System Theme",
    description: "Three-way theme toggle with persistent preference",
    status: "done",
    category: "UI / UX",
    icon: Sparkles,
    since: "v1.0",
  },
  {
    name: "Shareable Dashboard Links",
    description: "Generate signed JWT links to share read-only dashboards — no login needed",
    status: "done",
    category: "Sharing",
    icon: Share2,
    since: "v1.1",
  },
  {
    name: "AI Insights Panel",
    description: "Contextual rule-based insights on every dashboard (Claude-powered when API key set)",
    status: "done",
    category: "AI",
    icon: Sparkles,
    since: "v1.1",
  },
  {
    name: "Goal Tracker",
    description: "Set revenue, sessions, and ROAS targets with animated progress bars",
    status: "done",
    category: "Dashboards",
    icon: BarChart3,
    since: "v1.1",
  },
  {
    name: "Scheduled Email Reports",
    description: "Weekly and monthly report scheduling with Resend email delivery",
    status: "done",
    category: "Reporting",
    icon: FileText,
    since: "v1.1",
  },
  {
    name: "Stripe Subscription (Pro & Agency)",
    description: "Stripe-powered billing for Pro (£29/mo) and Agency (£99/mo) tiers",
    status: "done",
    category: "Billing",
    icon: CreditCard,
    since: "v1.1",
  },
  {
    name: "18 Connector Library",
    description: "GA4, Google Ads, Meta Ads, Shopify, LinkedIn, TikTok, HubSpot, Salesforce + more",
    status: "done",
    category: "Data Sources",
    icon: Plug,
    since: "v1.2",
  },
  {
    name: "KPI Templates",
    description: "Industry presets for E-commerce, SaaS, Lead Gen, Agency, Brand & Content",
    status: "done",
    category: "Templates",
    icon: Layers,
    since: "v1.2",
  },
  {
    name: "AI Written Reports",
    description: "Full narrative marketing reports — Claude-powered or rule-based fallback",
    status: "done",
    category: "AI",
    icon: FileText,
    since: "v1.2",
  },
  {
    name: "KPI Alerts",
    description: "Threshold-based alerts for any KPI — daily/weekly checks, email + in-app notifications",
    status: "done",
    category: "Alerts",
    icon: Bell,
    since: "v1.2",
  },
  {
    name: "Team & Role Access",
    description: "Admin / Editor / Viewer roles with invite system — built for agencies",
    status: "done",
    category: "Collaboration",
    icon: Users,
    since: "v1.2",
  },
  // ── In Progress ────────────────────────────────────────────────────────────
  {
    name: "Live GA4 Data Sync",
    description: "Real-time data refresh every 5 minutes via SWR polling",
    status: "in_progress",
    category: "Data Sources",
    icon: Zap,
  },
  // ── Planned ────────────────────────────────────────────────────────────────
  {
    name: "Shopify OAuth Integration",
    description: "One-click Shopify store connection via OAuth — orders, products & revenue",
    status: "planned",
    category: "Data Sources",
    icon: Plug,
  },
  {
    name: "Meta Ads Live Data",
    description: "Live campaign performance from Facebook & Instagram Ads API",
    status: "planned",
    category: "Data Sources",
    icon: BarChart3,
  },
  {
    name: "Custom Dashboard Builder",
    description: "Drag-and-drop widget layout to build fully custom dashboards",
    status: "planned",
    category: "Dashboards",
    icon: Layers,
  },
  {
    name: "PDF Export Branding",
    description: "White-label PDF reports with custom logo and colour scheme for agencies",
    status: "planned",
    category: "Reporting",
    icon: FileText,
  },
  {
    name: "Multi-Property Support",
    description: "Switch between multiple GA4 properties from a single workspace",
    status: "planned",
    category: "Data Sources",
    icon: Globe,
  },
  // ── Coming Soon ────────────────────────────────────────────────────────────
  {
    name: "Looker Studio Connector",
    description: "Push Marketing Intelligence data directly into Looker Studio dashboards",
    status: "coming_soon",
    category: "Integrations",
    icon: Share2,
  },
  {
    name: "Anomaly Detection",
    description: "ML-based detection of unusual spikes or drops in any metric",
    status: "coming_soon",
    category: "AI",
    icon: Sparkles,
  },
  {
    name: "SSO / SAML",
    description: "Single sign-on for enterprise teams via Okta, Azure AD, Google Workspace",
    status: "coming_soon",
    category: "Security",
    icon: Shield,
  },
];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; badgeClass: string; dotClass: string }> = {
  done: {
    label: "Done",
    icon: CheckCircle2,
    badgeClass: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
    dotClass: "bg-green-500",
  },
  in_progress: {
    label: "In Progress",
    icon: Zap,
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500 animate-pulse",
  },
  planned: {
    label: "Planned",
    icon: Clock,
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-400",
  },
  coming_soon: {
    label: "Coming Soon",
    icon: Rocket,
    badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dotClass: "bg-violet-400",
  },
};

const STATUS_ORDER: Status[] = ["done", "in_progress", "planned", "coming_soon"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = FEATURES.filter((f) => f.status === s);
    return acc;
  }, {} as Record<Status, Feature[]>);

  const doneCount = byStatus.done.length;
  const totalCount = FEATURES.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  return (
    <>
      <PageHeader title="Product Roadmap" />
      <PageContent>

      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">MVP Progress</p>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const SIcon = cfg.icon;
            return (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dotClass)} />
                {cfg.label}: {byStatus[s].length}
              </span>
            );
          })}
        </div>
      </div>

      {/* Feature sections by status */}
      {STATUS_ORDER.map((status) => {
        const features = byStatus[status];
        if (features.length === 0) return null;
        const cfg = STATUS_CONFIG[status];
        const StatusIcon = cfg.icon;

        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <StatusIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{cfg.label}</h2>
              <Badge variant="outline" className={cn("text-[10px] ml-1", cfg.badgeClass)}>
                {features.length}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const FIcon = f.icon;
                return (
                  <div
                    key={f.name}
                    className={cn(
                      "rounded-xl border bg-card p-4 flex gap-3",
                      status === "done" && "opacity-80"
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center",
                        status === "done" ? "bg-green-500/15" : "bg-primary/10"
                      )}>
                        {status === "done"
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          : <FIcon className="h-3.5 w-3.5 text-primary" />
                        }
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{f.name}</p>
                        {f.since && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{f.since}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {f.description}
                      </p>
                      <span className="mt-2 inline-block text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                        {f.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Request feature */}
      <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
        <Rocket className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-medium">Got a feature request?</p>
        <p className="text-xs text-muted-foreground mt-1">
          We prioritise based on demand.{" "}
          <a
            href="mailto:sub17h4@gmail.com"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Tell us what you need →
          </a>
        </p>
      </div>
      </PageContent>
    </>
  );
}
