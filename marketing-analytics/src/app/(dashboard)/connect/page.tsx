"use client";

import { useState } from "react";
import {
  ChevronRight, CheckCircle2, AlertTriangle,
  Search, Plug, RefreshCw, Wifi, Zap, Loader2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { useIntegrations } from "@/hooks/use-integrations";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Platform {
  name: string;
  providerId?: string;  // matches OAUTH_PROVIDERS key — undefined = no OAuth yet
}
interface Category { emoji: string; label: string; description: string; platforms: Platform[] }

// ── Provider ID → OAuth path mapping ─────────────────────────────────────────
// These are the platforms with real OAuth flows built in /api/connect/[provider]
const SUPPORTED_PROVIDERS = new Set([
  "google_ads", "meta_ads", "shopify", "linkedin_ads",
  "tiktok_ads", "pinterest_ads", "snapchat_ads", "bing_ads", "salesforce",
]);

// ── Platform data ─────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    emoji: "📢", label: "Advertising", description: "Paid campaign performance and attribution.",
    platforms: [
      { name: "Google Ads",       providerId: "google_ads" },
      { name: "Meta Ads",         providerId: "meta_ads" },
      { name: "Microsoft Ads",    providerId: "bing_ads" },
      { name: "TikTok Ads",       providerId: "tiktok_ads" },
      { name: "LinkedIn Ads",     providerId: "linkedin_ads" },
      { name: "Pinterest Ads",    providerId: "pinterest_ads" },
      { name: "Snapchat Ads",     providerId: "snapchat_ads" },
      { name: "X Ads" },
      { name: "Reddit Ads" },
      { name: "Amazon Ads" },
      { name: "DV360" },
      { name: "The Trade Desk" },
      { name: "Criteo" },
      { name: "Taboola" },
      { name: "Outbrain" },
    ],
  },
  {
    emoji: "🌐", label: "Website & Analytics", description: "Website traffic and user behaviour.",
    platforms: [
      { name: "Google Analytics 4",       providerId: "ga4" },
      { name: "Google Tag Manager" },
      { name: "Google Search Console" },
      { name: "Microsoft Clarity" },
      { name: "Hotjar" },
      { name: "Adobe Analytics" },
      { name: "Cloudflare Web Analytics" },
      { name: "Plausible" },
      { name: "Matomo" },
      { name: "Mixpanel" },
      { name: "Amplitude" },
    ],
  },
  {
    emoji: "🔍", label: "SEO Intelligence", description: "Organic search visibility.",
    platforms: [
      { name: "SEMrush" },
      { name: "Ahrefs" },
      { name: "Moz" },
      { name: "Screaming Frog" },
      { name: "Google Search Console" },
      { name: "Majestic" },
      { name: "BrightEdge" },
      { name: "Conductor" },
      { name: "Surfer SEO" },
      { name: "SEOTesting" },
    ],
  },
  {
    emoji: "📱", label: "Social Media", description: "Organic social performance.",
    platforms: [
      { name: "Facebook Pages" },
      { name: "Instagram" },
      { name: "LinkedIn" },
      { name: "TikTok" },
      { name: "X (Twitter)" },
      { name: "YouTube" },
      { name: "Pinterest" },
      { name: "Threads" },
      { name: "Reddit" },
    ],
  },
  {
    emoji: "📩", label: "Email Marketing", description: "Email campaigns and automation.",
    platforms: [
      { name: "Mailchimp" },
      { name: "Klaviyo" },
      { name: "Brevo" },
      { name: "Campaign Monitor" },
      { name: "Constant Contact" },
      { name: "MailerLite" },
      { name: "HubSpot Email" },
      { name: "ActiveCampaign" },
      { name: "Omnisend" },
      { name: "ConvertKit" },
    ],
  },
  {
    emoji: "🛒", label: "Ecommerce", description: "Sales and product data.",
    platforms: [
      { name: "Shopify",              providerId: "shopify" },
      { name: "WooCommerce" },
      { name: "Magento" },
      { name: "BigCommerce" },
      { name: "Squarespace Commerce" },
      { name: "Wix Stores" },
      { name: "Ecwid" },
      { name: "PrestaShop" },
      { name: "OpenCart" },
    ],
  },
  {
    emoji: "👥", label: "CRM & Sales", description: "Lead and customer intelligence.",
    platforms: [
      { name: "HubSpot CRM" },
      { name: "Salesforce",  providerId: "salesforce" },
      { name: "Zoho CRM" },
      { name: "Pipedrive" },
      { name: "Monday CRM" },
      { name: "Freshsales" },
      { name: "Copper" },
      { name: "Insightly" },
      { name: "Capsule CRM" },
    ],
  },
  {
    emoji: "📋", label: "Forms & Lead Generation", description: "Lead capture forms and landing pages.",
    platforms: [
      { name: "Typeform" },
      { name: "Jotform" },
      { name: "Gravity Forms" },
      { name: "WPForms" },
      { name: "Google Forms" },
      { name: "HubSpot Forms" },
      { name: "Unbounce" },
      { name: "Leadpages" },
    ],
  },
  {
    emoji: "💳", label: "Revenue & Finance", description: "Revenue attribution and financial data.",
    platforms: [
      { name: "Stripe" },
      { name: "PayPal" },
      { name: "QuickBooks" },
      { name: "Xero" },
      { name: "Chargebee" },
      { name: "Paddle" },
      { name: "Square" },
    ],
  },
  {
    emoji: "🛍", label: "Marketplace", description: "Marketplace analytics and listings.",
    platforms: [
      { name: "Amazon Seller Central" },
      { name: "eBay" },
      { name: "Etsy" },
      { name: "TikTok Shop" },
      { name: "Google Merchant Center" },
    ],
  },
  {
    emoji: "📈", label: "Customer Success", description: "Customer retention and support.",
    platforms: [
      { name: "Intercom" },
      { name: "Zendesk" },
      { name: "Freshdesk" },
      { name: "Help Scout" },
      { name: "Gorgias" },
    ],
  },
  {
    emoji: "📊", label: "Product Analytics", description: "Product usage and behaviour.",
    platforms: [
      { name: "Mixpanel" },
      { name: "Amplitude" },
      { name: "Heap" },
      { name: "PostHog" },
      { name: "Pendo" },
      { name: "FullStory" },
    ],
  },
  {
    emoji: "🎯", label: "Attribution & Tracking", description: "Marketing attribution modelling.",
    platforms: [
      { name: "Triple Whale" },
      { name: "Hyros" },
      { name: "Northbeam" },
      { name: "Rockerbox" },
      { name: "Segment" },
    ],
  },
  {
    emoji: "📹", label: "Content & Video", description: "Video and content performance.",
    platforms: [
      { name: "YouTube" },
      { name: "Vimeo" },
      { name: "Wistia" },
      { name: "Loom" },
    ],
  },
  {
    emoji: "🤖", label: "AI Platforms", description: "AI-generated marketing assets and performance.",
    platforms: [
      { name: "OpenAI" },
      { name: "Claude" },
      { name: "Gemini" },
      { name: "Perplexity" },
      { name: "Midjourney" },
      { name: "Canva" },
    ],
  },
  {
    emoji: "⭐", label: "Reviews & Reputation", description: "Brand reputation and reviews.",
    platforms: [
      { name: "Google Business Profile" },
      { name: "Trustpilot" },
      { name: "Yelp" },
      { name: "Tripadvisor" },
      { name: "Feefo" },
      { name: "Reviews.io" },
    ],
  },
  {
    emoji: "📍", label: "Local Marketing", description: "Location performance and local presence.",
    platforms: [
      { name: "Google Business Profile" },
      { name: "Apple Business Connect" },
      { name: "Bing Places" },
    ],
  },
  {
    emoji: "📰", label: "Content Management", description: "Website content and CMS platforms.",
    platforms: [
      { name: "WordPress" },
      { name: "Webflow" },
      { name: "Shopify CMS" },
      { name: "Contentful" },
      { name: "Sanity" },
      { name: "Ghost" },
    ],
  },
  {
    emoji: "📅", label: "Marketing Productivity", description: "Project management and team tools.",
    platforms: [
      { name: "Asana" },
      { name: "Monday.com" },
      { name: "ClickUp" },
      { name: "Notion" },
      { name: "Trello" },
      { name: "Jira" },
      { name: "Slack" },
      { name: "Microsoft Teams" },
    ],
  },
];

const TOTAL_PLATFORMS = CATEGORIES.reduce((s, c) => s + c.platforms.length, 0);

// ── Platform card ─────────────────────────────────────────────────────────────
function PlatformCard({
  platform, isConnected, isDemo, onDisconnect,
}: {
  platform: Platform;
  isConnected: boolean;
  isDemo: boolean;
  onDisconnect: (providerId: string) => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const hasOAuth = platform.providerId && SUPPORTED_PROVIDERS.has(platform.providerId);

  async function handleConnect() {
    if (!hasOAuth || !platform.providerId) return;
    window.location.href = `/api/connect/${platform.providerId}`;
  }

  async function handleDisconnect() {
    if (!platform.providerId) return;
    setDisconnecting(true);
    await onDisconnect(platform.providerId);
    setDisconnecting(false);
  }

  // In demo mode show as connected for the demo platforms
  const showConnected = isDemo
    ? ["Google Ads","Meta Ads","Google Analytics 4","Shopify","TikTok Ads","Facebook Pages","Instagram","Klaviyo","HubSpot CRM","Stripe","YouTube"].includes(platform.name)
    : isConnected;

  return (
    <div className={cn(
      "rounded-xl border p-3 flex flex-col gap-2 transition-all",
      showConnected
        ? "border-emerald-500/25 bg-emerald-500/5"
        : "border-border bg-card hover:border-primary/30"
    )}>
      <div className="flex items-start justify-between gap-1">
        <p className="text-[12px] font-semibold leading-tight">{platform.name}</p>
        <div className={cn(
          "h-2 w-2 rounded-full shrink-0 mt-1",
          showConnected ? "bg-emerald-500" : "bg-muted-foreground/20"
        )} />
      </div>

      {showConnected && (
        <span className="text-[10px] font-semibold flex items-center gap-1 text-emerald-500">
          <CheckCircle2 className="h-2.5 w-2.5" /> Connected
        </span>
      )}

      {!showConnected && !hasOAuth && (
        <span className="text-[10px] text-muted-foreground/50">Coming soon</span>
      )}

      {showConnected && platform.providerId && !isDemo ? (
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="mt-auto w-full rounded-lg py-1.5 text-[11px] font-bold bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-1"
        >
          {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Disconnect
        </button>
      ) : !showConnected && hasOAuth ? (
        <button
          onClick={handleConnect}
          className="mt-auto w-full rounded-lg py-1.5 text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Connect
        </button>
      ) : showConnected ? (
        <div className="mt-auto w-full rounded-lg py-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 text-center cursor-default">
          ✓ Connected
        </div>
      ) : (
        <div className="mt-auto w-full rounded-lg py-1.5 text-[11px] font-medium bg-muted/50 text-muted-foreground/40 text-center cursor-default">
          Coming soon
        </div>
      )}
    </div>
  );
}

// ── Category accordion row ────────────────────────────────────────────────────
function CategoryRow({
  category, open, onToggle, query, connectedProviders, isDemo, onDisconnect,
}: {
  category: Category; open: boolean; onToggle: () => void; query: string;
  connectedProviders: Record<string, boolean>; isDemo: boolean;
  onDisconnect: (providerId: string) => void;
}) {
  const DEMO_CONNECTED = new Set(["Google Ads","Meta Ads","Google Analytics 4","Shopify","TikTok Ads","Facebook Pages","Instagram","Klaviyo","HubSpot CRM","Stripe","YouTube"]);

  const connectedCount = isDemo
    ? category.platforms.filter(p => DEMO_CONNECTED.has(p.name)).length
    : category.platforms.filter(p => p.providerId && connectedProviders[p.providerId]).length;

  const filtered = query
    ? category.platforms.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
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
            {filtered.map(p => (
              <PlatformCard
                key={p.name}
                platform={p}
                isConnected={!!(p.providerId && connectedProviders[p.providerId])}
                isDemo={isDemo}
                onDisconnect={onDisconnect}
              />
            ))}
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
  const { connected, source, loading, disconnect } = useIntegrations();

  const isDemo = source === "demo";
  const DEMO_CONNECTED_NAMES = ["Google Ads","Meta Ads","Google Analytics 4","Shopify","TikTok Ads","Facebook Pages","Instagram","Klaviyo","HubSpot CRM","Stripe","YouTube"];

  const totalConnected = isDemo
    ? DEMO_CONNECTED_NAMES.length
    : Object.values(connected).filter(Boolean).length;

  const connectedCats = isDemo
    ? CATEGORIES.filter(c => c.platforms.some(p => DEMO_CONNECTED_NAMES.includes(p.name))).length
    : CATEGORIES.filter(c => c.platforms.some(p => p.providerId && connected[p.providerId])).length;

  function toggle(label: string) {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

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
                  {loading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : totalConnected}
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
              {totalConnected > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">
                    {isDemo ? "Demo data" : "Live syncing"}
                  </span>
                </div>
              )}
              {!loading && totalConnected === 0 && !isDemo && (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">Connect your first source</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(totalConnected / TOTAL_PLATFORMS) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {TOTAL_PLATFORMS - totalConnected} more sources available — each one powers deeper AI recommendations
            </p>
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => {
            const conn = isDemo
              ? c.platforms.filter(p => DEMO_CONNECTED_NAMES.includes(p.name)).length
              : c.platforms.filter(p => p.providerId && connected[p.providerId]).length;
            return (
              <button
                key={c.label}
                onClick={() => setOpenCats(new Set([c.label]))}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/40",
                  conn > 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : "bg-card text-muted-foreground"
                )}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
                {conn > 0 && <span className="font-bold ml-0.5">·{conn}</span>}
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
              onChange={e => setQuery(e.target.value)}
              placeholder="Search 150+ platforms…"
              className="w-full rounded-xl border bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
            />
          </div>
          {!query && (
            <>
              <button onClick={() => setOpenCats(new Set(CATEGORIES.map(c => c.label)))} className="rounded-lg border bg-card px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap">
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
          {CATEGORIES.map(cat => (
            <CategoryRow
              key={cat.label}
              category={cat}
              open={openCats.has(cat.label)}
              onToggle={() => toggle(cat.label)}
              query={query}
              connectedProviders={connected}
              isDemo={isDemo}
              onDisconnect={disconnect}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Don't see your platform?</p>
            <p className="text-xs text-muted-foreground">We add new integrations every week. Request one and we'll prioritise it.</p>
          </div>
          <a href="mailto:sub17h4@gmail.com?subject=Integration Request"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
            Request integration
          </a>
        </div>

      </PageContent>
    </>
  );
}
