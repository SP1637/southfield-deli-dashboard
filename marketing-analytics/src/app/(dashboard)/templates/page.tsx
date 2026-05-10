"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers, ShoppingCart, Code2, Users, Megaphone, Building2,
  CheckCircle2, ChevronRight, ArrowRight, BarChart3, TrendingUp,
  Target, DollarSign, Mail, Globe, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Template definitions ──────────────────────────────────────────────────────

interface KpiMetric {
  name: string;
  description: string;
  icon: React.ElementType;
  target?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  industry: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  popular?: boolean;
  metrics: KpiMetric[];
  dashboardFocus: string[];
}

const TEMPLATES: Template[] = [
  {
    id: "ecommerce",
    name: "E-commerce Growth",
    description: "Track revenue, AOV, conversion rate, and repeat purchase KPIs for online stores.",
    industry: "E-commerce",
    icon: ShoppingCart,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    popular: true,
    metrics: [
      { name: "Total Revenue", description: "Gross revenue from all sales", icon: DollarSign, target: "£50,000/mo" },
      { name: "Average Order Value", description: "Mean basket size", icon: TrendingUp, target: "£85" },
      { name: "Conversion Rate", description: "Visitors who purchase", icon: Target, target: "3.5%" },
      { name: "Customer Acquisition Cost", description: "Ad spend ÷ new customers", icon: BarChart3, target: "£18" },
      { name: "Return on Ad Spend", description: "Revenue ÷ ad spend", icon: Zap, target: "4×" },
      { name: "Cart Abandonment Rate", description: "Carts started but not completed", icon: ShoppingCart, target: "< 70%" },
    ],
    dashboardFocus: ["Sales Funnel", "Attribution", "By Item"],
  },
  {
    id: "saas",
    name: "SaaS & Subscriptions",
    description: "Monitor MRR, churn, trial conversion, and LTV for subscription businesses.",
    industry: "SaaS",
    icon: Code2,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
    popular: true,
    metrics: [
      { name: "Monthly Recurring Revenue", description: "MRR from active subscriptions", icon: DollarSign, target: "£25,000" },
      { name: "Churn Rate", description: "Subscribers cancelling per month", icon: TrendingUp, target: "< 2%" },
      { name: "Trial to Paid Conversion", description: "Free trials that convert", icon: Target, target: "25%" },
      { name: "Customer Lifetime Value", description: "Average revenue per customer", icon: BarChart3, target: "£1,200" },
      { name: "Net Promoter Score", description: "Customer satisfaction proxy", icon: Users, target: "> 40" },
      { name: "Activation Rate", description: "Trials who hit the aha moment", icon: Zap, target: "60%" },
    ],
    dashboardFocus: ["Overview", "Traffic", "Funnel"],
  },
  {
    id: "lead_gen",
    name: "Lead Generation",
    description: "Measure CPL, lead quality, nurture rates, and SQL conversion for B2B teams.",
    industry: "B2B / Lead Gen",
    icon: Target,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800",
    metrics: [
      { name: "Cost Per Lead", description: "Total ad spend ÷ leads generated", icon: DollarSign, target: "£22" },
      { name: "Lead to SQL Rate", description: "Leads that become sales-qualified", icon: Target, target: "18%" },
      { name: "Form Conversion Rate", description: "Visitors who submit a form", icon: TrendingUp, target: "4%" },
      { name: "Paid vs Organic Split", description: "Attribution by channel", icon: BarChart3, target: "50/50" },
      { name: "Pipeline Value", description: "Total value of open opportunities", icon: Zap, target: "£180,000" },
      { name: "Demo Booked Rate", description: "Qualified leads booking demos", icon: Users, target: "35%" },
    ],
    dashboardFocus: ["Attribution", "Traffic", "Overview"],
  },
  {
    id: "agency",
    name: "Marketing Agency",
    description: "Client reporting focused: cross-channel ROAS, campaign performance & budget pacing.",
    industry: "Agency",
    icon: Building2,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    popular: true,
    metrics: [
      { name: "Blended ROAS", description: "Revenue ÷ total ad spend across channels", icon: Zap, target: "5×" },
      { name: "Budget Utilisation", description: "Spend vs allocated budget", icon: DollarSign, target: "95–105%" },
      { name: "Click-through Rate", description: "Average CTR across campaigns", icon: Target, target: "3%" },
      { name: "Impressions", description: "Total ad reach across platforms", icon: Globe, target: "500k/mo" },
      { name: "Cost Per Click", description: "Average CPC across all channels", icon: BarChart3, target: "£0.80" },
      { name: "Conversion Volume", description: "Total conversions this period", icon: TrendingUp, target: "1,200" },
    ],
    dashboardFocus: ["Attribution", "Overview", "Traffic"],
  },
  {
    id: "brand",
    name: "Brand & Awareness",
    description: "Track share of voice, organic reach, social engagement and brand sentiment.",
    industry: "Brand",
    icon: Megaphone,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800",
    metrics: [
      { name: "Organic Sessions", description: "Non-paid traffic to your site", icon: Globe, target: "25,000/mo" },
      { name: "Social Reach", description: "Unique accounts reached across platforms", icon: Users, target: "80,000" },
      { name: "Engagement Rate", description: "Interactions ÷ impressions", icon: TrendingUp, target: "4%" },
      { name: "Brand Search Volume", description: "Searches for your brand name", icon: BarChart3, target: "+20% YoY" },
      { name: "Referral Traffic", description: "Sessions from external links", icon: Zap, target: "3,000/mo" },
      { name: "Email Open Rate", description: "Average open rate across campaigns", icon: Mail, target: "28%" },
    ],
    dashboardFocus: ["Traffic", "Countries", "Overview"],
  },
  {
    id: "content",
    name: "Content Marketing",
    description: "Measure blog traffic, email subscribers, content ROI, and organic keyword rankings.",
    industry: "Content / SEO",
    icon: Globe,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
    metrics: [
      { name: "Organic Sessions", description: "Search-driven visits to content", icon: Globe, target: "40,000/mo" },
      { name: "Avg Time on Page", description: "How long readers stay engaged", icon: TrendingUp, target: "> 3 min" },
      { name: "Email Subscribers Added", description: "New newsletter sign-ups from content", icon: Mail, target: "500/mo" },
      { name: "Top Pages by Revenue", description: "Content that drives conversions", icon: DollarSign, target: "Track" },
      { name: "Keyword Rankings", description: "Position changes for tracked keywords", icon: Target, target: "Top 10" },
      { name: "Content Conversion Rate", description: "Readers who take a desired action", icon: BarChart3, target: "2%" },
    ],
    dashboardFocus: ["Traffic", "By Item", "Overview"],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Template | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  function applyTemplate(t: Template) {
    // Persist to localStorage so Overview/other pages can pick it up
    try {
      localStorage.setItem("kpi_template", JSON.stringify({
        id: t.id,
        name: t.name,
        metrics: t.metrics,
        dashboardFocus: t.dashboardFocus,
        appliedAt: new Date().toISOString(),
      }));
    } catch {}
    setApplied(t.id);
    setTimeout(() => router.push("/overview"), 1200);
  }

  return (
    <>
      <PageHeader title="KPI Templates" />
      <PageContent>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const isSelected = selected?.id === t.id;
          const isApplied = applied === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelected(isSelected ? null : t)}
              className={cn(
                "relative text-left rounded-xl border p-5 transition-all duration-200 hover:shadow-md",
                isSelected
                  ? "border-primary/60 ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/40 bg-card"
              )}
            >
              {t.popular && (
                <Badge className="absolute right-3 top-3 bg-primary/15 text-primary border-primary/20 text-[10px]">
                  Popular
                </Badge>
              )}
              {isApplied && (
                <Badge className="absolute right-3 top-3 bg-green-500/15 text-green-600 border-green-500/20 text-[10px]">
                  ✓ Applied
                </Badge>
              )}

              <div className={cn("inline-flex rounded-lg border p-2.5 mb-4", t.bgColor)}>
                <Icon className={cn("h-5 w-5", t.color)} />
              </div>

              <p className="font-semibold text-sm leading-tight">{t.name}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
                {t.industry}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                {t.description}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                <span>{t.metrics.length} KPIs</span>
                <span className="mx-1">·</span>
                <Globe className="h-3 w-3" />
                <span>{t.dashboardFocus.join(", ")}</span>
              </div>

              <div className="mt-3 flex items-center text-xs font-medium text-primary">
                {isSelected ? "Click to deselect" : "View metrics"}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded metric detail */}
      {selected && (
        <div className={cn("rounded-xl border p-6 space-y-5", selected.bgColor)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <selected.icon className={cn("h-5 w-5", selected.color)} />
                {selected.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => applyTemplate(selected)}
              disabled={applied === selected.id}
            >
              {applied === selected.id ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Applied!
                </>
              ) : (
                <>
                  Apply Template
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Included KPIs & Targets
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selected.metrics.map((m) => {
                const MIcon = m.icon;
                return (
                  <div key={m.name} className="rounded-lg border bg-card/80 p-3 flex gap-3">
                    <div className="mt-0.5 shrink-0">
                      <MIcon className={cn("h-4 w-4", selected.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-snug">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.description}</p>
                      {m.target && (
                        <p className="text-[11px] font-medium text-foreground mt-0.5">
                          Target: {m.target}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Dashboard pages this template emphasises
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.dashboardFocus.map((f) => (
                <span
                  key={f}
                  className="rounded-full border bg-card px-3 py-1 text-xs font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-center text-sm">
        <p className="font-medium">Templates are a starting point, not a constraint</p>
        <p className="text-xs text-muted-foreground mt-1">
          After applying, you can edit individual KPI targets from the{" "}
          <button
            onClick={() => router.push("/overview")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Overview dashboard
          </button>
          .
        </p>
      </div>
      </PageContent>
    </>
  );
}
