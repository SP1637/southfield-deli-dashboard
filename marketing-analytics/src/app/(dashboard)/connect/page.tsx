"use client";

import { useState } from "react";
import {
  ChevronRight, CheckCircle2, AlertTriangle,
  Search, Plug, RefreshCw, Wifi, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Types ─────────────────────────────────────────────────────────────────────
type Health = "healthy" | "attention";
interface Platform { name: string; connected: boolean; syncTime?: string; health?: Health }
interface Category { emoji: string; label: string; description: string; platforms: Platform[] }

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    emoji: "📢", label: "Advertising", description: "Paid campaign performance and attribution.",
    platforms: [
      { name: "Google Ads",       connected: true,  syncTime: "2 min ago",  health: "healthy" },
      { name: "Meta Ads",         connected: true,  syncTime: "4 min ago",  health: "healthy" },
      { name: "Microsoft Ads",    connected: false },
      { name: "TikTok Ads",       connected: false },
      { name: "LinkedIn Ads",     connected: false },
      { name: "Pinterest Ads",    connected: false },
      { name: "Snapchat Ads",     connected: false },
      { name: "X Ads",            connected: false },
      { name: "Reddit Ads",       connected: false },
      { name: "Amazon Ads",       connected: false },
      { name: "DV360",            connected: false },
      { name: "The Trade Desk",   connected: false },
      { name: "Criteo",           connected: false },
      { name: "Taboola",          connected: false },
      { name: "Outbrain",         connected: false },
    ],
  },
  {
    emoji: "🌐", label: "Website & Analytics", description: "Website traffic and user behaviour.",
    platforms: [
      { name: "Google Analytics 4",        connected: true,  syncTime: "1 min ago",  health: "healthy" },
      { name: "Google Tag Manager",         connected: false },
      { name: "Google Search Console",      connected: true,  syncTime: "10 min ago", health: "healthy" },
      { name: "Microsoft Clarity",          connected: false },
      { name: "Hotjar",                     connected: false },
      { name: "Adobe Analytics",            connected: false },
      { name: "Cloudflare Web Analytics",   connected: false },
      { name: "Plausible",                  connected: false },
      { name: "Matomo",                     connected: false },
      { name: "Mixpanel",                   connected: false },
      { name: "Amplitude",                  connected: false },
    ],
  },
  {
    emoji: "🔍", label: "SEO Intelligence", description: "Organic search visibility.",
    platforms: [
      { name: "SEMrush",            connected: true,  syncTime: "1 hr ago",   health: "healthy" },
      { name: "Ahrefs",             connected: false },
      { name: "Moz",                connected: false },
      { name: "Screaming Frog",     connected: false },
      { name: "Google Search Console", connected: false },
      { name: "Majestic",           connected: false },
      { name: "BrightEdge",         connected: false },
      { name: "Conductor",          connected: false },
      { name: "Surfer SEO",         connected: false },
      { name: "SEOTesting",         connected: false },
    ],
  },
  {
    emoji: "📱", label: "Social Media", description: "Organic social performance.",
    platforms: [
      { name: "Facebook Pages",  connected: true,  syncTime: "30 min ago", health: "attention" },
      { name: "Instagram",       connected: true,  syncTime: "30 min ago", health: "healthy" },
      { name: "LinkedIn",        connected: false },
      { name: "TikTok",          connected: false },
      { name: "X (Twitter)",     connected: false },
      { name: "YouTube",         connected: false },
      { name: "Pinterest",       connected: false },
      { name: "Threads",         connected: false },
      { name: "Reddit",          connected: false },
    ],
  },
  {
    emoji: "📩", label: "Email Marketing", description: "Email campaigns and automation.",
    platforms: [
      { name: "Mailchimp",         connected: false },
      { name: "Klaviyo",           connected: true,  syncTime: "15 min ago", health: "healthy" },
      { name: "Brevo",             connected: false },
      { name: "Campaign Monitor",  connected: false },
      { name: "Constant Contact",  connected: false },
      { name: "MailerLite",        connected: false },
      { name: "HubSpot Email",     connected: false },
      { name: "ActiveCampaign",    connected: false },
      { name: "Omnisend",          connected: false },
      { name: "ConvertKit",        connected: false },
    ],
  },
  {
    emoji: "🛒", label: "Ecommerce", description: "Sales and product data.",
    platforms: [
      { name: "Shopify",               connected: true,  syncTime: "3 min ago",  health: "healthy" },
      { name: "WooCommerce",           connected: false },
      { name: "Magento",               connected: false },
      { name: "BigCommerce",           connected: false },
      { name: "Squarespace Commerce",  connected: false },
      { name: "Wix Stores",            connected: false },
      { name: "Ecwid",                 connected: false },
      { name: "PrestaShop",            connected: false },
      { name: "OpenCart",              connected: false },
    ],
  },
  {
    emoji: "👥", label: "CRM & Sales", description: "Lead and customer intelligence.",
    platforms: [
      { name: "HubSpot CRM",  connected: true,  syncTime: "20 min ago", health: "healthy" },
      { name: "Salesforce",   connected: false },
      { name: "Zoho CRM",     connected: false },
      { name: "Pipedrive",    connected: false },
      { name: "Monday CRM",   connected: false },
      { name: "Freshsales",   connected: false },
      { name: "Copper",       connected: false },
      { name: "Insightly",    connected: false },
      { name: "Capsule CRM",  connected: false },
    ],
  },
  {
    emoji: "📋", label: "Forms & Lead Generation", description: "Lead capture forms and landing pages.",
    platforms: [
      { name: "Typeform",      connected: false },
      { name: "Jotform",       connected: false },
      { name: "Gravity Forms", connected: false },
      { name: "WPForms",       connected: false },
      { name: "Google Forms",  connected: false },
      { name: "HubSpot Forms", connected: false },
      { name: "Unbounce",      connected: false },
      { name: "Leadpages",     connected: false },
    ],
  },
  {
    emoji: "💳", label: "Revenue & Finance", description: "Revenue attribution and financial data.",
    platforms: [
      { name: "Stripe",     connected: true,  syncTime: "5 min ago",  health: "healthy" },
      { name: "PayPal",     connected: false },
      { name: "QuickBooks", connected: false },
      { name: "Xero",       connected: false },
      { name: "Chargebee",  connected: false },
      { name: "Paddle",     connected: false },
      { name: "Square",     connected: false },
    ],
  },
  {
    emoji: "🛍", label: "Marketplace", description: "Marketplace analytics and listings.",
    platforms: [
      { name: "Amazon Seller Central",   connected: false },
      { name: "eBay",                    connected: false },
      { name: "Etsy",                    connected: false },
      { name: "TikTok Shop",             connected: false },
      { name: "Google Merchant Center",  connected: false },
    ],
  },
  {
    emoji: "📈", label: "Customer Success", description: "Customer retention and support.",
    platforms: [
      { name: "Intercom",   connected: false },
      { name: "Zendesk",    connected: false },
      { name: "Freshdesk",  connected: false },
      { name: "Help Scout", connected: false },
      { name: "Gorgias",    connected: false },
    ],
  },
  {
    emoji: "📊", label: "Product Analytics", description: "Product usage and behaviour.",
    platforms: [
      { name: "Mixpanel",  connected: false },
      { name: "Amplitude", connected: false },
      { name: "Heap",      connected: false },
      { name: "PostHog",   connected: false },
      { name: "Pendo",     connected: false },
      { name: "FullStory", connected: false },
    ],
  },
  {
    emoji: "🎯", label: "Attribution & Tracking", description: "Marketing attribution modelling.",
    platforms: [
      { name: "Triple Whale", connected: false },
      { name: "Hyros",        connected: false },
      { name: "Northbeam",    connected: false },
      { name: "Rockerbox",    connected: false },
      { name: "Segment",      connected: false },
    ],
  },
  {
    emoji: "📹", label: "Content & Video", description: "Video and content performance.",
    platforms: [
      { name: "YouTube", connected: true,  syncTime: "45 min ago", health: "attention" },
      { name: "Vimeo",   connected: false },
      { name: "Wistia",  connected: false },
      { name: "Loom",    connected: false },
    ],
  },
  {
    emoji: "🤖", label: "AI Platforms", description: "AI-generated marketing assets and performance.",
    platforms: [
      { name: "OpenAI",     connected: false },
      { name: "Claude",     connected: false },
      { name: "Gemini",     connected: false },
      { name: "Perplexity", connected: false },
      { name: "Midjourney", connected: false },
      { name: "Canva",      connected: false },
    ],
  },
  {
    emoji: "⭐", label: "Reviews & Reputation", description: "Brand reputation and reviews.",
    platforms: [
      { name: "Google Business Profile", connected: false },
      { name: "Trustpilot",              connected: false },
      { name: "Yelp",                    connected: false },
      { name: "Tripadvisor",             connected: false },
      { name: "Feefo",                   connected: false },
      { name: "Reviews.io",              connected: false },
    ],
  },
  {
    emoji: "📍", label: "Local Marketing", description: "Location performance and local presence.",
    platforms: [
      { name: "Google Business Profile", connected: false },
      { name: "Apple Business Connect",  connected: false },
      { name: "Bing Places",             connected: false },
    ],
  },
  {
    emoji: "📰", label: "Content Management", description: "Website content and CMS platforms.",
    platforms: [
      { name: "WordPress",   connected: false },
      { name: "Webflow",     connected: false },
      { name: "Shopify CMS", connected: false },
      { name: "Contentful",  connected: false },
      { name: "Sanity",      connected: false },
      { name: "Ghost",       connected: false },
    ],
  },
  {
    emoji: "📅", label: "Marketing Productivity", description: "Project management and team tools.",
    platforms: [
      { name: "Asana",           connected: false },
      { name: "Monday.com",      connected: false },
      { name: "ClickUp",         connected: false },
      { name: "Notion",          connected: false },
      { name: "Trello",          connected: false },
      { name: "Jira",            connected: false },
      { name: "Slack",           connected: false },
      { name: "Microsoft Teams", connected: false },
    ],
  },
];

const TOTAL_PLATFORMS = CATEGORIES.reduce((s, c) => s + c.platforms.length, 0);
const TOTAL_CONNECTED = CATEGORIES.reduce((s, c) => s + c.platforms.filter((p) => p.connected).length, 0);

// ── Platform card ─────────────────────────────────────────────────────────────
function PlatformCard({ platform }: { platform: Platform }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(platform.connected);

  function handleClick() {
    if (connected) return;
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setConnected(true); }, 1600);
  }

  return (
    <div className={cn(
      "rounded-xl border p-3 flex flex-col gap-2 transition-all",
      connected ? "border-emerald-500/25 bg-emerald-500/5" : "border-border bg-card hover:border-primary/30"
    )}>
      <div className="flex items-start justify-between gap-1">
        <p className="text-[12px] font-semibold leading-tight">{platform.name}</p>
        <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1",
          connected ? platform.health === "attention" ? "bg-amber-400" : "bg-emerald-500" : "bg-muted-foreground/20"
        )} />
      </div>

      {connected && platform.syncTime && (
        <div className="flex items-center gap-1">
          <RefreshCw className="h-2.5 w-2.5 text-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground">{platform.syncTime}</span>
        </div>
      )}

      {connected && (
        <span className={cn("text-[10px] font-semibold flex items-center gap-1",
          platform.health === "attention" ? "text-amber-500" : "text-emerald-500"
        )}>
          {platform.health === "attention"
            ? <><AlertTriangle className="h-2.5 w-2.5" /> Needs attention</>
            : <><CheckCircle2 className="h-2.5 w-2.5" /> Healthy</>
          }
        </span>
      )}

      <button
        onClick={handleClick}
        disabled={connecting || connected}
        className={cn(
          "mt-auto w-full rounded-lg py-1.5 text-[11px] font-bold transition-all",
          connected
            ? "bg-emerald-500/10 text-emerald-600 cursor-default"
            : connecting
              ? "bg-primary/40 text-primary-foreground cursor-wait"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {connected ? "✓ Connected" : connecting ? "Connecting…" : "Connect"}
      </button>
    </div>
  );
}

// ── Category accordion row ────────────────────────────────────────────────────
function CategoryRow({ category, open, onToggle, query }: {
  category: Category; open: boolean; onToggle: () => void; query: string;
}) {
  const connectedCount = category.platforms.filter((p) => p.connected).length;
  const hasAttention = category.platforms.some((p) => p.health === "attention");

  const filtered = query
    ? category.platforms.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : category.platforms;

  if (query && filtered.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="text-base shrink-0 select-none">{category.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{category.label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{category.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAttention && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          {connectedCount > 0 ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
              {connectedCount}/{category.platforms.length}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {category.platforms.length}
            </span>
          )}
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground/50 transition-transform duration-200", open && "rotate-90")} />
        </div>
      </button>

      {(open || query) && (
        <div className="border-t px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map((p) => <PlatformCard key={p.name} platform={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConnectPage() {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(["Advertising", "Website & Analytics"]));
  const [query, setQuery] = useState("");

  function toggle(label: string) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const connectedCats = CATEGORIES.filter((c) => c.platforms.some((p) => p.connected)).length;
  const attentionCount = CATEGORIES.flatMap((c) => c.platforms).filter((p) => p.health === "attention").length;

  return (
    <>
      <PageHeader title="Marketing Data Hub" />
      <PageContent publicPage>

        {/* ── Hero stats ── */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Plug className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Connected Sources</p>
                <p className="text-2xl font-bold">
                  {TOTAL_CONNECTED}
                  <span className="text-muted-foreground text-base font-normal">/{TOTAL_PLATFORMS}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-500">{connectedCats}</p>
                <p className="text-[11px] text-muted-foreground">Active categories</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{CATEGORIES.length}</p>
                <p className="text-[11px] text-muted-foreground">Total categories</p>
              </div>
              {attentionCount > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-500">{attentionCount}</p>
                  <p className="text-[11px] text-muted-foreground">Need attention</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">Live syncing</span>
              </div>
            </div>
          </div>

          <div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(TOTAL_CONNECTED / TOTAL_PLATFORMS) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {TOTAL_PLATFORMS - TOTAL_CONNECTED} more sources available — each one powers deeper AI recommendations
            </p>
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const conn = c.platforms.filter((p) => p.connected).length;
            const attn = c.platforms.some((p) => p.health === "attention");
            return (
              <button
                key={c.label}
                onClick={() => { setOpenCats(new Set([c.label])); }}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/40",
                  conn > 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : "bg-card text-muted-foreground"
                )}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
                {conn > 0 && <span className="font-bold ml-0.5">·{conn}</span>}
                {attn && <AlertTriangle className="h-2.5 w-2.5 text-amber-500 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* ── Search + expand/collapse ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 150+ platforms…"
              className="w-full rounded-xl border bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
            />
          </div>
          {!query && (
            <>
              <button onClick={() => setOpenCats(new Set(CATEGORIES.map((c) => c.label)))} className="rounded-lg border bg-card px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap">
                Expand all
              </button>
              <button onClick={() => setOpenCats(new Set())} className="rounded-lg border bg-card px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap">
                Collapse all
              </button>
            </>
          )}
        </div>

        {/* ── Accordions ── */}
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <CategoryRow
              key={cat.label}
              category={cat}
              open={openCats.has(cat.label)}
              onToggle={() => toggle(cat.label)}
              query={query}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">Every connection powers the AI engine.</p>
            <p className="text-xs text-muted-foreground">The more sources connected, the more accurate Nexoryx's recommendations become. Connect your full stack to unlock 100% Decision Intelligence.</p>
          </div>
        </div>

      </PageContent>
    </>
  );
}
