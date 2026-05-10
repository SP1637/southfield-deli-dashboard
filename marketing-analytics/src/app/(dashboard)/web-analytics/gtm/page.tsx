"use client";

import { useState } from "react";
import {
  LayoutDashboard, Tag, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Lightbulb, Info, ArrowUpRight, Zap,
  MousePointerClick, Eye, ShoppingCart, FileText,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_TAGS = [
  {
    id: "t1",
    name: "GA4 Configuration Tag",
    type: "Google Analytics: GA4 Configuration",
    status: "live",
    triggers: ["All Pages"],
    fireCount: 84200,
    lastFired: "2 min ago",
    category: "analytics",
  },
  {
    id: "t2",
    name: "GA4 — Purchase Event",
    type: "Google Analytics: GA4 Event",
    status: "live",
    triggers: ["Thank You Page"],
    fireCount: 2840,
    lastFired: "14 min ago",
    category: "ecommerce",
  },
  {
    id: "t3",
    name: "GA4 — Add to Cart",
    type: "Google Analytics: GA4 Event",
    status: "live",
    triggers: ["Add to Cart Click"],
    fireCount: 18600,
    lastFired: "1 min ago",
    category: "ecommerce",
  },
  {
    id: "t4",
    name: "Google Ads Conversion",
    type: "Google Ads: Conversion Tracking",
    status: "live",
    triggers: ["Thank You Page"],
    fireCount: 2840,
    lastFired: "14 min ago",
    category: "ads",
  },
  {
    id: "t5",
    name: "Meta Pixel — PageView",
    type: "Custom HTML",
    status: "live",
    triggers: ["All Pages"],
    fireCount: 84200,
    lastFired: "2 min ago",
    category: "ads",
  },
  {
    id: "t6",
    name: "Meta Pixel — Purchase",
    type: "Custom HTML",
    status: "live",
    triggers: ["Thank You Page"],
    fireCount: 2840,
    lastFired: "14 min ago",
    category: "ads",
  },
  {
    id: "t7",
    name: "Hotjar Tracking Code",
    type: "Custom HTML",
    status: "paused",
    triggers: ["All Pages"],
    fireCount: 0,
    lastFired: "Paused",
    category: "analytics",
  },
  {
    id: "t8",
    name: "GA4 — View Item",
    type: "Google Analytics: GA4 Event",
    status: "live",
    triggers: ["Product Page View"],
    fireCount: 42100,
    lastFired: "30 sec ago",
    category: "ecommerce",
  },
  {
    id: "t9",
    name: "Newsletter Signup",
    type: "Google Analytics: GA4 Event",
    status: "draft",
    triggers: ["Newsletter Form Submit"],
    fireCount: 0,
    lastFired: "Never",
    category: "form",
  },
  {
    id: "t10",
    name: "Cookie Consent Banner",
    type: "Custom HTML",
    status: "live",
    triggers: ["Page View — First Visit"],
    fireCount: 24600,
    lastFired: "3 min ago",
    category: "compliance",
  },
];

const TRIGGERS = [
  { name: "All Pages",              fires: 84200, type: "Page View" },
  { name: "Thank You Page",         fires: 2840,  type: "Page View" },
  { name: "Add to Cart Click",      fires: 18600, type: "Click" },
  { name: "Product Page View",      fires: 42100, type: "Page View" },
  { name: "Newsletter Form Submit",  fires: 0,     type: "Form Submit" },
  { name: "Page View — First Visit", fires: 24600, type: "Page View" },
];

const FIRE_TREND = [
  { day: "Mon", ga4: 12400, ads: 8200, meta: 11800 },
  { day: "Tue", ga4: 14200, ads: 9400, meta: 12600 },
  { day: "Wed", ga4: 11800, ads: 7800, meta: 10400 },
  { day: "Thu", ga4: 16200, ads: 10800, meta: 14200 },
  { day: "Fri", ga4: 18400, ads: 12200, meta: 16200 },
  { day: "Sat", ga4: 9400,  ads: 6200,  meta: 8600  },
  { day: "Sun", ga4: 7800,  ads: 4800,  meta: 7200  },
];

// ── AI recommendations ────────────────────────────────────────────────────────

const AI_INSIGHTS = [
  {
    type: "warning" as const,
    text: "\"Newsletter Signup\" tag has never fired. Check that the trigger condition matches the actual form submission event name. Missing this conversion means gaps in your lead attribution.",
  },
  {
    type: "tip" as const,
    text: "Your GA4 Purchase event fires 2,840 times — verify this matches your GA4 → Conversions count. A mismatch suggests double-firing or tag sequencing issues.",
  },
  {
    type: "tip" as const,
    text: "Hotjar is paused. If you are actively using session replay for CRO, re-enable it. If not, remove the tag to reduce page load overhead.",
  },
  {
    type: "success" as const,
    text: "All core e-commerce tags (Purchase, Add to Cart, View Item) are firing correctly. Your GA4 data pipeline is healthy.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  analytics:  Eye,
  ecommerce:  ShoppingCart,
  ads:        MousePointerClick,
  form:       FileText,
  compliance: CheckCircle2,
};

const CATEGORY_COLORS: Record<string, string> = {
  analytics:  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ecommerce:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  ads:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  form:       "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  compliance: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function StatusDot({ status }: { status: string }) {
  if (status === "live") return (
    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
  if (status === "paused") return (
    <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Paused
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Draft
    </span>
  );
}

function InsightCard({ type, text }: { type: "warning" | "success" | "tip"; text: string }) {
  const styles = {
    warning: { bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900", text: "text-amber-700 dark:text-amber-400", icon: AlertTriangle },
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
    tip:     { bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900", text: "text-blue-700 dark:text-blue-400", icon: Lightbulb },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={cn("rounded-lg border p-3 flex gap-2.5", styles.bg)}>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", styles.text)} />
      <p className={cn("text-sm leading-relaxed", styles.text)}>{text}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["all", "live", "paused", "draft"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

export default function GtmPage() {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [activeTab, setActiveTab] = useState<"tags" | "triggers">("tags");

  const filteredTags = DEMO_TAGS.filter((t) => filter === "all" || t.status === filter);

  const liveTags  = DEMO_TAGS.filter((t) => t.status === "live").length;
  const totalFires = DEMO_TAGS.reduce((s, t) => s + t.fireCount, 0);
  const draftTags  = DEMO_TAGS.filter((t) => t.status === "draft").length;
  const pausedTags = DEMO_TAGS.filter((t) => t.status === "paused").length;

  return (
    <>
      <PageHeader title="GTM Tag Inspector" />
      <PageContent>
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Live Tags",      value: String(liveTags),          icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950" },
          { label: "Total Tag Fires",value: formatCompact(totalFires), icon: Tag,          color: "text-primary bg-primary/10" },
          { label: "Paused Tags",    value: String(pausedTags),        icon: AlertTriangle,color: "text-amber-600 bg-amber-100 dark:bg-amber-950" },
          { label: "Draft Tags",     value: String(draftTags),         icon: XCircle,      color: "text-muted-foreground bg-muted" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border bg-card p-4 flex items-start gap-3">
              <div className={cn("rounded-lg p-2 shrink-0", k.color.split(" ")[1])}>
                <Icon className={cn("h-4 w-4", k.color.split(" ")[0])} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold tracking-tight mt-0.5">{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Insights */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          AI Tag Health Recommendations
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {AI_INSIGHTS.map((ins, i) => (
            <InsightCard key={i} type={ins.type} text={ins.text} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Tags / Triggers table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 border-b">
            <div className="flex -mb-px">
              {(["tags", "triggers"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {activeTab === "tags" && (
              <div className="flex gap-1">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === "tags" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tag Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Trigger</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Fires</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Last Fired</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => {
                    const Icon = CATEGORY_ICONS[tag.category] ?? Tag;
                    return (
                      <tr key={tag.id} className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", tag.status !== "live" && "opacity-60")}>
                        <td className="px-4 py-2.5 font-medium max-w-[200px]">
                          <div className="truncate">{tag.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{tag.type}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium w-fit", CATEGORY_COLORS[tag.category])}>
                            <Icon className="h-3 w-3" />
                            {tag.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><StatusDot status={tag.status} /></td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">{tag.triggers.join(", ")}</td>
                        <td className="text-right px-4 py-2.5 tabular-nums font-medium">{formatCompact(tag.fireCount)}</td>
                        <td className="text-right px-4 py-2.5 text-xs text-muted-foreground">{tag.lastFired}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Trigger Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Fire Count</th>
                  </tr>
                </thead>
                <tbody>
                  {TRIGGERS.map((t, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{t.name}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{t.type}</span>
                      </td>
                      <td className="text-right px-4 py-2.5 tabular-nums">
                        {t.fires > 0 ? formatCompact(t.fires) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: fire trend chart */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold mb-3">Daily Tag Fires (7 days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={FIRE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} />
                <Tooltip
                  contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(v: number, name: string) => [formatCompact(v), name.toUpperCase()]}
                />
                <Bar dataKey="ga4"  name="GA4"  fill="#6366f1" stackId="a" />
                <Bar dataKey="meta" name="Meta" fill="#e1306c" stackId="a" />
                <Bar dataKey="ads"  name="Ads"  fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tag health summary */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold">Tag Health</p>
            {[
              { label: "Live",   count: liveTags,  total: DEMO_TAGS.length, color: "bg-emerald-500" },
              { label: "Paused", count: pausedTags, total: DEMO_TAGS.length, color: "bg-amber-500" },
              { label: "Draft",  count: draftTags,  total: DEMO_TAGS.length, color: "bg-slate-400" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{row.count} / {row.total}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", row.color)}
                    style={{ width: `${(row.count / row.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* GTM connect */}
          <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-2">
            <p className="text-sm font-semibold">Connect GTM Container</p>
            <p className="text-xs text-muted-foreground">
              Add your GTM Container ID to pull live tag data and real-time fire events directly.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => window.location.href = "/connect"}>
              <ArrowUpRight className="h-3.5 w-3.5" />
              Connect GTM
            </Button>
          </div>
        </div>
      </div>
      </PageContent>
    </>
  );
}
