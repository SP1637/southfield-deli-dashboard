"use client";

import { useState } from "react";
import {
  LayoutDashboard, Tag, CheckCircle2, AlertTriangle, XCircle,
  Lightbulb, ArrowUpRight, Zap,
  MousePointerClick, Eye, ShoppingCart, FileText, Share2,
  Database, Activity, ClipboardList, ShieldCheck, ShieldAlert, ShieldX,
  Code2, Layers, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";

// ── Demo: Tags ────────────────────────────────────────────────────────────────

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
  { name: "All Pages",               fires: 84200, type: "Page View" },
  { name: "Thank You Page",          fires: 2840,  type: "Page View" },
  { name: "Add to Cart Click",       fires: 18600, type: "Click" },
  { name: "Product Page View",       fires: 42100, type: "Page View" },
  { name: "Newsletter Form Submit",  fires: 0,     type: "Form Submit" },
  { name: "Page View — First Visit", fires: 24600, type: "Page View" },
];

const FIRE_TREND = [
  { day: "Mon", ga4: 12400, ads: 8200,  meta: 11800 },
  { day: "Tue", ga4: 14200, ads: 9400,  meta: 12600 },
  { day: "Wed", ga4: 11800, ads: 7800,  meta: 10400 },
  { day: "Thu", ga4: 16200, ads: 10800, meta: 14200 },
  { day: "Fri", ga4: 18400, ads: 12200, meta: 16200 },
  { day: "Sat", ga4: 9400,  ads: 6200,  meta: 8600  },
  { day: "Sun", ga4: 7800,  ads: 4800,  meta: 7200  },
];

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

// ── Demo: Variables ───────────────────────────────────────────────────────────

const DEMO_VARIABLES = [
  { name: "Page URL",              type: "Built-in",    scope: "Built-in", expression: "{{URL}}",              usage: 6  },
  { name: "Page Path",             type: "Built-in",    scope: "Built-in", expression: "{{Page Path}}",        usage: 8  },
  { name: "Click Element",         type: "Built-in",    scope: "Built-in", expression: "{{Click Element}}",    usage: 3  },
  { name: "Click Classes",         type: "Built-in",    scope: "Built-in", expression: "{{Click Classes}}",    usage: 2  },
  { name: "Click ID",              type: "Built-in",    scope: "Built-in", expression: "{{Click ID}}",         usage: 1  },
  { name: "Scroll Depth Threshold","type": "Built-in",  scope: "Built-in", expression: "{{Scroll Depth Threshold}}", usage: 1 },
  { name: "dlv — transactionId",   type: "Data Layer",  scope: "User-defined", expression: "ecommerce.transaction_id", usage: 4 },
  { name: "dlv — items",           type: "Data Layer",  scope: "User-defined", expression: "ecommerce.items",         usage: 5 },
  { name: "dlv — value",           type: "Data Layer",  scope: "User-defined", expression: "ecommerce.value",         usage: 4 },
  { name: "dlv — currency",        type: "Data Layer",  scope: "User-defined", expression: "ecommerce.currency",      usage: 4 },
  { name: "dlv — item_id",         type: "Data Layer",  scope: "User-defined", expression: "ecommerce.items.0.item_id", usage: 3 },
  { name: "GA4 Measurement ID",    type: "Constant",    scope: "User-defined", expression: "G-XXXXXXXXXX",            usage: 1 },
  { name: "Environment",           type: "Constant",    scope: "User-defined", expression: "production",               usage: 2 },
];

// ── Demo: Data Layer events ───────────────────────────────────────────────────

const DEMO_DL_EVENTS = [
  {
    event: "purchase",
    timestamp: "2 min ago",
    payload: { transaction_id: "TXN-8821", value: 68.50, currency: "USD", items: 2 },
    schema: ["event", "ecommerce.transaction_id", "ecommerce.value", "ecommerce.currency", "ecommerce.items[]"],
  },
  {
    event: "begin_checkout",
    timestamp: "4 min ago",
    payload: { value: 42.00, currency: "USD", items: 1 },
    schema: ["event", "ecommerce.value", "ecommerce.currency", "ecommerce.items[]"],
  },
  {
    event: "add_to_cart",
    timestamp: "6 min ago",
    payload: { item_id: "SOUR-001", item_name: "Artisan Sourdough", price: 8.99, quantity: 1 },
    schema: ["event", "ecommerce.items[0].item_id", "ecommerce.items[0].item_name", "ecommerce.items[0].price"],
  },
  {
    event: "view_item",
    timestamp: "7 min ago",
    payload: { item_id: "BREW-002", item_name: "Cold Brew 32oz", price: 14.99 },
    schema: ["event", "ecommerce.items[0].item_id", "ecommerce.items[0].item_name", "ecommerce.items[0].price"],
  },
  {
    event: "page_view",
    timestamp: "8 min ago",
    payload: { page_location: "/products/cold-brew", page_title: "Cold Brew Coffee" },
    schema: ["event", "page_location", "page_title", "page_referrer"],
  },
  {
    event: "search",
    timestamp: "11 min ago",
    payload: { search_term: "sourdough bread" },
    schema: ["event", "search_term"],
  },
  {
    event: "scroll",
    timestamp: "13 min ago",
    payload: { percent_scrolled: 90 },
    schema: ["event", "percent_scrolled"],
  },
];

const DL_EVENT_COLORS: Record<string, string> = {
  purchase:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  begin_checkout: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  add_to_cart:    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  view_item:      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  page_view:      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  search:         "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  scroll:         "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

// ── Demo: Event Tracking ──────────────────────────────────────────────────────

const DEMO_GA4_EVENTS = [
  { name: "page_view",       trigger: "All Pages",                firesPerDay: 12028, isConversion: false, params: ["page_location", "page_title", "page_referrer"] },
  { name: "view_item",       trigger: "Product Page View",         firesPerDay: 6014,  isConversion: false, params: ["item_id", "item_name", "price", "currency"] },
  { name: "add_to_cart",     trigger: "Add to Cart Click",         firesPerDay: 2657,  isConversion: false, params: ["item_id", "item_name", "quantity", "value"] },
  { name: "begin_checkout",  trigger: "Checkout Page View",        firesPerDay: 1284,  isConversion: false, params: ["value", "currency", "items[]"] },
  { name: "purchase",        trigger: "Thank You Page",            firesPerDay: 406,   isConversion: true,  params: ["transaction_id", "value", "currency", "items[]"] },
  { name: "search",          trigger: "Site Search",               firesPerDay: 884,   isConversion: false, params: ["search_term"] },
  { name: "scroll",          trigger: "90% Scroll Depth",          firesPerDay: 3812,  isConversion: false, params: ["percent_scrolled"] },
  { name: "file_download",   trigger: "Download Link Click",       firesPerDay: 48,    isConversion: false, params: ["file_name", "file_extension", "link_url"] },
  { name: "video_play",      trigger: "YouTube Video Play",        firesPerDay: 124,   isConversion: false, params: ["video_title", "video_percent", "video_url"] },
];

// ── Demo: Tag Audit ───────────────────────────────────────────────────────────

const liveTags   = DEMO_TAGS.filter((t) => t.status === "live").length;
const draftTags  = DEMO_TAGS.filter((t) => t.status === "draft").length;
const pausedTags = DEMO_TAGS.filter((t) => t.status === "paused").length;
const totalTags  = DEMO_TAGS.length;
const totalFires = DEMO_TAGS.reduce((s, t) => s + t.fireCount, 0);

const AUDIT_ITEMS = [
  { label: "All core ecommerce events are live",                   status: "pass" as const },
  { label: "Purchase tag verified — fires match GA4 conversions",  status: "pass" as const },
  { label: "GA4 Configuration tag fires on all pages",             status: "pass" as const },
  { label: "Google Ads conversion tag present and active",         status: "pass" as const },
  { label: "Meta Pixel (Purchase) fires correctly",                status: "pass" as const },
  { label: "Newsletter Signup tag has never fired",                status: "fail" as const },
  { label: "Hotjar tag is paused — review if intentional",         status: "warn" as const },
  { label: "No double-fire risk detected on purchase trigger",     status: "pass" as const },
  { label: "Draft tags should be published or removed",            status: "warn" as const },
  { label: "Cookie consent tag is correctly scoped",               status: "pass" as const },
];

function calcHealthScore(): number {
  const liveRatio    = liveTags / totalTags;    // want high
  const draftRatio   = draftTags / totalTags;   // want low
  const pausedRatio  = pausedTags / totalTags;  // slightly penalise
  const passItems    = AUDIT_ITEMS.filter((i) => i.status === "pass").length;
  const passRatio    = passItems / AUDIT_ITEMS.length;

  const score = Math.round(
    liveRatio * 40 +
    passRatio * 40 +
    (1 - draftRatio) * 10 +
    (1 - pausedRatio) * 10
  );
  return Math.min(100, Math.max(0, score));
}

const HEALTH_SCORE = calcHealthScore();

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

const TAG_FILTER_OPTIONS = ["all", "live", "paused", "draft"] as const;
type TagFilter = typeof TAG_FILTER_OPTIONS[number];

export default function GtmPage() {
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [innerTab, setInnerTab] = useState<"tags" | "triggers">("tags");
  const [activeTab, setActiveTab] = useState("tag-manager");
  const [shareOpen, setShareOpen] = useState(false);

  const filteredTags = DEMO_TAGS.filter((t) => tagFilter === "all" || t.status === tagFilter);

  return (
    <>
      <PageHeader
        title="GTM Tag Inspector"
        tabs={[
          { key: "tag-manager",    label: "Tag Manager" },
          { key: "variables",      label: "Variables" },
          { key: "data-layer",     label: "Data Layer" },
          { key: "event-tracking", label: "Event Tracking" },
          { key: "tag-audit",      label: "Tag Audit" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        }
      />
      <PageContent>

        {/* ── TAB: Tag Manager ──────────────────────────────────────────────── */}
        {activeTab === "tag-manager" && (
          <>
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Live Tags",       value: String(liveTags),          icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950" },
                { label: "Total Tag Fires", value: formatCompact(totalFires), icon: Tag,          color: "text-primary bg-primary/10" },
                { label: "Paused Tags",     value: String(pausedTags),        icon: AlertTriangle,color: "text-amber-600 bg-amber-100 dark:bg-amber-950" },
                { label: "Draft Tags",      value: String(draftTags),         icon: XCircle,      color: "text-muted-foreground bg-muted" },
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

            {/* Main tags/triggers + chart */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-xl border bg-card overflow-hidden">
                {/* Inner tags / triggers toggle */}
                <div className="flex items-center justify-between px-4 border-b">
                  <div className="flex -mb-px">
                    {(["tags", "triggers"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setInnerTab(tab)}
                        className={cn(
                          "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                          innerTab === tab
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  {innerTab === "tags" && (
                    <div className="flex gap-1">
                      {TAG_FILTER_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setTagFilter(f)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                            tagFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {innerTab === "tags" ? (
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

              {/* Right panel */}
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

                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <p className="text-sm font-semibold">Tag Health</p>
                  {[
                    { label: "Live",   count: liveTags,   total: totalTags, color: "bg-emerald-500" },
                    { label: "Paused", count: pausedTags, total: totalTags, color: "bg-amber-500" },
                    { label: "Draft",  count: draftTags,  total: totalTags, color: "bg-slate-400" },
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
          </>
        )}

        {/* ── TAB: Variables ────────────────────────────────────────────────── */}
        {activeTab === "variables" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Variables", value: DEMO_VARIABLES.length, icon: Layers },
                { label: "Built-in",        value: DEMO_VARIABLES.filter((v) => v.scope === "Built-in").length, icon: Code2 },
                { label: "User-defined",    value: DEMO_VARIABLES.filter((v) => v.scope === "User-defined").length, icon: Database },
              ].map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="text-sm font-semibold">Variable Library</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Variable Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Scope</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Expression / Value</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Used In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_VARIABLES.map((v, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{v.name}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            v.type === "Built-in"   ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : v.type === "Data Layer" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          )}>
                            {v.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{v.scope}</td>
                        <td className="px-4 py-2.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">{v.expression}</code>
                        </td>
                        <td className="text-right px-4 py-2.5 text-xs text-muted-foreground">
                          {v.usage} {v.usage === 1 ? "tag" : "tags"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Data Layer ───────────────────────────────────────────────── */}
        {activeTab === "data-layer" && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              {/* Event feed */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Activity className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Recent dataLayer Events</p>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="divide-y">
                  {DEMO_DL_EVENTS.map((ev, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0", DL_EVENT_COLORS[ev.event] ?? "bg-muted text-muted-foreground")}>
                          {ev.event}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{ev.timestamp}</span>
                      </div>
                      <div className="rounded bg-muted/50 p-2 text-[11px] font-mono leading-relaxed overflow-x-auto">
                        {Object.entries(ev.payload).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-indigo-600">{k}</span>
                            <span className="text-muted-foreground">: </span>
                            <span className="text-emerald-700 dark:text-emerald-400">{JSON.stringify(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schema panel */}
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Event Schema Reference
                  </p>
                  <div className="space-y-3">
                    {DEMO_DL_EVENTS.slice(0, 5).map((ev, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <p className={cn("text-[11px] font-semibold rounded-full px-2 py-0.5 w-fit mb-2", DL_EVENT_COLORS[ev.event] ?? "bg-muted text-muted-foreground")}>
                          {ev.event}
                        </p>
                        <ul className="space-y-0.5">
                          {ev.schema.map((field, j) => (
                            <li key={j} className="text-[11px] font-mono text-muted-foreground">
                              • {field}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Event Tracking ───────────────────────────────────────────── */}
        {activeTab === "event-tracking" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Tracked Events",     value: DEMO_GA4_EVENTS.length },
                { label: "Conversion Events",  value: DEMO_GA4_EVENTS.filter((e) => e.isConversion).length },
                { label: "Total Fires / Day",  value: formatCompact(DEMO_GA4_EVENTS.reduce((s, e) => s + e.firesPerDay, 0)) },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold">Daily Event Fires</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={DEMO_GA4_EVENTS.map((e) => ({ name: e.name.replace(/_/g, " "), fires: e.firesPerDay }))}
                  margin={{ left: 0, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number) => [formatCompact(v), "fires/day"]}
                  />
                  <Bar dataKey="fires" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="text-sm font-semibold">GA4 Event Table</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Event Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Trigger</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Fires / Day</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Conversion</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Parameters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_GA4_EVENTS.map((ev, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">{ev.name}</code>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{ev.trigger}</td>
                        <td className="text-right px-4 py-2.5 tabular-nums font-medium">{formatCompact(ev.firesPerDay)}</td>
                        <td className="px-4 py-2.5">
                          {ev.isConversion ? (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {ev.params.slice(0, 3).map((p, j) => (
                              <span key={j} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{p}</span>
                            ))}
                            {ev.params.length > 3 && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">+{ev.params.length - 3}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Tag Audit ────────────────────────────────────────────────── */}
        {activeTab === "tag-audit" && (
          <>
            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
              {/* Health score */}
              <div className="rounded-xl border bg-card p-6 flex flex-col items-center justify-center min-w-[200px] gap-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Health Score</p>
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50"
                      fill="none"
                      stroke={HEALTH_SCORE >= 80 ? "#10b981" : HEALTH_SCORE >= 60 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeDasharray={`${(HEALTH_SCORE / 100) * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" textAnchor="middle" fontSize="26" fontWeight="bold" fill="currentColor">{HEALTH_SCORE}</text>
                  </svg>
                </div>
                <p className={cn(
                  "text-sm font-semibold",
                  HEALTH_SCORE >= 80 ? "text-emerald-600" : HEALTH_SCORE >= 60 ? "text-amber-600" : "text-red-500"
                )}>
                  {HEALTH_SCORE >= 80 ? "Healthy" : HEALTH_SCORE >= 60 ? "Needs Attention" : "Critical"}
                </p>
                <p className="text-[11px] text-muted-foreground text-center max-w-[160px]">
                  Based on live tag %, pass/fail checks, draft and paused tags
                </p>
              </div>

              {/* Score breakdown */}
              <div className="rounded-xl border bg-card p-5 space-y-2">
                <p className="text-sm font-semibold mb-3">Audit Checklist</p>
                {AUDIT_ITEMS.map((item, i) => {
                  const Icon = item.status === "pass" ? ShieldCheck : item.status === "warn" ? ShieldAlert : ShieldX;
                  const color = item.status === "pass"
                    ? "text-emerald-600"
                    : item.status === "warn"
                    ? "text-amber-600"
                    : "text-red-500";
                  const bg = item.status === "pass"
                    ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10"
                    : item.status === "warn"
                    ? "hover:bg-amber-50/50 dark:hover:bg-amber-950/10"
                    : "hover:bg-red-50/50 dark:hover:bg-red-950/10";
                  return (
                    <div key={i} className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors", bg)}>
                      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", color)} />
                      <p className="text-sm leading-relaxed">{item.label}</p>
                      <span className={cn(
                        "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        item.status === "pass"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : item.status === "warn"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      )}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Passed",   value: AUDIT_ITEMS.filter((i) => i.status === "pass").length, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                { label: "Warnings", value: AUDIT_ITEMS.filter((i) => i.status === "warn").length, color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/20" },
                { label: "Failed",   value: AUDIT_ITEMS.filter((i) => i.status === "fail").length, color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20" },
                { label: "Total Checks", value: AUDIT_ITEMS.length, color: "text-foreground",   bg: "bg-muted/30" },
              ].map((s) => (
                <div key={s.label} className={cn("rounded-xl border p-4", s.bg)}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn("mt-1 text-3xl font-bold", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

      </PageContent>

      {shareOpen && (
        <SharePanel
          title="GTM Tag Inspector"
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
