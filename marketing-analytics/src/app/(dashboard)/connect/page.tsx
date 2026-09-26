"use client";

import { useState } from "react";
import {
  ChevronRight, CheckCircle2,
  Search, Plug, Wifi, Zap, Loader2, X, Key, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { useIntegrations } from "@/hooks/use-integrations";

// ── Types ─────────────────────────────────────────────────────────────────────
type AuthType = "oauth" | "api_key" | "api_key_woocommerce";

interface Platform {
  name: string;
  providerId?: string;
  authType?: AuthType;
  keyLabel?: string;   // label shown in the API key input modal
  keyHint?: string;    // placeholder hint for the key
  docsUrl?: string;    // link to "how to get your API key"
}
interface Category { emoji: string; label: string; description: string; platforms: Platform[] }

// ── Provider sets ─────────────────────────────────────────────────────────────
const OAUTH_PROVIDERS = new Set([
  "ga4", "google_ads", "meta_ads", "shopify", "linkedin_ads",
  "tiktok_ads", "pinterest_ads", "snapchat_ads", "bing_ads", "salesforce",
]);
const API_KEY_PROVIDERS = new Set([
  "klaviyo", "mailchimp", "hubspot", "activecampaign", "woocommerce",
  "google_search_console", "youtube", "twitter_ads", "reddit_ads",
  "mixpanel", "amplitude", "segment", "hotjar", "stripe",
  "bigcommerce", "brevo", "drip", "intercom", "pipedrive", "zoho_crm",
]);

// ── Platform data ─────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    emoji: "📢", label: "Advertising", description: "Paid campaign performance and attribution.",
    platforms: [
      { name: "Google Ads",       providerId: "google_ads",   authType: "oauth" },
      { name: "Meta Ads",         providerId: "meta_ads",     authType: "oauth" },
      { name: "Microsoft Ads",    providerId: "bing_ads",     authType: "oauth" },
      { name: "TikTok Ads",       providerId: "tiktok_ads",   authType: "oauth" },
      { name: "LinkedIn Ads",     providerId: "linkedin_ads", authType: "oauth" },
      { name: "Pinterest Ads",    providerId: "pinterest_ads",authType: "oauth" },
      { name: "Snapchat Ads",     providerId: "snapchat_ads", authType: "oauth" },
      { name: "X Ads",            providerId: "twitter_ads",  authType: "api_key", keyLabel: "Bearer Token", keyHint: "AAAA…", docsUrl: "https://developer.twitter.com/en/docs/authentication/oauth-2-0/bearer-tokens" },
      { name: "Reddit Ads",       providerId: "reddit_ads",   authType: "api_key", keyLabel: "API Key",      keyHint: "your-reddit-api-key" },
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
      { name: "Google Analytics 4",       providerId: "ga4",                   authType: "oauth" },
      { name: "Google Search Console",    providerId: "google_search_console",  authType: "api_key", keyLabel: "Verified Site URL", keyHint: "https://example.com", docsUrl: "https://search.google.com/search-console" },
      { name: "Hotjar",                   providerId: "hotjar",                 authType: "api_key", keyLabel: "API Key", keyHint: "hjk_…", docsUrl: "https://help.hotjar.com/hc/en-us/articles/115009336727" },
      { name: "Mixpanel",                 providerId: "mixpanel",               authType: "api_key", keyLabel: "Project Token", keyHint: "your-project-token" },
      { name: "Amplitude",                providerId: "amplitude",              authType: "api_key", keyLabel: "API Key", keyHint: "your-amplitude-api-key" },
      { name: "Segment",                  providerId: "segment",                authType: "api_key", keyLabel: "Write Key", keyHint: "your-segment-write-key" },
      { name: "Google Tag Manager" },
      { name: "Microsoft Clarity" },
      { name: "Adobe Analytics" },
      { name: "Cloudflare Web Analytics" },
      { name: "Plausible" },
      { name: "Matomo" },
      { name: "PostHog" },
    ],
  },
  {
    emoji: "🔍", label: "SEO Intelligence", description: "Organic search visibility.",
    platforms: [
      { name: "Google Search Console", providerId: "google_search_console", authType: "api_key", keyLabel: "Verified Site URL", keyHint: "https://example.com" },
      { name: "SEMrush" },
      { name: "Ahrefs" },
      { name: "Moz" },
      { name: "Screaming Frog" },
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
      { name: "YouTube",      providerId: "youtube",    authType: "api_key", keyLabel: "Channel ID", keyHint: "UCxxxxxxxxxxxxxxxxxxxxxx", docsUrl: "https://support.google.com/youtube/answer/3250431" },
      { name: "Facebook Pages" },
      { name: "Instagram" },
      { name: "LinkedIn" },
      { name: "TikTok" },
      { name: "X (Twitter)" },
      { name: "Pinterest" },
      { name: "Threads" },
      { name: "Reddit" },
    ],
  },
  {
    emoji: "📩", label: "Email Marketing", description: "Email campaigns and automation.",
    platforms: [
      { name: "Klaviyo",          providerId: "klaviyo",       authType: "api_key", keyLabel: "Private API Key", keyHint: "pk_…", docsUrl: "https://developers.klaviyo.com/en/reference/api_overview" },
      { name: "Mailchimp",        providerId: "mailchimp",     authType: "api_key", keyLabel: "API Key", keyHint: "xxxx-us1", docsUrl: "https://mailchimp.com/help/about-api-keys/" },
      { name: "Brevo",            providerId: "brevo",         authType: "api_key", keyLabel: "API Key", keyHint: "xkeysib-…" },
      { name: "ActiveCampaign",   providerId: "activecampaign",authType: "api_key", keyLabel: "API Key", keyHint: "your-activecampaign-key" },
      { name: "Drip",             providerId: "drip",          authType: "api_key", keyLabel: "API Token", keyHint: "your-drip-token" },
      { name: "Campaign Monitor" },
      { name: "Constant Contact" },
      { name: "MailerLite" },
      { name: "HubSpot Email",   providerId: "hubspot",       authType: "api_key", keyLabel: "Private App Token", keyHint: "pat-na1-…", docsUrl: "https://developers.hubspot.com/docs/api/private-apps" },
      { name: "Omnisend" },
      { name: "ConvertKit" },
    ],
  },
  {
    emoji: "🛒", label: "Ecommerce", description: "Sales and product data.",
    platforms: [
      { name: "Shopify",     providerId: "shopify",     authType: "oauth" },
      { name: "WooCommerce", providerId: "woocommerce", authType: "api_key_woocommerce" },
      { name: "BigCommerce", providerId: "bigcommerce", authType: "api_key", keyLabel: "API Key", keyHint: "your-bigcommerce-api-key" },
      { name: "Magento" },
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
      { name: "HubSpot CRM",  providerId: "hubspot",   authType: "api_key", keyLabel: "Private App Token", keyHint: "pat-na1-…", docsUrl: "https://developers.hubspot.com/docs/api/private-apps" },
      { name: "Salesforce",   providerId: "salesforce",authType: "oauth" },
      { name: "Pipedrive",    providerId: "pipedrive", authType: "api_key", keyLabel: "API Token", keyHint: "your-pipedrive-token", docsUrl: "https://pipedrive.readme.io/docs/how-to-find-the-api-token" },
      { name: "Zoho CRM",     providerId: "zoho_crm",  authType: "api_key", keyLabel: "API Key", keyHint: "your-zoho-api-key" },
      { name: "Intercom",     providerId: "intercom",  authType: "api_key", keyLabel: "Access Token", keyHint: "your-intercom-token", docsUrl: "https://developers.intercom.com/building-apps/docs/authentication-types" },
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
      { name: "HubSpot Forms", providerId: "hubspot", authType: "api_key", keyLabel: "Private App Token", keyHint: "pat-na1-…" },
      { name: "Unbounce" },
      { name: "Leadpages" },
    ],
  },
  {
    emoji: "💳", label: "Revenue & Finance", description: "Revenue attribution and financial data.",
    platforms: [
      { name: "Stripe",     providerId: "stripe", authType: "api_key", keyLabel: "Restricted API Key", keyHint: "rk_live_…", docsUrl: "https://stripe.com/docs/keys" },
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
      { name: "Intercom",    providerId: "intercom",  authType: "api_key", keyLabel: "Access Token", keyHint: "your-intercom-token" },
      { name: "Zendesk" },
      { name: "Freshdesk" },
      { name: "Help Scout" },
      { name: "Gorgias" },
    ],
  },
  {
    emoji: "📊", label: "Product Analytics", description: "Product usage and behaviour.",
    platforms: [
      { name: "Mixpanel",  providerId: "mixpanel",  authType: "api_key", keyLabel: "Project Token", keyHint: "your-project-token" },
      { name: "Amplitude", providerId: "amplitude", authType: "api_key", keyLabel: "API Key", keyHint: "your-amplitude-api-key" },
      { name: "Segment",   providerId: "segment",   authType: "api_key", keyLabel: "Write Key", keyHint: "your-segment-write-key" },
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
      { name: "Segment", providerId: "segment", authType: "api_key", keyLabel: "Write Key", keyHint: "your-segment-write-key" },
    ],
  },
  {
    emoji: "📹", label: "Content & Video", description: "Video and content performance.",
    platforms: [
      { name: "YouTube", providerId: "youtube", authType: "api_key", keyLabel: "Channel ID", keyHint: "UCxxxxxxxxxxxxxxxxxxxxxx" },
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
      { name: "Shopify CMS", providerId: "shopify", authType: "oauth" },
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
const _CACHE_BUST = "v2"; // shopify domain modal

// ── API Key Modal ─────────────────────────────────────────────────────────────
function ApiKeyModal({
  platform, onClose, onSuccess,
}: {
  platform: Platform;
  onClose: () => void;
  onSuccess: (providerId: string) => void;
}) {
  const [key, setKey] = useState("");
  const [wcUrl, setWcUrl] = useState("");
  const [wcSecret, setWcSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isWoo = platform.authType === "api_key_woocommerce";

  async function save() {
    if (!platform.providerId) return;
    setSaving(true);
    setErr("");
    try {
      const body = isWoo
        ? { provider: platform.providerId, url: wcUrl, key, secret: wcSecret }
        : { provider: platform.providerId, key };
      const res = await fetch("/api/connect/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      onSuccess(platform.providerId);
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="font-semibold text-sm">Connect {platform.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Enter your credentials to connect</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {isWoo && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Store URL</label>
              <input
                value={wcUrl}
                onChange={e => setWcUrl(e.target.value)}
                placeholder="https://mystore.com"
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {platform.keyLabel ?? "API Key"}
              </label>
              {platform.docsUrl && (
                <a href={platform.docsUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <ExternalLink className="h-2.5 w-2.5" />
                  How to find it
                </a>
              )}
            </div>
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder={platform.keyHint ?? "Paste your key here…"}
              type="password"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 font-mono"
            />
          </div>

          {isWoo && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Consumer Secret</label>
              <input
                value={wcSecret}
                onChange={e => setWcSecret(e.target.value)}
                placeholder="cs_…"
                type="password"
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 font-mono"
              />
            </div>
          )}

          {err && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>
          )}

          <p className="text-[11px] text-muted-foreground">
            Your credentials are encrypted and stored securely. We never share them.
          </p>
        </div>

        <div className="flex gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !key || (isWoo && (!wcUrl || !wcSecret))}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {saving ? "Saving…" : "Save & Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Platform card ─────────────────────────────────────────────────────────────
function PlatformCard({
  platform, isConnected, isDemo, onDisconnect, onConnected,
}: {
  platform: Platform;
  isConnected: boolean;
  isDemo: boolean;
  onDisconnect: (providerId: string) => void;
  onConnected: (providerId: string) => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopDomain, setShopDomain] = useState("");

  const hasOAuth   = platform.providerId && OAUTH_PROVIDERS.has(platform.providerId);
  const hasApiKey  = platform.providerId && API_KEY_PROVIDERS.has(platform.providerId);
  const hasApiKeyWoo = platform.authType === "api_key_woocommerce";
  const canConnect = hasOAuth || hasApiKey || hasApiKeyWoo;

  // In demo mode show select platforms as connected
  const DEMO_CONNECTED = new Set([
    "Google Ads","Meta Ads","Google Analytics 4","Shopify","TikTok Ads",
    "Facebook Pages","Instagram","Klaviyo","HubSpot CRM","Stripe","YouTube",
    "Google Search Console",
  ]);
  const showConnected = isDemo ? DEMO_CONNECTED.has(platform.name) : isConnected;

  async function handleConnect() {
    if (hasOAuth && platform.providerId) {
      if (platform.providerId === "shopify") {
        setShowShopModal(true);
      } else {
        window.location.href = `/api/connect/${platform.providerId}`;
      }
    } else if (hasApiKey || hasApiKeyWoo) {
      setShowModal(true);
    }
  }

  async function handleDisconnect() {
    if (!platform.providerId) return;
    setDisconnecting(true);
    await onDisconnect(platform.providerId);
    setDisconnecting(false);
  }

  return (
    <>
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-sm">Connect Shopify Store</h3>
              <button onClick={() => setShowShopModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <label className="text-xs font-medium text-muted-foreground">Your Shopify store domain</label>
              <div className="flex items-center rounded-xl border bg-background overflow-hidden">
                <input
                  value={shopDomain}
                  onChange={e => setShopDomain(e.target.value.replace(/https?:\/\/|\.myshopify\.com.*/g, ""))}
                  placeholder="your-store"
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent font-mono"
                />
                <span className="px-3 text-xs text-muted-foreground border-l py-2.5">.myshopify.com</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Enter just the store name, e.g. <span className="font-mono">my-store</span></p>
            </div>
            <div className="flex gap-2 border-t px-5 py-4">
              <button onClick={() => setShowShopModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={() => { if (shopDomain) { const slug = shopDomain.replace(/https?:\/\/|\.myshopify\.com.*/g, "").trim(); window.location.href = `/api/connect/shopify?shop=${slug}.myshopify.com`; } }}
                disabled={!shopDomain}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >Connect</button>
            </div>
          </div>
        </div>
      )}
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
            showConnected ? "bg-emerald-500" : canConnect ? "bg-muted-foreground/20" : "bg-muted-foreground/10"
          )} />
        </div>

        {showConnected && (
          <span className="text-[10px] font-semibold flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="h-2.5 w-2.5" /> Connected
          </span>
        )}

        {!showConnected && !canConnect && (
          <span className="text-[10px] text-muted-foreground/50">Coming soon</span>
        )}

        {!showConnected && hasApiKey && !hasOAuth && (
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <Key className="h-2.5 w-2.5" /> API key
          </span>
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
        ) : !showConnected && canConnect ? (
          <button
            onClick={handleConnect}
            className={cn(
              "mt-auto w-full rounded-lg py-1.5 text-[11px] font-bold transition-all",
              hasOAuth
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            )}
          >
            {hasOAuth ? "Connect" : "Enter API Key"}
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

      {showModal && platform.providerId && (
        <ApiKeyModal
          platform={platform}
          onClose={() => setShowModal(false)}
          onSuccess={(id) => {
            onConnected(id);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

// ── Category accordion row ────────────────────────────────────────────────────
function CategoryRow({
  category, open, onToggle, query, connectedProviders, isDemo, onDisconnect, onConnected,
}: {
  category: Category; open: boolean; onToggle: () => void; query: string;
  connectedProviders: Record<string, boolean>; isDemo: boolean;
  onDisconnect: (providerId: string) => void;
  onConnected: (providerId: string) => void;
}) {
  const DEMO_CONNECTED = new Set([
    "Google Ads","Meta Ads","Google Analytics 4","Shopify","TikTok Ads",
    "Facebook Pages","Instagram","Klaviyo","HubSpot CRM","Stripe","YouTube",
    "Google Search Console",
  ]);

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
                key={p.name + (p.providerId ?? "")}
                platform={p}
                isConnected={!!(p.providerId && connectedProviders[p.providerId])}
                isDemo={isDemo}
                onDisconnect={onDisconnect}
                onConnected={onConnected}
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
  const { connected, source, loading, refetch, disconnect } = useIntegrations();

  const isDemo = source === "demo";
  const DEMO_CONNECTED_NAMES = [
    "Google Ads","Meta Ads","Google Analytics 4","Shopify","TikTok Ads",
    "Facebook Pages","Instagram","Klaviyo","HubSpot CRM","Stripe","YouTube",
    "Google Search Console",
  ];

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

  // Called when an API key connect succeeds — optimistically update state
  function handleConnected(providerId: string) {
    refetch();
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
              placeholder="Search 160+ platforms…"
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
              onConnected={handleConnected}
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
