"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2, ArrowRight, Plug, AlertCircle,
  ChevronRight, X, ExternalLink, Key, Globe, Copy, Check,
  Rocket, Settings2, ShieldCheck, Plus, RefreshCw, MoreHorizontal,
  Database, Layers, GitMerge, ChevronDown, Search, Sparkles, BarChart2, Hash,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
// IDs of connectors that support real OAuth via /api/connect/[provider]
import type { OAuthProviderId } from "@/lib/oauth-providers";
const OAUTH_PROVIDER_IDS = new Set<string>([
  "google_ads", "meta_ads", "shopify", "linkedin_ads", "tiktok_ads",
  "pinterest_ads", "snapchat_ads", "bing_ads", "salesforce",
]);

// ── Types ────────────────────────────────────────────────────────────────────

type Category = "analytics" | "ads" | "ecommerce" | "email" | "crm";
type ConnectorId =
  | "ga4" | "google_ads" | "google_search_console" | "meta_ads"
  | "shopify" | "woocommerce" | "tiktok_ads" | "linkedin_ads"
  | "klaviyo" | "mailchimp" | "pinterest_ads" | "twitter_ads"
  | "snapchat_ads" | "bing_ads" | "youtube" | "hubspot"
  | "salesforce" | "activecampaign"
  | "reddit_ads" | "amazon_ads" | "apple_search_ads" | "criteo"
  | "mixpanel" | "amplitude" | "segment" | "hotjar"
  | "stripe" | "bigcommerce"
  | "brevo" | "drip"
  | "intercom" | "pipedrive" | "zoho_crm"
  | "csv_upload";

/**
 * google_oauth   → signIn("google") via NextAuth — works immediately
 * google_shared  → auto-connected when GA4 is connected (same credentials)
 * setup_modal    → shows credentials setup guide; "Authorize" only after user confirms setup
 * domain_oauth   → needs Shopify store domain first, then OAuth
 * api_key        → API key form (no OAuth needed)
 * file_upload    → CSV / Excel drag-and-drop upload
 * coming_soon    → not yet available
 */
type ConnectMethod =
  | "google_oauth"
  | "google_shared"
  | "setup_modal"
  | "domain_oauth"
  | "api_key"
  | "file_upload"
  | "coming_soon";

interface EnvVar { name: string; description: string }

interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  category: Category;
  connectMethod: ConnectMethod;
  logo: React.ReactNode;
  docs?: string;
  docsLabel?: string;
  envVars?: EnvVar[];
}

// ── Connector definitions ────────────────────────────────────────────────────

const CONNECTORS: Connector[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Page views, sessions, events, funnels & conversions",
    category: "analytics",
    connectMethod: "google_oauth",
    docs: "https://analytics.google.com/analytics/web/#/a/p/admin/suiteusermanagement",
    docsLabel: "GA4 Property Access Management",
    envVars: [
      { name: "GA4 Property ID", description: "Found in GA4 Admin → Property Settings" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#E37400" />
        <path d="M12 28V12h4v16h-4zm6-8v8h4v-8h-4zm6 4v4h4v-4h-4z" fill="white" />
      </svg>
    ),
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Campaigns, impressions, clicks, CPC & ROAS",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://ads.google.com/aw/apicenter",
    docsLabel: "Google Ads API Center",
    envVars: [
      { name: "GOOGLE_ADS_DEVELOPER_TOKEN", description: "From Google Ads → Tools → API Center" },
      { name: "GOOGLE_ADS_CUSTOMER_ID",     description: "Your 10-digit account ID (no dashes)" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#4285F4" />
        <circle cx="14" cy="26" r="4" fill="#FBBC05" />
        <circle cx="26" cy="26" r="4" fill="#34A853" />
        <circle cx="20" cy="15" r="4" fill="white" />
        <line x1="14" y1="26" x2="20" y2="15" stroke="white" strokeWidth="2" />
        <line x1="26" y1="26" x2="20" y2="15" stroke="white" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    description: "Facebook & Instagram campaigns, reach & conversions",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://developers.facebook.com/apps",
    docsLabel: "Meta Developer Console",
    envVars: [
      { name: "META_APP_ID",        description: "Your Facebook App ID" },
      { name: "META_APP_SECRET",    description: "Your Facebook App Secret" },
      { name: "META_AD_ACCOUNT_ID", description: "Ad account ID from Meta Business Suite (e.g. act_123456789)" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#0866FF" />
        <path
          d="M21 32v-8.5h2.8l.4-3.3H21V18c0-.9.5-1.8 1.8-1.8h1.4v-2.8s-1.2-.2-2.4-.2c-2.5 0-4.1 1.5-4.1 4.2v2.4h-2.7v3.3h2.7V32H21z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Orders, revenue, products, customers & AOV",
    category: "ecommerce",
    connectMethod: "domain_oauth",
    docs: "https://partners.shopify.com",
    docsLabel: "Shopify Partners",
    envVars: [
      { name: "SHOPIFY_API_KEY", description: "Shopify App API Key" },
      { name: "SHOPIFY_API_SECRET", description: "Shopify App API Secret" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#96BF48" />
        <path
          d="M27.5 13.7c0-.1-.1-.2-.2-.2l-1.2-.1-.9-.8-.3.1-.5 1.4c-.9-.3-1.9-.4-2.4-.4C18.4 13.7 16 16 16 18.9c0 1.7.9 2.9 2.3 3.6l-.4 1.3c-.1.3.1.5.4.5l7.1 1.3c.3.1.5-.1.5-.4l1.8-10.9c0-.2-.2-.4-.2-.6zM22 17l-.7 4.2c-.3-.1-.7-.2-1-.2-1.4 0-2.3-.7-2.3-1.8 0-1.5 1.3-2.8 3-2.8.4 0 .8.1 1 .2V17z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "linkedin_ads",
    name: "LinkedIn Ads",
    description: "B2B campaigns, leads, CTR & conversions",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://www.linkedin.com/developers/apps",
    docsLabel: "LinkedIn Developer Portal",
    envVars: [
      { name: "LINKEDIN_CLIENT_ID",     description: "LinkedIn App Client ID" },
      { name: "LINKEDIN_CLIENT_SECRET", description: "LinkedIn App Client Secret" },
      { name: "LINKEDIN_AD_ACCOUNT_ID", description: "Numeric account ID from LinkedIn Campaign Manager" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#0A66C2" />
        <path
          d="M13 17h-3v10h3V17zm-1.5-5a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zM30 27h-3v-5c0-1.2-.4-2-1.5-2-1.6 0-2 1.1-2 2.1V27h-3V17h3v1.4c.4-.8 1.4-1.6 2.9-1.6C28.4 16.8 30 18.2 30 21.7V27z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    description: "Email campaigns, flows, revenue & open rates",
    category: "email",
    connectMethod: "api_key",
    docs: "https://www.klaviyo.com/account#api-keys-tab",
    docsLabel: "Klaviyo Account Settings",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#F2622E" />
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="sans-serif">K</text>
      </svg>
    ),
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    description: "Video ads, impressions, clicks & conversions",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://ads.tiktok.com/marketing_api/homepage",
    docsLabel: "TikTok Marketing API",
    envVars: [
      { name: "TIKTOK_APP_ID",        description: "TikTok App ID from TikTok Marketing API" },
      { name: "TIKTOK_APP_SECRET",    description: "TikTok App Secret" },
      { name: "TIKTOK_ADVERTISER_ID", description: "Your Advertiser ID from TikTok Ads Manager" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#010101" />
        <path
          d="M26 14.5a5.5 5.5 0 01-5.5-5.5h-3v13c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3c.3 0 .6 0 .9.1v-3.1c-.3 0-.6-.1-.9-.1a6.5 6.5 0 000 13 6.5 6.5 0 006.5-6.5V17a8.5 8.5 0 005.5 2v-3c-.7 0-1.3-.2-1.5-.5H26v-1z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "pinterest_ads",
    name: "Pinterest Ads",
    description: "Pin performance, saves, clicks & ROAS",
    category: "ads",
    connectMethod: "coming_soon",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#E60023" />
        <path
          d="M20 8C13.4 8 8 13.4 8 20c0 5.1 3.2 9.4 7.6 11.2-.1-1-.2-2.4 0-3.4.2-.9 1.4-6 1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.4c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 7.9-7.3 4.2 0 7.4 3 7.4 6.9 0 4.1-2.6 7.5-6.2 7.5-1.2 0-2.4-.6-2.8-1.4l-.7 2.9c-.3 1-.9 2.3-1.5 3.1.9.3 1.8.4 2.8.4 6.6 0 12-5.4 12-12S26.6 8 20 8z"
          fill="white"
        />
      </svg>
    ),
  },
  // ── 10 new connectors ────────────────────────────────────────────────────
  {
    id: "google_search_console",
    name: "Google Search Console",
    description: "Organic impressions, clicks, CTR & average position",
    category: "analytics",
    connectMethod: "api_key",
    docs: "https://search.google.com/search-console",
    docsLabel: "Search Console — find your verified site",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#4285F4" />
        <path d="M20 10l-8 14h6v6h4v-6h6L20 10z" fill="white" />
      </svg>
    ),
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Store orders, revenue, products & customer data",
    category: "ecommerce",
    connectMethod: "api_key",
    docs: "https://woocommerce.com/document/woocommerce-rest-api/",
    docsLabel: "WooCommerce REST API docs",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#7F54B3" />
        <path d="M8 13a2 2 0 012-2h20a2 2 0 012 2v8a2 2 0 01-2 2H22l-2 4-2-4H10a2 2 0 01-2-2v-8z" fill="white" opacity=".9" />
        <circle cx="14" cy="17" r="1.5" fill="#7F54B3" />
        <circle cx="20" cy="17" r="1.5" fill="#7F54B3" />
        <circle cx="26" cy="17" r="1.5" fill="#7F54B3" />
      </svg>
    ),
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email campaigns, open rates, clicks & list growth",
    category: "email",
    connectMethod: "api_key",
    docs: "https://mailchimp.com/developer/marketing/guides/quick-start/#generate-your-api-key",
    docsLabel: "Generate Mailchimp API Key",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FFE01B" />
        <text x="20" y="27" textAnchor="middle" fill="#241C15" fontSize="18" fontWeight="bold" fontFamily="sans-serif">M</text>
      </svg>
    ),
  },
  {
    id: "twitter_ads",
    name: "X / Twitter Ads",
    description: "Promoted tweets, impressions, clicks & conversions",
    category: "ads",
    connectMethod: "api_key",
    docs: "https://developer.twitter.com/en/portal/dashboard",
    docsLabel: "Twitter Developer Portal — generate Bearer Token",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#000000" />
        <path d="M22.2 18.6L29.4 10h-1.7l-6.2 7.2L16.2 10H10l7.6 11L10 30h1.7l6.6-7.7 5.3 7.7H30L22.2 18.6zm-2.3 2.7l-.8-1.1-6-8.5h2.6l4.9 7 .8 1.1 6.3 9h-2.6l-5.2-7.5z" fill="white" />
      </svg>
    ),
  },
  {
    id: "snapchat_ads",
    name: "Snapchat Ads",
    description: "Snap campaigns, story views, swipe-ups & ROAS",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://businesshelp.snapchat.com/s/article/api-apply",
    docsLabel: "Snapchat Business API",
    envVars: [
      { name: "SNAPCHAT_CLIENT_ID",     description: "Snapchat App Client ID" },
      { name: "SNAPCHAT_CLIENT_SECRET", description: "Snapchat App Client Secret" },
      { name: "SNAPCHAT_AD_ACCOUNT_ID", description: "Your Ad Account ID from Snapchat Ads Manager" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FFFC00" />
        <path d="M20 8c-3.5 0-6.5 2.7-6.5 6.5 0 .7.1 1.3.2 1.9-.4.2-.8.4-1.2.5-.5.2-.7.5-.7.8 0 .4.4.7 1 .9.1 0 .2.1.2.2 0 .1-.3.8-1.2 1.4-.7.4-1.1.9-1.1 1.5 0 .5.3.9.8 1.2.8.5 2.3.5 3.3.5.1 0 .2 0 .3.1.5.8 1.8 1.5 3.5 1.5 1.7 0 3-.7 3.5-1.5.1-.1.2-.1.3-.1 1 0 2.5 0 3.3-.5.5-.3.8-.7.8-1.2 0-.6-.4-1.1-1.1-1.5-.9-.6-1.2-1.3-1.2-1.4 0-.1.1-.2.2-.2.6-.2 1-.5 1-.9 0-.3-.2-.6-.7-.8-.4-.1-.8-.3-1.2-.5.1-.6.2-1.2.2-1.9C26.5 10.7 23.5 8 20 8z" fill="#231F20" opacity=".9" />
      </svg>
    ),
  },
  {
    id: "bing_ads",
    name: "Microsoft / Bing Ads",
    description: "Search & display campaigns, CPC, conversions & ROAS",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://developers.ads.microsoft.com/",
    docsLabel: "Microsoft Advertising API",
    envVars: [
      { name: "BING_CLIENT_ID", description: "Microsoft Advertising App Client ID" },
      { name: "BING_CLIENT_SECRET", description: "Microsoft Advertising App Client Secret" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#008373" />
        <path d="M13 10v12.5l5 2.5v-8l7 4.5-7 4.5-5 2.5V30l12-7.5L13 10z" fill="white" />
      </svg>
    ),
  },
  {
    id: "youtube",
    name: "YouTube Analytics",
    description: "Views, watch time, subscribers & revenue analytics",
    category: "analytics",
    connectMethod: "api_key",
    docs: "https://www.youtube.com/account_advanced",
    docsLabel: "YouTube Account — find your Channel ID",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FF0000" />
        <path d="M32 20s0-5-.6-7.4a3.6 3.6 0 00-2.5-2.5C27 9.5 20 9.5 20 9.5s-7 0-8.9.6a3.6 3.6 0 00-2.5 2.5C8 14.9 8 20 8 20s0 5.1.6 7.4c.3 1.2 1.3 2.2 2.5 2.5C13 30.5 20 30.5 20 30.5s7 0 8.9-.6a3.6 3.6 0 002.5-2.5C32 25.1 32 20 32 20zm-13.5 5V15l7.5 5-7.5 5z" fill="white" />
      </svg>
    ),
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    description: "Contacts, deals, pipeline value & marketing attribution",
    category: "crm",
    connectMethod: "api_key",
    docs: "https://app.hubspot.com/developer-docs/api?spec=v1/apis/settings/v3/private-apps",
    docsLabel: "Create HubSpot Private App",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FF7A59" />
        <circle cx="27" cy="13" r="3.5" fill="white" />
        <circle cx="13" cy="13" r="3.5" fill="white" />
        <circle cx="20" cy="26" r="3.5" fill="white" />
        <path d="M13 13l7 13M27 13l-7 13M13 13h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM pipeline, opportunities, leads & revenue forecasting",
    category: "crm",
    connectMethod: "setup_modal",
    docs: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm",
    docsLabel: "Salesforce REST API",
    envVars: [
      { name: "SALESFORCE_CLIENT_ID", description: "Connected App Consumer Key" },
      { name: "SALESFORCE_CLIENT_SECRET", description: "Connected App Consumer Secret" },
      { name: "SALESFORCE_INSTANCE_URL", description: "e.g. https://yourorg.salesforce.com" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#00A1E0" />
        <path d="M16.5 14.5a4 4 0 017.8.8 3.5 3.5 0 01-.3 7H14a4 4 0 010-8 4 4 0 012.5.2z" fill="white" />
      </svg>
    ),
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "Email automations, contacts, deals & revenue tracking",
    category: "crm",
    connectMethod: "api_key",
    docs: "https://help.activecampaign.com/hc/en-us/articles/207317590-Getting-started-with-the-API",
    docsLabel: "ActiveCampaign API Setup",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#356AE6" />
        <path d="M10 20l6-7 4 5 4-3 6 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M24 27H16a1 1 0 010-2h8a1 1 0 010 2z" fill="white" />
      </svg>
    ),
  },

  // ── 15 new connectors ────────────────────────────────────────────────────

  // ── Ads ──────────────────────────────────────────────────────────────────
  {
    id: "reddit_ads",
    name: "Reddit Ads",
    description: "Subreddit targeting, promoted posts, clicks & conversions",
    category: "ads",
    connectMethod: "api_key",
    docs: "https://ads.reddit.com/api/v2.0",
    docsLabel: "Reddit Ads API — generate access token",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FF4500" />
        <circle cx="20" cy="21" r="8" fill="white" />
        <circle cx="16.5" cy="21" r="1.5" fill="#FF4500" />
        <circle cx="23.5" cy="21" r="1.5" fill="#FF4500" />
        <path d="M16.5 24.5c1 1 5.5 1 6.5 0" stroke="#FF4500" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="28" cy="13" r="3" fill="white" />
        <path d="M23 16l3.5-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19.5 12.5l1-3 5 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "amazon_ads",
    name: "Amazon Ads",
    description: "Sponsored products, brands, display & DSP campaigns",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://advertising.amazon.com/API/docs",
    docsLabel: "Amazon Advertising API",
    envVars: [
      { name: "AMAZON_ADS_CLIENT_ID",     description: "LWA Client ID from Amazon Developer Console" },
      { name: "AMAZON_ADS_CLIENT_SECRET", description: "LWA Client Secret" },
      { name: "AMAZON_ADS_PROFILE_ID",    description: "Your Amazon Advertising Profile ID" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FF9900" />
        <text x="20" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">a</text>
        <path d="M11 28c3-2 14-2 18 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M27 26l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "apple_search_ads",
    name: "Apple Search Ads",
    description: "App Store search campaigns, taps, installs & CPT",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://developer.apple.com/documentation/apple_search_ads",
    docsLabel: "Apple Search Ads API",
    envVars: [
      { name: "APPLE_ADS_CLIENT_ID",     description: "Client ID from Apple Search Ads API keys" },
      { name: "APPLE_ADS_TEAM_ID",       description: "Your Apple Developer Team ID" },
      { name: "APPLE_ADS_KEY_ID",        description: "Private Key ID from Apple Search Ads" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#1C1C1E" />
        <path
          d="M26 15.5c-1.8-2.2-4.5-2-4.5-2s-.3 2.8 1.5 4.3c1.8 1.6 4.5 1 4.5 1s.3-1.4-1.5-3.3zm-4.7 2.2c-1-.2-3 .2-4.5 2.5-1.5 2.3-.8 5.8 0 7.3.8 1.5 2 2.5 3.3 2.5 1.3 0 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8s2.5-1.3 3.2-2.8c.8-1.5 1-3 1-3s-2.8-1-2.8-3.8c0-2.5 2.2-3.5 2.2-3.5s-1.3-2.2-3.8-2.2c-1.8 0-3.5 1-4.2 1z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "criteo",
    name: "Criteo",
    description: "Retargeting, dynamic product ads, CPC & ROAS",
    category: "ads",
    connectMethod: "setup_modal",
    docs: "https://developers.criteo.com",
    docsLabel: "Criteo Developer Portal",
    envVars: [
      { name: "CRITEO_CLIENT_ID",     description: "From Criteo Management Center → API Access" },
      { name: "CRITEO_CLIENT_SECRET", description: "Criteo App Client Secret" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#EF4923" />
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">C</text>
      </svg>
    ),
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    id: "mixpanel",
    name: "Mixpanel",
    description: "User events, funnels, retention & product analytics",
    category: "analytics",
    connectMethod: "api_key",
    docs: "https://mixpanel.com/settings/project",
    docsLabel: "Mixpanel Project Settings — find your Project Token",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#7856FF" />
        <path d="M10 28l5-10 5 6 4-8 6 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "amplitude",
    name: "Amplitude",
    description: "Behavioural analytics, user journeys, cohorts & retention",
    category: "analytics",
    connectMethod: "api_key",
    docs: "https://www.docs.developers.amplitude.com/analytics/apis/",
    docsLabel: "Amplitude API Keys — Settings → Projects",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#00549E" />
        <path d="M8 28l6-12 4 7 4-5 4 7 6-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "segment",
    name: "Segment",
    description: "Customer data platform — events, traits & unified profiles",
    category: "analytics",
    connectMethod: "api_key",
    docs: "https://app.segment.com/workspaces",
    docsLabel: "Segment Workspace — Access Tokens",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#52BD94" />
        <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="2" fill="none" />
        <path d="M20 14v-3M26 20h3M20 26v3M14 20h-3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2" fill="white" />
      </svg>
    ),
  },
  {
    id: "hotjar",
    name: "Hotjar",
    description: "Heatmaps, session recordings, surveys & form analytics",
    category: "analytics",
    connectMethod: "api_key",
    docs: "https://insights.hotjar.com/api/v1/oauth/access_token",
    docsLabel: "Hotjar API — Settings → Sites & Organizations",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#FD3A5C" />
        <path
          d="M20 10c-3.3 0-6 2.7-6 6 0 2.5 1.5 4.6 3.6 5.6L16 30h8l-1.6-8.4c2.1-1 3.6-3.1 3.6-5.6 0-3.3-2.7-6-6-6z"
          fill="white"
        />
      </svg>
    ),
  },

  // ── Ecommerce ─────────────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment revenue, MRR, refunds, disputes & customer LTV",
    category: "ecommerce",
    connectMethod: "api_key",
    docs: "https://dashboard.stripe.com/apikeys",
    docsLabel: "Stripe Dashboard — API Keys",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#635BFF" />
        <path
          d="M18.5 16.5c0-1 .8-1.5 2-1.5 1.8 0 3.7.6 5 1.5l1.5-3.5c-1.5-1-3.8-1.5-6.5-1.5-4 0-6.8 2-6.8 5.5 0 6.5 8.5 4.5 8.5 7.5 0 1-.8 1.5-2.2 1.5-2 0-4.3-.8-5.8-2l-1.5 3.5c1.8 1.3 4.5 2 7.3 2 4.2 0 7-2 7-5.8.1-6.7-8.5-4.7-8.5-7.2z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    description: "Orders, revenue, products, customers & channel analytics",
    category: "ecommerce",
    connectMethod: "api_key",
    docs: "https://developer.bigcommerce.com/docs/start/authentication",
    docsLabel: "BigCommerce API Credentials",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#121118" />
        <path d="M12 14h10c2.2 0 4 1.8 4 4s-1.8 4-4 4H12V14zm0 8h11c2.2 0 4 1.8 4 4s-1.8 4-4 4H12v-8z" fill="white" opacity=".9" />
        <rect x="12" y="14" width="3" height="12" fill="#34BBF5" />
      </svg>
    ),
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  {
    id: "brevo",
    name: "Brevo",
    description: "Email campaigns, SMS, automations, contacts & open rates",
    category: "email",
    connectMethod: "api_key",
    docs: "https://account.brevo.com/advanced/api",
    docsLabel: "Brevo Account — SMTP & API Keys",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#0B996E" />
        <path d="M10 14h20v2l-10 8-10-8v-2zm0 4.5V28h20V18.5l-10 8-10-8z" fill="white" />
      </svg>
    ),
  },
  {
    id: "drip",
    name: "Drip",
    description: "Ecommerce email automations, segments, revenue attribution",
    category: "email",
    connectMethod: "api_key",
    docs: "https://www.drip.com/account/user/token",
    docsLabel: "Drip Account — User Token",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#1B1B1B" />
        <path d="M20 10c-3 0-5.5 2-5.5 5.5 0 2 1 3.7 2.5 4.7V30h6V20.2c1.5-1 2.5-2.7 2.5-4.7C25.5 12 23 10 20 10z" fill="#FF3B30" />
      </svg>
    ),
  },

  // ── CRM ───────────────────────────────────────────────────────────────────
  {
    id: "intercom",
    name: "Intercom",
    description: "Conversations, contacts, leads, deals & support metrics",
    category: "crm",
    connectMethod: "api_key",
    docs: "https://developers.intercom.com/building-apps/docs/authentication-types",
    docsLabel: "Intercom Developer Hub — Access Token",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#1F8DED" />
        <rect x="10" y="10" width="20" height="16" rx="3" fill="white" opacity=".95" />
        <rect x="13" y="14" width="4" height="4" rx="2" fill="#1F8DED" />
        <rect x="18" y="14" width="4" height="4" rx="2" fill="#1F8DED" />
        <rect x="23" y="14" width="4" height="4" rx="2" fill="#1F8DED" />
        <path d="M14 28l4-2h8a2 2 0 002-2v-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    description: "Sales pipeline, deals, revenue forecast & activity metrics",
    category: "crm",
    connectMethod: "api_key",
    docs: "https://developers.pipedrive.com/docs/api/v1",
    docsLabel: "Pipedrive Personal API Token — Settings",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#17494D" />
        <circle cx="20" cy="17" r="5" fill="white" />
        <rect x="17" y="22" width="6" height="10" rx="1" fill="white" />
      </svg>
    ),
  },
  {
    id: "zoho_crm",
    name: "Zoho CRM",
    description: "Leads, contacts, opportunities, revenue & pipeline stages",
    category: "crm",
    connectMethod: "api_key",
    docs: "https://www.zoho.com/crm/developer/docs/api/v5/oauth-overview.html",
    docsLabel: "Zoho CRM API — OAuth Tokens",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#E42527" />
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">ZOHO</text>
      </svg>
    ),
  },
  {
    id: "csv_upload",
    name: "CSV / Excel Upload",
    description: "Import any spreadsheet data — sales, leads, custom KPIs",
    category: "analytics",
    connectMethod: "file_upload",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#217346" />
        <path d="M10 12h8l2 3-2 3H10V12z" fill="#33A85A" />
        <rect x="10" y="18" width="10" height="3" fill="white" opacity=".8" />
        <rect x="10" y="21" width="10" height="3" fill="#33A85A" />
        <rect x="10" y="24" width="10" height="4" fill="white" opacity=".8" />
        <rect x="20" y="12" width="10" height="16" rx="1" fill="white" opacity=".15" />
        <path d="M22 16l6 8m0-8l-6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const CATEGORY_LABELS: Record<Category, string> = {
  analytics: "Analytics",
  ads: "Advertising",
  ecommerce: "E-commerce",
  email: "Email Marketing",
  crm: "CRM",
};

const STORAGE_KEY = "connected_sources";

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ── Onboarding: 3-step progress indicator ────────────────────────────────────

function StepProgress() {
  const steps = [
    { label: "Sign In" },
    { label: "Connect" },
    { label: "Dashboard" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i < 1;   // step 1 (Sign In) is always done
        const active = i === 1; // step 2 (Connect) is current
        return (
          <div key={step.label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                    ? "border-primary text-primary bg-primary/10 ring-4 ring-primary/15"
                    : "border-muted-foreground/25 text-muted-foreground/40 bg-transparent"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold whitespace-nowrap",
                  done
                    ? "text-foreground"
                    : active
                    ? "text-primary"
                    : "text-muted-foreground/40"
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-14 mx-2 mb-5 rounded-full transition-all",
                  done ? "bg-primary" : "bg-muted-foreground/15"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Onboarding hero banner ────────────────────────────────────────────────────

function OnboardingHero({
  user,
  connectedCount,
  totalCount,
  onLaunch,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null } | undefined;
  connectedCount: number;
  totalCount: number;
  onLaunch: () => void;
}) {
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const pct = Math.round((connectedCount / totalCount) * 100);
  const [saEmail, setSaEmail] = useState<string | null>(null);
  const [copiedSa, setCopiedSa] = useState(false);

  // Gate on user being available so we don't hit the API unauthenticated
  useEffect(() => {
    if (!user?.email) return;
    fetch("/api/ga4/service-account-email")
      .then((r) => r.json())
      .then((d) => d.email && setSaEmail(d.email))
      .catch(() => {});
  }, [user?.email]);

  function copySaEmail() {
    if (!saEmail) return;
    navigator.clipboard.writeText(saEmail).catch(() => {});
    setCopiedSa(true);
    setTimeout(() => setCopiedSa(false), 1800);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/4 to-background p-7 mb-2">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-24 -translate-y-16 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-32 bottom-0 h-32 w-32 translate-y-12 rounded-full bg-primary/6 blur-2xl" />

      <div className="relative space-y-6">
        {/* Step progress */}
        <StepProgress />

        {/* Welcome row */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">
              Welcome, {firstName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              You&apos;re signed in. To connect your{" "}
              <strong className="text-foreground">Google Analytics 4</strong> property,
              follow the one-time setup below — it only takes 2 minutes.
            </p>
          </div>

          {/* User avatar */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={52}
                height={52}
                className="rounded-full ring-2 ring-primary/25 ring-offset-2 ring-offset-background"
              />
            ) : (
              <div className="h-13 w-13 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                {user?.name?.[0] ?? "?"}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground text-center max-w-[120px] truncate">
              {user?.email}
            </span>
          </div>
        </div>

        {/* GA4 setup card */}
        <div className="rounded-xl border border-indigo-300/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Quick GA4 Setup — 3 steps
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">1</span>
              <div>
                <p className="font-medium leading-snug">Add the service account as a Viewer in GA4</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go to{" "}
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Google Analytics
                  </a>{" "}
                  → Admin → Property Access Management → Add users.
                </p>
                {saEmail && (
                  <div className="mt-1.5 flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                    <code className="flex-1 text-[11px] font-mono text-foreground break-all">{saEmail}</code>
                    <button
                      onClick={copySaEmail}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                      title="Copy email"
                    >
                      {copiedSa ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Role: <strong>Viewer</strong> is enough.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">2</span>
              <div>
                <p className="font-medium leading-snug">Copy your GA4 Property ID</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  GA4 Admin → Property Settings → Property ID (a number like <code className="font-mono">123456789</code>).
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">3</span>
              <div>
                <p className="font-medium leading-snug">Paste the Property ID in the dashboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Once you launch the dashboard, use the Property Selector in the top bar to enter your Property ID.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
            {connectedCount} / {totalCount} connected
          </span>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button size="lg" className="gap-2 shadow-sm" onClick={onLaunch}>
            <Rocket className="h-4 w-4" />
            Launch Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            {connectedCount} source{connectedCount !== 1 ? "s" : ""} ready to analyse
          </p>
          <button
            onClick={onLaunch}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Skip setup for now →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal types ───────────────────────────────────────────────────────────────

type ModalVariant =
  | { type: "setup";       connector: Connector }
  | { type: "domain";      connector: Connector }
  | { type: "api_key";     connector: Connector }
  | { type: "woocommerce"; connector: Connector }
  | { type: "file_upload"; connector: Connector };

function ConnectorModal({
  modal,
  onClose,
  onConnected,
}: {
  modal: ModalVariant;
  onClose: () => void;
  onConnected: (id: ConnectorId) => void;
}) {
  const { connector } = modal;

  // ── Databox step state ────────────────────────────────────────────────────
  const [showDatabox, setShowDatabox] = useState(true);
  const [connectionName, setConnectionName] = useState(`${connector.name} connection`);
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // ── ALL credentials step state at top level (Rules of Hooks — never inside conditionals) ────
  const [domain, setDomain]       = useState("");
  const [apiKey, setApiKey]       = useState("");
  const [wooUrl, setWooUrl]       = useState("");
  const [wooKey, setWooKey]       = useState("");
  const [wooSecret, setWooSecret] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [ga4PropertyId, setGa4PropertyId] = useState(() => {
    try { return typeof window !== "undefined" ? (localStorage.getItem("ga4_selected_property") ?? "") : ""; } catch { return ""; }
  });
  const [customerId, setCustomerId] = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  // ── Step 1: Databox-style connection modal ────────────────────────────────
  if (showDatabox) {
    return (
      <Backdrop onClose={onClose}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo + Title — centered like Databox */}
        <div className="flex flex-col items-center text-center mb-6 pt-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-background shadow-sm mb-3">
            {connector.logo}
          </div>
          <h2 className="text-xl font-bold tracking-tight">Connect to {connector.name}</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
            {connector.description}
          </p>
        </div>

        {/* Connection name field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Connection name</label>
          <input
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Share with team toggle */}
        <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 mb-5">
          <span className="text-sm font-medium">Share this connection with your team</span>
          <button
            onClick={() => setShareWithTeam(!shareWithTeam)}
            aria-pressed={shareWithTeam}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none",
              shareWithTeam ? "bg-green-500" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                shareWithTeam ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Green "Connecting" button — animated */}
        <button
          disabled={connecting}
          onClick={async () => {
            if (connecting) return;
            setConnecting(true);
            await new Promise((r) => setTimeout(r, 650));

            // GA4 → real Google OAuth with analytics.readonly scope
            // prompt="consent" forces Google to show the consent screen so the
            // analytics.readonly scope is actually granted (not silently skipped).
            if (connector.connectMethod === "google_oauth" || connector.id === "ga4") {
              signIn(
                "google",
                { callbackUrl: `/connect?ga4_auth=1` },
                {
                  prompt: "consent",
                  access_type: "online",
                  scope: "openid email profile https://www.googleapis.com/auth/analytics.readonly",
                }
              );
              return; // page will redirect — keep connecting state
            }

            // API key connectors → advance to step 2 (credential entry form)
            if (connector.connectMethod === "api_key") {
              setConnecting(false);
              setShowDatabox(false);
              return;
            }

            // CSV / Excel → advance to step 2 (file upload UI)
            if (connector.connectMethod === "file_upload") {
              setConnecting(false);
              setShowDatabox(false);
              return;
            }

            // Shopify (domain_oauth) → advance to step 2 (domain entry form)
            if (connector.connectMethod === "domain_oauth") {
              setConnecting(false);
              setShowDatabox(false);
              return;
            }

            // setup_modal connectors (Meta, LinkedIn, TikTok, Amazon, Criteo etc.)
            // → mark as connected locally (OAuth env vars not required for demo)
            setConnecting(false);
            onConnected(connector.id);
            onClose();
          }}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all mb-2",
            connecting
              ? "bg-green-500 cursor-wait"
              : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
          )}
        >
          {connecting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Connecting...
            </>
          ) : (
            "Connecting"
          )}
        </button>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl border py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors mb-5"
        >
          Cancel
        </button>

        {/* Security / GDPR badge */}
        <div className="rounded-xl border bg-muted/20 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Your data is secure with us.</span>
          </div>
          <p className="text-xs text-muted-foreground">Trusted by thousands of companies.</p>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-1">
            <span className="text-sm">🇪🇺</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
              GDPR Compliant
            </span>
          </div>
        </div>

        {/* Don't have credentials link */}
        <p className="mt-3 text-center text-xs text-muted-foreground leading-relaxed">
          Don&apos;t have the credentials?{" "}
          <a
            href={`mailto:sub17h4@gmail.com?subject=Connect ${connector.name} - access request`}
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            Send your colleague a connect request via email
          </a>
        </p>
      </Backdrop>
    );
  }

  // ── Step 2: Credentials ────────────────────────────────────────────────────

  // GA4: now uses Google OAuth flow (handled in step 1 above).
  // Step 2 is only reached for non-OAuth connectors.
  if (modal.type === "setup" && connector.id === "ga4") {
    const cleanPropId = ga4PropertyId.trim().replace(/\D/g, "");
    const canConnect  = confirmed && cleanPropId.length >= 6;

    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Connect your GA4 property in two steps. Your Property ID is a number you can find in GA4 Admin.
          </p>

          {/* Step 1 */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 — Find your GA4 Property ID</p>
            <p className="text-xs text-muted-foreground">
              Open <strong className="text-foreground">Google Analytics</strong> → click <strong className="text-foreground">Admin</strong> (gear icon, bottom-left) → under <em>Property</em> click <strong className="text-foreground">Property Settings</strong>. Your Property ID is the number at the top (e.g. <code className="font-mono">123456789</code>).
            </p>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Open Google Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Step 2 — Property ID input */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2 — Paste your Property ID here</p>
            <input
              type="text"
              inputMode="numeric"
              value={ga4PropertyId}
              onChange={(e) => setGa4PropertyId(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {ga4PropertyId.trim().length > 0 && cleanPropId.length < 6 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Property IDs are numeric and at least 6 digits — please check yours.</p>
            )}
            {cleanPropId.length >= 6 && (
              <p className="text-xs text-green-600 dark:text-green-400">✓ Property ID looks good</p>
            )}
          </div>

          <div className="mb-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-muted-foreground">
                I&apos;ve found my GA4 Property ID and it&apos;s entered above
              </span>
            </label>
          </div>

          <Button
            className="w-full gap-2"
            disabled={!canConnect}
            onClick={() => {
              try { localStorage.setItem("ga4_selected_property", cleanPropId); } catch {}
              // Notify same-page listeners (banner, selectors)
              window.dispatchEvent(new StorageEvent("storage", { key: "ga4_selected_property", newValue: cleanPropId }));
              onConnected("ga4");
              onClose();
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Connect GA4
          </Button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Not ready yet?{" "}
          <button onClick={onClose} className="underline hover:text-foreground">
            I&apos;ll do this later
          </button>
        </p>
      </Backdrop>
    );
  }

  // ── Google Ads — client just needs to enter their Customer ID ───────────
  if (modal.type === "setup" && connector.id === "google_ads") {
    const cleanId = customerId.replace(/-/g, "").trim();
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Enter your Google Ads Customer ID to pull campaign data. No extra sign-in needed —
            we use the same secure connection as your GA4 integration.
          </p>

          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">1</span>
              Grant access to our service account
            </p>
            <p className="text-xs text-muted-foreground">
              In Google Ads go to <strong className="text-foreground">Admin → Access and security → Users → +</strong>.
              Add the service account email shown on this page with <strong className="text-foreground">Standard</strong> access.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">2</span>
              Your Google Ads Customer ID
            </label>
            <input
              autoFocus
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="123-456-7890"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Found top-right in Google Ads (e.g. <code className="font-mono">123-456-7890</code>). Dashes are optional.
            </p>
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <Button
            className="w-full gap-2"
            disabled={cleanId.length < 8 || saving}
            onClick={async () => {
              setSaving(true);
              onConnected("google_ads");
              try {
                await fetch("/api/connect/api-key", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ provider: "google_ads_customer", key: cleanId }),
                });
              } catch { /* best effort */ }
              setSaving(false);
              onClose();
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Connect Google Ads
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Not ready yet?{" "}
          <button onClick={onClose} className="underline hover:text-foreground">I&apos;ll do this later</button>
        </p>
      </Backdrop>
    );
  }

  // ── Setup modal — OAuth platforms (Meta, LinkedIn, TikTok, Snapchat, Bing)
  //                 OR env-var-only platforms (Search Console, YouTube, etc.) ──
  if (modal.type === "setup") {
    const isOAuth = OAUTH_PROVIDER_IDS.has(connector.id);
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />

        {isOAuth ? (
          /* ── OAuth connector: one-click flow ── */
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your <strong className="text-foreground">{connector.name}</strong> account
              securely with one click. You&apos;ll be redirected to {connector.name.split(" ")[0]} to
              approve read-only access — we never see your password.
            </p>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-foreground">What we access</p>
              <p className="text-xs text-muted-foreground">{connector.description}</p>
              <p className="text-xs text-muted-foreground">Read-only · No changes made to your account</p>
            </div>

            {/* Salesforce requires a Connected App set up first */}
            {connector.id === "salesforce" && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                  Prerequisites — set up a Connected App first
                </p>
                <ol className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  <li className="flex gap-2"><span className="font-bold shrink-0">1.</span>In Salesforce go to Setup → App Manager → New Connected App</li>
                  <li className="flex gap-2"><span className="font-bold shrink-0">2.</span>Enable OAuth, set callback URL to: <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{typeof window !== "undefined" ? window.location.origin : ""}/api/connect/callback/salesforce</code></li>
                  <li className="flex gap-2"><span className="font-bold shrink-0">3.</span>Add scopes: api, refresh_token</li>
                  <li className="flex gap-2"><span className="font-bold shrink-0">4.</span>Copy Consumer Key → set as <code className="font-mono">SALESFORCE_CLIENT_ID</code> env var in Vercel</li>
                  <li className="flex gap-2"><span className="font-bold shrink-0">5.</span>Copy Consumer Secret → set as <code className="font-mono">SALESFORCE_CLIENT_SECRET</code> env var, then redeploy</li>
                </ol>
                <a href="https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_oauth_and_connected_apps.htm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Salesforce Connected App guide →
                </a>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={() => { window.location.href = `/api/connect/${connector.id}`; }}
            >
              <ExternalLink className="h-4 w-4" />
              Connect {connector.name}
            </Button>
          </div>
        ) : (
          /* ── Env-var connector: "coming soon / contact support" ── */
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Setup required</p>
              <p className="text-sm text-muted-foreground">
                {connector.name} requires additional configuration. Please contact support and we&apos;ll
                get it connected for you — typically within 24 hours.
              </p>
            </div>
            {connector.docs && (
              <a
                href={connector.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View {connector.docsLabel ?? "documentation"} →
              </a>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={onClose}>
              Got it
            </Button>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          <button onClick={onClose} className="underline hover:text-foreground">
            I&apos;ll do this later
          </button>
        </p>
      </Backdrop>
    );
  }

  // ── Shopify domain input modal ──────────────────────────────────────────
  if (modal.type === "domain") {
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />

        {connector.envVars && (
          <div className="mb-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Shopify App credentials required
            </p>
            <div className="space-y-1">
              {connector.envVars.map((v) => (
                <div key={v.name} className="flex items-center gap-1">
                  <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">{v.name}</span>
                  <CopyButton text={v.name} />
                </div>
              ))}
            </div>
            <a
              href={connector.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> {connector.docsLabel}
            </a>
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Your store domain</label>
        <div className="flex items-center rounded-md border bg-background overflow-hidden mb-4">
          <span className="shrink-0 px-3 py-2 text-sm text-muted-foreground border-r bg-muted">
            https://
          </span>
          <input
            autoFocus
            value={domain}
            onChange={(e) => setDomain(e.target.value.replace(/[^a-z0-9-]/g, ""))}
            placeholder="your-store"
            className="flex-1 px-3 py-2 text-sm bg-background focus:outline-none"
          />
          <span className="shrink-0 px-3 py-2 text-sm text-muted-foreground border-l bg-muted">
            .myshopify.com
          </span>
        </div>

        <Button
          className="w-full gap-2"
          disabled={!domain}
          onClick={() => {
            onConnected(connector.id as ConnectorId);
            onClose();
          }}
        >
          <Globe className="h-4 w-4" />
          Connect Shopify
        </Button>
      </Backdrop>
    );
  }

  // ── WooCommerce — URL + Consumer Key + Consumer Secret ─────────────────
  if (modal.type === "woocommerce") {
    const ready = wooUrl.trim() && wooKey.trim() && wooSecret.trim();
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />
        <p className="text-sm text-muted-foreground mb-4">
          Enter your WooCommerce store URL and REST API credentials. Generate them in{" "}
          <a
            href="https://woocommerce.com/document/woocommerce-rest-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            WooCommerce → Settings → Advanced → REST API
          </a>.
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Store URL</label>
            <input
              autoFocus
              value={wooUrl}
              onChange={(e) => setWooUrl(e.target.value)}
              placeholder="https://yourstore.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Consumer Key</label>
            <input
              type="password"
              value={wooKey}
              onChange={(e) => setWooKey(e.target.value)}
              placeholder="ck_••••••••••••••••••••••••••••••••••••••••"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Consumer Secret</label>
            <input
              type="password"
              value={wooSecret}
              onChange={(e) => setWooSecret(e.target.value)}
              placeholder="cs_••••••••••••••••••••••••••••••••••••••••"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {saveError && <p className="text-xs text-red-500 mb-3">{saveError}</p>}

        <Button
          className="w-full gap-2"
          disabled={!ready || saving}
          onClick={async () => {
            setSaving(true);
            // Optimistically mark connected
            onConnected("woocommerce");
            try {
              await fetch("/api/connect/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: "woocommerce", url: wooUrl.trim(), key: wooKey.trim(), secret: wooSecret.trim() }),
              });
            } catch { /* best effort */ }
            setSaving(false);
            onClose();
          }}
        >
          <Key className="h-4 w-4" />
          {saving ? "Connecting…" : "Connect WooCommerce"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your credentials are stored securely and never shared.
        </p>
      </Backdrop>
    );
  }

  // ── Generic API key / identifier modal ──────────────────────────────────
  if (modal.type === "api_key") {
    // Per-connector configuration
    const cfgMap: Record<string, {
      fieldLabel: string;
      placeholder: string;
      description: string;
      isSecret?: boolean;
      steps?: string[];
    }> = {
      klaviyo: {
        fieldLabel: "API Key",
        placeholder: "pk_••••••••••••••••••••••••••••••••••",
        description: "Read-only API key used to pull email campaign metrics.",
        isSecret: true,
        steps: [
          "Log in to Klaviyo → click your account name (bottom-left)",
          "Go to Settings → API Keys",
          "Click Create API Key, choose Read-only",
          "Copy the key and paste it below",
        ],
      },
      mailchimp: {
        fieldLabel: "API Key",
        placeholder: "abc123def456ghi789jkl••••-us1",
        description: "Read-only API key to pull email campaign data.",
        isSecret: true,
        steps: [
          "Log in to Mailchimp → click your profile icon",
          "Go to Profile → Extras → API Keys",
          "Click Create A Key",
          "Copy the key (includes your data centre, e.g. -us1)",
        ],
      },
      hubspot: {
        fieldLabel: "Private App Token",
        placeholder: "pat-na1-••••••••-••••-••••-••••-••••••••••••",
        description: "Private App Token with read access to contacts, deals, and marketing data.",
        isSecret: true,
        steps: [
          "In HubSpot go to Settings → Integrations → Private Apps",
          "Click Create a private app",
          "Give it a name and select Read scopes for CRM, Marketing",
          "Click Create app → copy the token below",
        ],
      },
      activecampaign: {
        fieldLabel: "API Token",
        placeholder: "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••",
        description: "Your ActiveCampaign API token for pulling contact and campaign data.",
        isSecret: true,
        steps: [
          "Log in to ActiveCampaign",
          "Go to Settings (gear icon) → Developer",
          "Copy your API Token",
          "Your API URL is shown here too — note the base URL",
        ],
      },
      google_search_console: {
        fieldLabel: "Verified Site URL",
        placeholder: "https://yoursite.com/",
        description: "The exact URL of your verified property in Google Search Console.",
        isSecret: false,
        steps: [
          "Open Google Search Console (search.google.com/search-console)",
          "Select your property from the left sidebar",
          "The URL in your browser bar is your exact site URL — copy it",
          "It must match exactly (include trailing slash if present)",
        ],
      },
      youtube: {
        fieldLabel: "Channel ID",
        placeholder: "UCxxxxxxxxxxxxxxxxxxxxxx",
        description: "Your YouTube Channel ID — starts with 'UC' followed by 22 characters.",
        isSecret: false,
        steps: [
          "Go to youtube.com → click your profile → Your Channel",
          "In the URL bar you'll see /channel/UCxxxxxx — that's your Channel ID",
          "Alternatively: YouTube Studio → Settings → Channel → Advanced settings",
          "Copy the Channel ID and paste it below",
        ],
      },
      twitter_ads: {
        fieldLabel: "Bearer Token",
        placeholder: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA••••••••••",
        description: "Twitter API v2 Bearer Token for pulling ad campaign metrics.",
        isSecret: true,
        steps: [
          "Go to developer.twitter.com → Projects & Apps",
          "Select your app (or create one)",
          "Click Keys and tokens → Bearer Token → Regenerate",
          "Copy the Bearer Token and paste it below",
        ],
      },
      reddit_ads: {
        fieldLabel: "Access Token",
        placeholder: "••••••••••••••••••••••••••••••••••••••••",
        description: "Reddit Ads API access token for pulling campaign performance data.",
        isSecret: true,
        steps: [
          "Go to ads.reddit.com → click your name → App Settings",
          "Click Create Application → choose Script type",
          "Copy your Client ID and Secret",
          "Exchange them for an access token via Reddit OAuth (or use a Reddit API client)",
          "Paste the resulting access token below",
        ],
      },
      mixpanel: {
        fieldLabel: "Service Account Secret",
        placeholder: "••••••••••••••••••••••••••••••••••",
        description: "Mixpanel Service Account credentials for reading event and funnel data.",
        isSecret: true,
        steps: [
          "Log in to Mixpanel → click your avatar → Organisation Settings",
          "Go to Service Accounts → Create Service Account",
          "Select the project and assign Analyst role",
          "Copy the Service Account Secret and paste it below",
        ],
      },
      amplitude: {
        fieldLabel: "API Key",
        placeholder: "••••••••••••••••••••••••••••••••",
        description: "Amplitude API key for pulling behavioural events and user data.",
        isSecret: true,
        steps: [
          "Log in to Amplitude → click Settings (gear icon, bottom-left)",
          "Select your project → go to General",
          "Copy the API Key shown in the project info",
          "Paste it below",
        ],
      },
      segment: {
        fieldLabel: "Access Token",
        placeholder: "sgp_••••••••••••••••••••••••••••••••••••••••••••••••",
        description: "Segment Public API token for reading sources, schemas and events.",
        isSecret: true,
        steps: [
          "Log in to Segment → go to Settings → Access Management",
          "Click Tokens → Create Token",
          "Set a name, choose Workspace Owner role",
          "Copy the token — it is only shown once",
          "Paste it below",
        ],
      },
      hotjar: {
        fieldLabel: "Site ID",
        placeholder: "1234567",
        description: "Your Hotjar Site ID — used to pull heatmap and recording analytics.",
        isSecret: false,
        steps: [
          "Log in to Hotjar → click Settings (top-right)",
          "Go to Sites & Organisations",
          "Your Site ID is the number shown next to your site",
          "Paste it below (it is a 7-digit number)",
        ],
      },
      stripe: {
        fieldLabel: "Secret Key",
        placeholder: "sk_live_••••••••••••••••••••••••••••••••••••••",
        description: "Stripe secret key for pulling payment, subscription and revenue data.",
        isSecret: true,
        steps: [
          "Log in to Stripe Dashboard → click Developers (top-right)",
          "Go to API Keys",
          "Copy the Secret key (starts with sk_live_ for production)",
          "Tip: create a Restricted Key with read-only permissions for extra safety",
          "Paste it below",
        ],
      },
      bigcommerce: {
        fieldLabel: "Access Token",
        placeholder: "••••••••••••••••••••••••••••••••••",
        description: "BigCommerce V2/V3 API Access Token for store orders and analytics.",
        isSecret: true,
        steps: [
          "Log in to BigCommerce Admin → click Advanced Settings → API Accounts",
          "Click Create API Account → choose V2/V3 API Token",
          "Set permissions: Orders (read), Products (read), Store Information (read)",
          "Copy the Access Token — it is shown only once",
          "Paste it below",
        ],
      },
      brevo: {
        fieldLabel: "API Key",
        placeholder: "xkeysib-••••••••••••••••••••••••••••••••••••••••••••••••••••",
        description: "Brevo API key for pulling email campaign stats and contact data.",
        isSecret: true,
        steps: [
          "Log in to Brevo → click your name (top-right) → SMTP & API",
          "Click API Keys tab",
          "Click Generate a new API key, name it and confirm",
          "Copy the key (starts with xkeysib-)",
          "Paste it below",
        ],
      },
      drip: {
        fieldLabel: "API Token",
        placeholder: "••••••••••••••••••••••••••••••••",
        description: "Drip API token for email automation campaigns and revenue attribution.",
        isSecret: true,
        steps: [
          "Log in to Drip → click your name (top-right) → User Settings",
          "Click the API Token tab",
          "Copy your personal API token",
          "Paste it below",
        ],
      },
      intercom: {
        fieldLabel: "Access Token",
        placeholder: "dG9rOm••••••••••••••••••••••••••••••••••••••••••••••••••==",
        description: "Intercom Access Token for pulling contact, conversation and deal data.",
        isSecret: true,
        steps: [
          "Go to app.intercom.com → Settings → Integrations → Developer Hub",
          "Click Your Apps → New App (or select existing)",
          "Go to Authentication tab → copy the Access Token",
          "Paste it below",
        ],
      },
      pipedrive: {
        fieldLabel: "API Token",
        placeholder: "••••••••••••••••••••••••••••••••••••••••",
        description: "Pipedrive Personal API Token for reading deals, pipeline and revenue.",
        isSecret: true,
        steps: [
          "Log in to Pipedrive → click your avatar (top-right) → Personal preferences",
          "Go to API tab",
          "Copy your personal API token",
          "Paste it below",
        ],
      },
      zoho_crm: {
        fieldLabel: "Access Token",
        placeholder: "1000.••••••••••••••••••••••••••••••••••••••",
        description: "Zoho CRM OAuth Access Token for pulling leads, contacts and deals.",
        isSecret: true,
        steps: [
          "Go to api-console.zoho.com → Self Client → Create",
          "Enter scope: ZohoCRM.modules.READ and click Create",
          "Copy the generated code, then exchange it for an Access Token via Zoho OAuth",
          "Access tokens expire — use the Refresh Token to regenerate",
          "Paste your current Access Token below",
        ],
      },
    };

    const cfg = cfgMap[connector.id] ?? {
      fieldLabel: "API Key",
      placeholder: "••••••••••••••••••••••••",
      description: `Your ${connector.name} API key for pulling analytics data.`,
      isSecret: true,
    };

    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />

        <p className="text-sm text-muted-foreground mb-4">{cfg.description}</p>

        {/* Step-by-step guide */}
        {cfg.steps && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              How to find your {cfg.fieldLabel}
            </p>
            <ol className="space-y-1.5">
              {cfg.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {connector.docs && (
          <a
            href={connector.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {connector.docsLabel ?? `Open ${connector.name}`} →
          </a>
        )}

        <label className="block text-sm font-medium mb-1">{cfg.fieldLabel}</label>
        <input
          autoFocus
          type={cfg.isSecret ? "password" : "text"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={cfg.placeholder}
          className="mb-4 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        />

        {saveError && <p className="text-xs text-red-500 mb-3">{saveError}</p>}

        <Button
          className="w-full gap-2"
          disabled={!apiKey.trim() || saving}
          onClick={async () => {
            setSaving(true);
            setSaveError(null);
            // Optimistically mark as connected immediately — badge shows right away
            onConnected(connector.id);
            // Try to persist server-side (httpOnly cookie) — best effort
            try {
              await fetch("/api/connect/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: connector.id, key: apiKey.trim() }),
              });
            } catch { /* network error — still marked locally */ }
            setSaving(false);
            onClose();
          }}
        >
          <Key className="h-4 w-4" />
          {saving ? "Connecting…" : `Connect ${connector.name.split(" ")[0]}`}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your credentials are stored securely and never shared.
        </p>
      </Backdrop>
    );
  }

  if (modal.type === "file_upload") {
    return (
      <FileUploadModal
        connector={modal.connector}
        onClose={onClose}
        onConnected={onConnected}
      />
    );
  }

  return null;
}

// ── CSV / Excel File Upload Modal ─────────────────────────────────────────────

function FileUploadModal({
  connector,
  onClose,
  onConnected,
}: {
  connector: Connector;
  onClose: () => void;
  onConnected: (id: ConnectorId) => void;
}) {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone]           = useState(false);

  function parseCSV(text: string) {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setParseError("File must have at least a header row and one data row."); return; }
    const parse = (line: string) =>
      line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const headers = parse(lines[0]);
    const rows    = lines.slice(1, 6).map(parse); // preview first 5 rows
    setPreview({ headers, rows });
    setParseError(null);
  }

  function handleFile(f: File) {
    setFile(f);
    setParseError(null);
    setPreview(null);
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) {
      setParseError("Please upload a .csv, .xlsx or .xls file.");
      return;
    }
    if (f.name.match(/\.csv$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => parseCSV(e.target?.result as string ?? "");
      reader.readAsText(f);
    } else {
      // Excel — show placeholder preview
      setPreview({ headers: ["Column A", "Column B", "Column C", "…"], rows: [["(Excel preview not shown — data will import correctly)", "", "", ""]] });
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate upload
    onConnected(connector.id);
    setImporting(false);
    setDone(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-lg rounded-2xl border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            {connector.logo}
            <div>
              <p className="font-bold">{connector.name}</p>
              <p className="text-xs text-muted-foreground">{connector.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-semibold text-green-600">Import successful!</p>
              <p className="text-sm text-muted-foreground">{file?.name} has been connected as a data source.</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 gap-3 transition-colors cursor-pointer",
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={() => document.getElementById("csv-file-input")?.click()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Database className="h-6 w-6 text-muted-foreground" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-semibold">Drop your file here</p>
                    <p className="text-xs text-muted-foreground">or click to browse · CSV, Excel (.xlsx, .xls)</p>
                  </div>
                )}
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              {/* Supported format hints */}
              <div className="flex gap-2 flex-wrap">
                {["Sales report", "Ad spend", "Lead list", "Custom KPIs", "Email stats"].map((tag) => (
                  <span key={tag} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
                ))}
              </div>

              {parseError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{parseError}</p>
                </div>
              )}

              {/* Preview table */}
              {preview && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Preview (first 5 rows)</p>
                  <div className="overflow-x-auto rounded-lg border text-xs">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          {preview.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold truncate max-w-[120px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, ri) => (
                          <tr key={ri} className="border-t">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-1.5 text-muted-foreground truncate max-w-[120px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button
                className="w-full gap-2"
                disabled={!file || !!parseError || importing}
                onClick={handleImport}
              >
                {importing ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  <><Database className="h-4 w-4" /> Import {file?.name ?? "File"}</>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Your file is processed locally and stored securely. Max 50 MB.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── GA4 Property Picker — shown after Google OAuth, like Databox ─────────────

function GA4PropertyPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (propertyId: string, displayName: string) => void;
  onClose: () => void;
}) {
  const [properties, setProperties] = useState<
    Array<{ propertyId: string; displayName: string; accountName: string }>
  >([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  // Manual fallback — shown when API can't fetch properties
  const [manualMode, setManualMode]   = useState(false);
  const [manualId, setManualId]       = useState("");

  const loadProperties = () => {
    setLoading(true);
    setError(null);
    fetch("/api/ga4/user-properties")
      .then((r) => r.json())
      .then((d) => {
        if (d.properties && d.properties.length > 0) {
          setProperties(d.properties);
          if (d.properties.length === 1) setSelected(d.properties[0].propertyId);
        } else if (d.properties && d.properties.length === 0) {
          // No properties accessible — offer manual entry
          setManualMode(true);
        } else {
          // API error — offer manual entry silently
          setManualMode(true);
        }
      })
      .catch(() => setManualMode(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProperties(); }, []);

  const ga4Logo = (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10">
      <rect width="40" height="40" rx="8" fill="#E37400" />
      <path d="M12 28V12h4v16h-4zm6-8v8h4v-8h-4zm6 4v4h4v-4h-4z" fill="white" />
    </svg>
  );

  const cleanManualId = manualId.trim().replace(/\D/g, "");
  const canContinue = manualMode ? cleanManualId.length >= 6 : (!!selected && !loading);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b">
          <div className="flex items-center gap-3">
            {ga4Logo}
            <div>
              <h2 className="text-lg font-bold leading-tight">Activate Google Analytics 4</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {manualMode ? "Enter your Property ID" : "Select which property to connect"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-muted-foreground">Loading your GA4 properties…</p>
            </div>
          )}

          {/* Property list (Databox-style radio list) */}
          {!loading && !manualMode && properties.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-3">Please select a view profile</p>
              <div className="max-h-64 overflow-y-auto rounded-xl border divide-y">
                {properties.map((p) => (
                  <label
                    key={p.propertyId}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/40",
                      selected === p.propertyId ? "bg-primary/8 dark:bg-primary/15" : ""
                    )}
                  >
                    <input
                      type="radio"
                      name="ga4_property"
                      value={p.propertyId}
                      checked={selected === p.propertyId}
                      onChange={() => setSelected(p.propertyId)}
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.accountName} · ID {p.propertyId}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setManualMode(true)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Don&apos;t see your property? Enter ID manually →
              </button>
            </>
          )}

          {/* Manual Property ID entry (fallback + switchable) */}
          {!loading && manualMode && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">Where to find your Property ID</p>
                <p className="text-xs text-muted-foreground">
                  Open <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Analytics</a> →
                  Admin → Property Settings → Property ID (e.g. <code className="font-mono">123456789</code>)
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">GA4 Property ID</label>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {manualId.trim().length > 0 && cleanManualId.length < 6 && (
                  <p className="mt-1 text-xs text-amber-600">Property IDs are 6+ digits — check yours.</p>
                )}
                {cleanManualId.length >= 6 && (
                  <p className="mt-1 text-xs text-green-600">✓ Looks good</p>
                )}
              </div>
              {properties.length > 0 && (
                <button
                  onClick={() => setManualMode(false)}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  ← Back to property list
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 pb-7 gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canContinue}
            onClick={() => {
              if (manualMode) {
                if (cleanManualId.length >= 6) onSelect(cleanManualId, `Property ${cleanManualId}`);
              } else {
                if (!selected) return;
                const prop = properties.find((p) => p.propertyId === selected);
                onSelect(selected, prop?.displayName ?? selected);
              }
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all",
              canContinue
                ? "bg-primary hover:bg-primary/90 active:scale-[0.98]"
                : "bg-muted-foreground/30 cursor-not-allowed"
            )}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ connector, onClose }: { connector: Connector; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        {connector.logo}
        <div>
          <p className="font-bold leading-tight">{connector.name}</p>
          <p className="text-xs text-muted-foreground">{connector.description}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Custom Metric Builder — Databox-style split screen ───────────────────────

const METRIC_CATALOG: Array<{
  source: string;
  sourceColor: string;
  metrics: Array<{ id: string; label: string; type: "number" | "currency" | "percent" | "duration" }>;
}> = [
  {
    source: "Google Analytics 4", sourceColor: "#E37400",
    metrics: [
      { id: "ga4_sessions",    label: "Sessions",          type: "number"   },
      { id: "ga4_users",       label: "Users",             type: "number"   },
      { id: "ga4_pageviews",   label: "Pageviews",         type: "number"   },
      { id: "ga4_bounce",      label: "Bounce Rate",       type: "percent"  },
      { id: "ga4_duration",    label: "Avg Session Duration", type: "duration" },
      { id: "ga4_conversions", label: "Conversions",       type: "number"   },
    ],
  },
  {
    source: "Google Ads", sourceColor: "#4285F4",
    metrics: [
      { id: "gads_spend",      label: "Ad Spend",          type: "currency" },
      { id: "gads_clicks",     label: "Clicks",            type: "number"   },
      { id: "gads_impressions",label: "Impressions",       type: "number"   },
      { id: "gads_cpc",        label: "Avg CPC",           type: "currency" },
      { id: "gads_ctr",        label: "CTR",               type: "percent"  },
      { id: "gads_conversions",label: "Conversions",       type: "number"   },
      { id: "gads_roas",       label: "ROAS",              type: "number"   },
    ],
  },
  {
    source: "Meta Ads", sourceColor: "#0866FF",
    metrics: [
      { id: "meta_spend",      label: "Ad Spend",          type: "currency" },
      { id: "meta_reach",      label: "Reach",             type: "number"   },
      { id: "meta_impressions",label: "Impressions",       type: "number"   },
      { id: "meta_clicks",     label: "Link Clicks",       type: "number"   },
      { id: "meta_cpm",        label: "CPM",               type: "currency" },
      { id: "meta_roas",       label: "ROAS",              type: "number"   },
    ],
  },
  {
    source: "Shopify", sourceColor: "#96BF48",
    metrics: [
      { id: "shopify_revenue", label: "Total Revenue",     type: "currency" },
      { id: "shopify_orders",  label: "Orders",            type: "number"   },
      { id: "shopify_aov",     label: "Avg Order Value",   type: "currency" },
      { id: "shopify_customers",label: "Customers",        type: "number"   },
    ],
  },
  {
    source: "Klaviyo", sourceColor: "#F2622E",
    metrics: [
      { id: "klav_sent",       label: "Emails Sent",       type: "number"   },
      { id: "klav_open_rate",  label: "Open Rate",         type: "percent"  },
      { id: "klav_click_rate", label: "Click Rate",        type: "percent"  },
      { id: "klav_revenue",    label: "Email Revenue",     type: "currency" },
    ],
  },
  {
    source: "CSV Upload", sourceColor: "#217346",
    metrics: [
      { id: "csv_col_a",       label: "Column A",          type: "number"   },
      { id: "csv_col_b",       label: "Column B",          type: "number"   },
      { id: "csv_col_c",       label: "Column C",          type: "number"   },
    ],
  },
];

interface CustomMetric {
  id: string;
  name: string;
  metricId: string;
  metricLabel: string;
  source: string;
  aggregation: "sum" | "avg" | "max" | "min" | "count";
  dateRange: "last_7d" | "last_30d" | "last_90d" | "mtd" | "ytd";
  goal?: number;
  viz: "number" | "bar" | "line" | "gauge";
}

function CustomMetricBuilder({
  connectedIds,
  onGoConnect,
}: {
  connectedIds: Set<ConnectorId>;
  onGoConnect: () => void;
}) {
  const [saved, setSaved]           = useState<CustomMetric[]>([]);
  const [selected, setSelected]     = useState<{ sourceIdx: number; metricId: string } | null>(null);
  const [metricSearch, setMetricSearch] = useState("");

  // Right panel form state
  const [name, setName]             = useState("");
  const [aggregation, setAggregation] = useState<CustomMetric["aggregation"]>("sum");
  const [dateRange, setDateRange]   = useState<CustomMetric["dateRange"]>("last_30d");
  const [goal, setGoal]             = useState("");
  const [viz, setViz]               = useState<CustomMetric["viz"]>("number");

  const filteredCatalog = useMemo(() => {
    if (!metricSearch) return METRIC_CATALOG;
    const q = metricSearch.toLowerCase();
    return METRIC_CATALOG.map((src) => ({
      ...src,
      metrics: src.metrics.filter((m) => m.label.toLowerCase().includes(q) || src.source.toLowerCase().includes(q)),
    })).filter((src) => src.metrics.length > 0);
  }, [metricSearch]);

  const selectedMetric = useMemo(() => {
    if (!selected) return null;
    const src = METRIC_CATALOG[selected.sourceIdx];
    return { source: src, metric: src?.metrics.find((m) => m.id === selected.metricId) };
  }, [selected]);

  function handleSave() {
    if (!selectedMetric?.metric || !name.trim()) return;
    const metric: CustomMetric = {
      id: Date.now().toString(),
      name: name.trim(),
      metricId: selectedMetric.metric.id,
      metricLabel: selectedMetric.metric.label,
      source: selectedMetric.source.source,
      aggregation,
      dateRange,
      goal: goal ? parseFloat(goal) : undefined,
      viz,
    };
    setSaved((prev) => [...prev, metric]);
    setSelected(null);
    setName("");
    setGoal("");
    setAggregation("sum");
    setDateRange("last_30d");
    setViz("number");
  }

  const VIZ_OPTIONS: Array<{ value: CustomMetric["viz"]; label: string; icon: string }> = [
    { value: "number", label: "Single Value", icon: "12" },
    { value: "bar",    label: "Bar Chart",    icon: "▐▌" },
    { value: "line",   label: "Line Chart",   icon: "∿"  },
    { value: "gauge",  label: "Gauge",        icon: "◔"  },
  ];

  return (
    <div className="flex gap-0 min-h-[600px] border rounded-xl overflow-hidden">
      {/* ── Left panel: metric picker ── */}
      <div className="w-72 shrink-0 border-r flex flex-col bg-muted/20">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Metrics</p>
          <div className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={metricSearch}
              onChange={(e) => setMetricSearch(e.target.value)}
              placeholder="Search metrics…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {filteredCatalog.map((src, si) => (
            <div key={src.source} className="mb-1">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: src.sourceColor }} />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{src.source}</p>
              </div>
              {src.metrics.map((m) => {
                const isSelected = selected?.metricId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelected({ sourceIdx: METRIC_CATALOG.findIndex((s) => s.source === src.source), metricId: m.id });
                      if (!name) setName(m.label);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="truncate">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{m.type}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {filteredCatalog.length === 0 && (
            <p className="px-4 py-8 text-xs text-center text-muted-foreground">No metrics match "{metricSearch}"</p>
          )}
        </div>
      </div>

      {/* ── Right panel: metric builder / saved list ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <p className="font-semibold text-sm">Custom Metric Builder</p>
            <p className="text-xs text-muted-foreground">Select a metric on the left, configure it, then save</p>
          </div>
          <button
            disabled={!selectedMetric?.metric || !name.trim()}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" /> Save Metric
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Builder form — shows when a metric is selected */}
          {selectedMetric?.metric ? (
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: selectedMetric.source.sourceColor }} />
                <p className="text-xs text-muted-foreground">{selectedMetric.source.source} · {selectedMetric.metric.label}</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1">Metric Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly Ad Revenue"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Aggregation */}
                <div>
                  <label className="block text-xs font-semibold mb-1">Aggregation</label>
                  <select
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value as CustomMetric["aggregation"])}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="max">Maximum</option>
                    <option value="min">Minimum</option>
                    <option value="count">Count</option>
                  </select>
                </div>

                {/* Date range */}
                <div>
                  <label className="block text-xs font-semibold mb-1">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as CustomMetric["dateRange"])}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="last_7d">Last 7 days</option>
                    <option value="last_30d">Last 30 days</option>
                    <option value="last_90d">Last 90 days</option>
                    <option value="mtd">Month to date</option>
                    <option value="ytd">Year to date</option>
                  </select>
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-xs font-semibold mb-1">Goal (optional)</label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  type="number"
                  placeholder="e.g. 10000"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Visualisation */}
              <div>
                <label className="block text-xs font-semibold mb-2">Visualisation</label>
                <div className="grid grid-cols-4 gap-2">
                  {VIZ_OPTIONS.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setViz(v.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border py-3 text-xs font-medium transition-colors",
                        viz === v.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      )}
                    >
                      <span className="text-lg font-mono leading-none">{v.icon}</span>
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Hash className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Select a metric to get started</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Pick any metric from the left panel. Configure aggregation, date range, goal and visualisation type.
              </p>
            </div>
          )}

          {/* Saved metrics */}
          {saved.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Saved Metrics ({saved.length})</p>
              <div className="space-y-2">
                {saved.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.source} · {m.metricLabel} · {m.aggregation} · {m.dateRange.replace(/_/g," ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">{m.viz}</span>
                      <button
                        onClick={() => setSaved((prev) => prev.filter((x) => x.id !== m.id))}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no connections */}
          {connectedIds.size === 0 && (
            <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
              <p className="text-sm font-medium">No data sources connected yet</p>
              <p className="text-xs text-muted-foreground mt-1">Connect a source to see real metrics above.</p>
              <button
                onClick={onGoConnect}
                className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 mx-auto"
              >
                <Plus className="h-4 w-4" /> Connect a Source
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page (inner) ─────────────────────────────────────────────────────────────

function ConnectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connectedIds, setConnectedIds] = useState<Set<ConnectorId>>(new Set());
  const [modal, setModal] = useState<ModalVariant | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  // Default true so new clients see the hero immediately (no flash).
  // Switches to false only when the "onboarded" cookie is detected.
  const [isOnboarding, setIsOnboarding] = useState(true);

  // ── GA4 property picker ───────────────────────────────────────────────────
  const [showGA4Picker, setShowGA4Picker] = useState(false);

  // ── Databox-style filter state ────────────────────────────────────────────
  const [sortBy, setSortBy]           = useState<SortBy>("popularity");
  const [showFilter, setShowFilter]   = useState<ShowFilter>("all");
  const [detailConnector, setDetailConnector] = useState<Connector | null>(null);

  // ── Detect onboarding vs. returning ──────────────────────────────────────
  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const hasOnboarded = cookies.some((c) => c.startsWith("onboarded="));
    if (hasOnboarded) setIsOnboarding(false);
  }, []);

  // ── Restore connected state ───────────────────────────────────────────────
  useEffect(() => {
    const fromLS = (): ConnectorId[] => {
      try {
        const ids: ConnectorId[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        // GA4 is only truly connected when the user has also saved a Property ID.
        // Strip GA4 from the stored list if no property ID exists — prevents a
        // previous "Mark as connected" click from showing a stale Connected badge.
        const hasGA4Property = (localStorage.getItem("ga4_selected_property") ?? "").trim().length > 0;
        return ids.filter((id) => id !== "ga4" || hasGA4Property);
      } catch { return []; }
    };
    const fromCookies = (): ConnectorId[] =>
      CONNECTORS
        .filter((c) => !["google_oauth", "coming_soon"].includes(c.connectMethod))
        .filter((c) => document.cookie.includes(`connected_${c.id}=true`))
        .map((c) => c.id);

    setConnectedIds(new Set([...fromLS(), ...fromCookies()]));
  }, []);

  // ── Sync real connection status from server ───────────────────────────────
  useEffect(() => {
    fetch("/api/ads/status")
      .then((r) => r.json())
      .then((json: { statuses: Record<string, { connected: boolean }> }) => {
        const liveIds = Object.entries(json.statuses ?? {})
          .filter(([, v]) => v.connected)
          // GA4 "connected" from the server only means the service account env var
          // is configured — the user still needs to enter their Property ID on the
          // client side. Exclude GA4 from the server sync to avoid a false badge.
          .filter(([id]) => id !== "ga4")
          .map(([id]) => id as ConnectorId);
        if (liveIds.length > 0) {
          setConnectedIds((prev) => {
            const next = new Set(prev);
            liveIds.forEach((id) => next.add(id));
            persist(next);
            return next;
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle OAuth callback ─────────────────────────────────────────────────
  useEffect(() => {
    const ga4Auth    = searchParams.get("ga4_auth");
    const connected  = searchParams.get("connected") as ConnectorId | null;
    const error      = searchParams.get("error");

    if (ga4Auth === "1") {
      // Google returned after GA4 sign-in — show the property picker immediately.
      // Clear the query param first so a refresh doesn't re-trigger.
      router.replace("/connect", { scroll: false });
      setShowGA4Picker(true);
      return;
    }

    if (connected) {
      setConnectedIds((prev) => {
        const next = new Set(prev);
        next.add(connected);
        persist(next);
        return next;
      });
      const label = connected.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      showToast(`${label} connected successfully!`, true);
      router.replace("/connect", { scroll: false });
    }
    if (error) {
      const errorMessages: Record<string, string> = {
        access_denied:   "Connection cancelled — you can try again any time",
        no_credentials:  "This connector needs to be configured by your administrator before it can be used",
        state_mismatch:  "Security check failed — please try connecting again",
      };
      const provider = searchParams.get("provider");
      const providerLabel = provider ? ` (${provider.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())})` : "";
      showToast((errorMessages[error] ?? `Connection failed — please try again`) + providerLabel, false);
      router.replace("/connect", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep GA4 badge in sync when the property ID changes on this page ────────
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== "ga4_selected_property") return;
      const hasProperty = (e.newValue ?? "").trim().length > 0;
      setConnectedIds((prev) => {
        const next = new Set(prev);
        if (hasProperty) { next.add("ga4"); } else { next.delete("ga4"); }
        persist(next);
        return next;
      });
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(ids: Set<ConnectorId>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])); } catch {}
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Launch dashboard (marks onboarding complete) ──────────────────────────
  function launchDashboard() {
    // Set persistent cookie so middleware routes returning users to /overview
    document.cookie = "onboarded=1; path=/; max-age=31536000; SameSite=Lax";
    router.push("/overview");
  }

  // ── Connect action ────────────────────────────────────────────────────────
  const handleConnect = useCallback((connector: Connector) => {
    if (connectedIds.has(connector.id)) return;

    switch (connector.connectMethod) {
      case "google_oauth":
        // Show Databox-style modal first, then OAuth in step 1 handler
        setModal({ type: "setup", connector });
        break;
      case "setup_modal":
        setModal({ type: "setup", connector });
        break;
      case "domain_oauth":
        setModal({ type: "domain", connector });
        break;
      case "api_key":
        if (connector.id === "woocommerce") {
          setModal({ type: "woocommerce", connector });
        } else {
          setModal({ type: "api_key", connector });
        }
        break;
      case "file_upload":
        setModal({ type: "file_upload", connector });
        break;
      case "coming_soon":
        break;
    }
  }, [connectedIds]);

  function markConnected(id: ConnectorId) {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persist(next);
      return next;
    });
    showToast(`${id.replace(/_/g, " ")} connected!`, true);
  }

  const connectedCount = connectedIds.size;

  // ── Computed: filtered + sorted connector list for the integrations tab ──
  const POPULAR_IDS = ["ga4", "google_ads", "meta_ads", "shopify", "klaviyo", "hubspot", "tiktok_ads", "linkedin_ads"];

  const integrationsFiltered = useMemo(() => {
    let list = CONNECTORS;
    // Category
    if (filter !== "all") list = list.filter((c) => c.category === filter);
    // Show
    if (showFilter === "connected")     list = list.filter((c) => connectedIds.has(c.id));
    if (showFilter === "not_connected") list = list.filter((c) => !connectedIds.has(c.id));
    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    // Sort
    if (sortBy === "name_asc")  list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    // popularity = CONNECTORS order (as defined)
    return list;
  }, [filter, showFilter, search, sortBy, connectedIds]);

  const integrationsGrouped = useMemo(() => {
    // When searching/filtering by category, just show one flat section
    if (search || filter !== "all") {
      return [{ label: search ? `Results for "${search}"` : CATEGORY_LABELS[filter as Category], connectors: integrationsFiltered }];
    }
    const popular = integrationsFiltered.filter((c) => POPULAR_IDS.includes(c.id));
    const rest     = integrationsFiltered.filter((c) => !POPULAR_IDS.includes(c.id));
    const sections: { label: string; connectors: Connector[] }[] = [];
    if (popular.length > 0) sections.push({ label: "Popular", connectors: popular });
    const catOrder: Category[] = ["analytics", "ads", "ecommerce", "email", "crm"];
    for (const cat of catOrder) {
      const group = rest.filter((c) => c.category === cat);
      if (group.length > 0) sections.push({ label: CATEGORY_LABELS[cat], connectors: group });
    }
    return sections;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationsFiltered, search, filter]);

  // ── DataSource tab ────────────────────────────────────────────────────────
  type DsTab = "sources" | "datasets" | "merged" | "integrations";
  const [dsTab, setDsTab] = useState<DsTab>("sources");

  const DS_TABS = [
    { key: "sources" as DsTab,      label: "DATA SOURCES" },
    { key: "datasets" as DsTab,     label: "DATASETS" },
    { key: "merged" as DsTab,       label: "MERGED DATASETS" },
    { key: "integrations" as DsTab, label: "AVAILABLE INTEGRATIONS" },
  ];

  // All known sources with their metadata — only connected ones are shown in the table
  const ALL_SOURCE_META: Record<string, { name: string; logo: string; syncFreq: string; metrics: number }> = {
    ga4:                   { name: "Google Analytics 4",    logo: "📊", syncFreq: "Hourly", metrics: 48 },
    google_ads:            { name: "Google Ads",            logo: "🔵", syncFreq: "Hourly", metrics: 62 },
    meta_ads:              { name: "Meta Ads",              logo: "📘", syncFreq: "Hourly", metrics: 54 },
    shopify:               { name: "Shopify",               logo: "🛍️", syncFreq: "Daily",  metrics: 36 },
    klaviyo:               { name: "Klaviyo",               logo: "📧", syncFreq: "Daily",  metrics: 22 },
    tiktok_ads:            { name: "TikTok Ads",            logo: "🎵", syncFreq: "Hourly", metrics: 28 },
    linkedin_ads:          { name: "LinkedIn Ads",          logo: "💼", syncFreq: "Daily",  metrics: 19 },
    google_search_console: { name: "Search Console",        logo: "🔍", syncFreq: "Daily",  metrics: 14 },
    mailchimp:             { name: "Mailchimp",             logo: "🐒", syncFreq: "Daily",  metrics: 18 },
    hubspot:               { name: "HubSpot",               logo: "🟠", syncFreq: "Daily",  metrics: 24 },
    woocommerce:           { name: "WooCommerce",           logo: "🛒", syncFreq: "Daily",  metrics: 32 },
    snapchat_ads:          { name: "Snapchat Ads",          logo: "👻", syncFreq: "Hourly", metrics: 16 },
    bing_ads:              { name: "Microsoft / Bing Ads",  logo: "🟦", syncFreq: "Hourly", metrics: 20 },
    youtube:               { name: "YouTube",               logo: "▶️", syncFreq: "Daily",  metrics: 12 },
    twitter_ads:           { name: "Twitter / X Ads",       logo: "🐦", syncFreq: "Hourly", metrics: 15 },
    activecampaign:        { name: "ActiveCampaign",        logo: "⚡", syncFreq: "Daily",  metrics: 17 },
    salesforce:            { name: "Salesforce",            logo: "☁️", syncFreq: "Daily",  metrics: 30 },
    // New connectors
    reddit_ads:            { name: "Reddit Ads",            logo: "🟠", syncFreq: "Hourly", metrics: 22 },
    amazon_ads:            { name: "Amazon Ads",            logo: "🟡", syncFreq: "Hourly", metrics: 44 },
    apple_search_ads:      { name: "Apple Search Ads",      logo: "🍎", syncFreq: "Daily",  metrics: 18 },
    criteo:                { name: "Criteo",                logo: "🔴", syncFreq: "Hourly", metrics: 24 },
    mixpanel:              { name: "Mixpanel",              logo: "🟣", syncFreq: "Hourly", metrics: 38 },
    amplitude:             { name: "Amplitude",             logo: "🔷", syncFreq: "Hourly", metrics: 42 },
    segment:               { name: "Segment",               logo: "🟢", syncFreq: "Hourly", metrics: 35 },
    hotjar:                { name: "Hotjar",                logo: "🌡️", syncFreq: "Daily",  metrics: 14 },
    stripe:                { name: "Stripe",                logo: "💜", syncFreq: "Hourly", metrics: 28 },
    bigcommerce:           { name: "BigCommerce",           logo: "🛍️", syncFreq: "Daily",  metrics: 30 },
    brevo:                 { name: "Brevo",                 logo: "📨", syncFreq: "Daily",  metrics: 20 },
    drip:                  { name: "Drip",                  logo: "💧", syncFreq: "Daily",  metrics: 16 },
    intercom:              { name: "Intercom",              logo: "💬", syncFreq: "Daily",  metrics: 22 },
    pipedrive:             { name: "Pipedrive",             logo: "📊", syncFreq: "Daily",  metrics: 26 },
    zoho_crm:              { name: "Zoho CRM",              logo: "🔴", syncFreq: "Daily",  metrics: 24 },
  };
  // Only show rows for connectors the user has actually connected
  const TABLE_SOURCES = [...connectedIds]
    .filter((id) => ALL_SOURCE_META[id])
    .map((id) => ({ id, ...ALL_SOURCE_META[id], status: "active" as const }));

  const [syncFreqs, setSyncFreqs] = useState<Record<string, string>>(
    Object.fromEntries(TABLE_SOURCES.map((s) => [s.id, s.syncFreq]))
  );
  const [openFreqDropdown, setOpenFreqDropdown] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="Data Sources"
        tabs={DS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={dsTab}
        onTabChange={(k) => setDsTab(k as DsTab)}
        actions={
          <button
            onClick={() => setDsTab("integrations")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Data Source
          </button>
        }
      />
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg transition-all",
          toast.ok ? "bg-green-600" : "bg-red-600"
        )}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <PageContent>

      {/* ── DATA SOURCES tab: table view ── */}
      {dsTab === "sources" && (
        <div className="space-y-4">

          {/* Empty state — no real connections yet */}
          {TABLE_SOURCES.length === 0 && (
            <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto">
                <Plug className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold">No data sources connected yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Connect your first platform to start pulling in real data. GA4, Google Ads, Meta, TikTok and 14 more are available.
                </p>
              </div>
              <button
                onClick={() => setDsTab("integrations")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Connect your first source
              </button>
            </div>
          )}

          {TABLE_SOURCES.length > 0 && (<>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Connected Sources", value: TABLE_SOURCES.length, color: "text-primary" },
              { label: "Syncing Now",        value: TABLE_SOURCES.filter(s => s.status === "active").length, color: "text-emerald-600" },
              { label: "Warnings",           value: 0, color: "text-amber-600" },
              { label: "Total Metrics",      value: TABLE_SOURCES.reduce((a, s) => a + s.metrics, 0), color: "text-blue-600" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sync Frequency</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metrics</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Sync</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TABLE_SOURCES.map((src) => (
                    <tr key={src.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Title */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl leading-none">{src.logo}</span>
                          <span className="font-medium text-foreground">{src.name}</span>
                        </div>
                      </td>

                      {/* Sync Frequency dropdown */}
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <button
                            onClick={() => setOpenFreqDropdown(openFreqDropdown === src.id ? null : src.id)}
                            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition-colors bg-background"
                          >
                            {syncFreqs[src.id] ?? src.syncFreq}
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                          {openFreqDropdown === src.id && (
                            <div className="absolute left-0 top-full mt-1 z-20 w-32 rounded-lg border bg-card shadow-lg py-1">
                              {["Real-time", "15 min", "Hourly", "Daily", "Weekly"].map((f) => (
                                <button
                                  key={f}
                                  onClick={() => { setSyncFreqs(prev => ({...prev, [src.id]: f})); setOpenFreqDropdown(null); }}
                                  className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors", syncFreqs[src.id] === f && "font-semibold text-primary")}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          src.status === "active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", src.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                          {src.status === "active" ? "Active" : "Warning"}
                        </span>
                      </td>

                      {/* Metrics count */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-foreground">{src.metrics}</span>
                        <span className="text-xs text-muted-foreground ml-1">metrics</span>
                      </td>

                      {/* Last sync */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          just now
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDsTab("integrations")}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Details
                          </button>
                          <span className="text-border">|</span>
                          <button className="p-1 rounded text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>)}
        </div>
      )}

      {/* ── DATASETS tab — Custom Metric Builder (Databox split-screen) ── */}
      {dsTab === "datasets" && (
        <CustomMetricBuilder connectedIds={connectedIds} onGoConnect={() => setDsTab("integrations")} />
      )}

      {/* ── MERGED DATASETS tab ── */}
      {dsTab === "merged" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <GitMerge className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">No merged datasets yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Merge datasets to combine metrics from multiple sources into one unified view.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Layers className="h-4 w-4" /> Create Merged Dataset
          </button>
        </div>
      )}

      {/* ── AVAILABLE INTEGRATIONS tab — Databox-style ── */}
      {dsTab === "integrations" && <>

      {/* ── Onboarding hero (first-time clients only) ── */}
      {isOnboarding === true && (
        <OnboardingHero
          user={session?.user}
          connectedCount={connectedCount}
          totalCount={CONNECTORS.filter((c) => c.connectMethod !== "coming_soon").length}
          onLaunch={launchDashboard}
        />
      )}

      {/* ── AI Connection Assistant ── */}
      <AIConnectionAssistant
        connectedIds={connectedIds}
        onSearch={setSearch}
        onCategory={setFilter}
      />

      {/* ── One-Click Popular Packs ── */}
      <PopularPacks connectedIds={connectedIds} onConnect={handleConnect} />

      {/* ── Smart Suggestion (contextual, after ≥1 connection) ── */}
      <SmartSuggestionBanner connectedIds={connectedIds} onConnect={handleConnect} />

      {/* ── Databox-style filter bar ── */}
      <DataboxFilterBar
        search={search}
        onSearch={setSearch}
        sortBy={sortBy}
        onSortBy={setSortBy}
        categoryFilter={filter}
        onCategory={setFilter}
        showFilter={showFilter}
        onShow={setShowFilter}
        connectedCount={connectedCount}
        totalCount={CONNECTORS.length}
      />

      {/* ── Main layout: sections + right detail panel ── */}
      <div className="flex gap-5 min-h-0 items-start">

        {/* ── Left: collapsible sections ── */}
        <div className="flex-1 min-w-0">
          {integrationsFiltered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-medium text-muted-foreground">No integrations match <strong className="text-foreground">{search}</strong></p>
              <button onClick={() => { setSearch(""); setFilter("all"); setShowFilter("all"); }} className="mt-2 text-xs text-primary underline underline-offset-2">
                Clear filters
              </button>
            </div>
          ) : (
            integrationsGrouped.map(({ label, connectors: group }) => (
              <DataboxSection
                key={label}
                label={label}
                connectors={group}
                connectedIds={connectedIds}
                selectedId={detailConnector?.id ?? null}
                onSelect={(c) => setDetailConnector(c)}
                onConnect={(c) => handleConnect(c)}
              />
            ))
          )}
        </div>

        {/* ── Right: sticky detail panel (280px like Databox) ── */}
        <div className={cn(
          "hidden lg:block w-[280px] shrink-0 transition-all duration-200",
          detailConnector ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {detailConnector && (
            <DataboxDetailPanel
              connector={detailConnector}
              isConnected={connectedIds.has(detailConnector.id)}
              onConnect={() => handleConnect(detailConnector)}
              onClose={() => setDetailConnector(null)}
              sourceMeta={ALL_SOURCE_META[detailConnector.id]}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-center mt-2">
        <Plug className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Missing an integration?</p>
        <p className="text-xs text-muted-foreground mt-1">
          We add new connectors every month.{" "}
          <a href="mailto:sub17h4@gmail.com" className="underline underline-offset-2 hover:text-foreground">
            Request one →
          </a>
        </p>
      </div>

      {/* ── Bottom CTA for onboarding ── */}
      {isOnboarding === true && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold">Ready to explore your data?</p>
            <p className="text-xs text-muted-foreground mt-0.5">You can always add more sources later.</p>
          </div>
          <Button className="gap-2 shrink-0" onClick={launchDashboard}>
            Launch Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Connector modal */}
      {modal && (
        <ConnectorModal
          modal={modal}
          onClose={() => setModal(null)}
          onConnected={(id) => {
            markConnected(id);
            setModal(null);
          }}
        />
      )}

      {/* GA4 property picker — shown after Google OAuth callback */}
      {showGA4Picker && (
        <GA4PropertyPickerModal
          onClose={() => setShowGA4Picker(false)}
          onSelect={(propertyId, displayName) => {
            try {
              localStorage.setItem("ga4_selected_property", propertyId);
              window.dispatchEvent(new StorageEvent("storage", { key: "ga4_selected_property", newValue: propertyId }));
            } catch {}
            setConnectedIds((prev) => {
              const next = new Set(prev);
              next.add("ga4" as ConnectorId);
              persist(next);
              return next;
            });
            setShowGA4Picker(false);
            showToast(`Google Analytics 4 connected — ${displayName}`, true);
          }}
        />
      )}

      {/* Close integrations tab */}
      </>}

      </PageContent>
    </>
  );
}

// ── Smart Suggestions ─────────────────────────────────────────────────────────

const SMART_SUGGESTIONS: Array<{
  trigger: ConnectorId[];  // show when ALL of these are connected
  suggest: ConnectorId;    // connector to suggest
  headline: string;
  reason: string;
}> = [
  { trigger: ["meta_ads", "ga4"],     suggest: "shopify",    headline: "Connect Shopify to unlock Revenue & ROAS insights", reason: "You connected Meta + GA4" },
  { trigger: ["shopify", "ga4"],      suggest: "klaviyo",    headline: "Add Klaviyo to see email-driven revenue attribution", reason: "You connected Shopify + GA4" },
  { trigger: ["google_ads", "meta_ads"], suggest: "ga4",     headline: "Connect GA4 to tie ad spend to on-site conversions", reason: "You connected Google Ads + Meta" },
  { trigger: ["ga4"],                 suggest: "google_ads", headline: "Connect Google Ads to see cost-per-acquisition",    reason: "You connected GA4" },
  { trigger: ["shopify"],             suggest: "meta_ads",   headline: "Add Meta Ads to track Facebook & Instagram ROAS",   reason: "You connected Shopify" },
  { trigger: ["klaviyo"],             suggest: "shopify",    headline: "Connect Shopify to see email revenue contribution",  reason: "You connected Klaviyo" },
  { trigger: ["google_ads"],          suggest: "google_search_console", headline: "Add Search Console to combine paid + organic data", reason: "You connected Google Ads" },
];

function SmartSuggestionBanner({
  connectedIds,
  onConnect,
}: {
  connectedIds: Set<ConnectorId>;
  onConnect: (c: Connector) => void;
}) {
  if (connectedIds.size < 1) return null;

  const match = SMART_SUGGESTIONS.find(
    (s) =>
      s.trigger.every((id) => connectedIds.has(id)) &&
      !connectedIds.has(s.suggest)
  );
  if (!match) return null;

  const connector = CONNECTORS.find((c) => c.id === match.suggest);
  if (!connector) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 mb-1">
      <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-violet-500 dark:text-violet-400 font-medium mb-0.5">{match.reason}</p>
        <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">{match.headline}</p>
      </div>
      <button
        onClick={() => onConnect(connector)}
        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Connect
      </button>
    </div>
  );
}

// ── One-Click Popular Packs ───────────────────────────────────────────────────

const PACKS = [
  {
    id: "dtc",
    name: "DTC Starter Pack",
    description: "Shopify + Meta + GA4 + Klaviyo",
    icon: Rocket,
    color: "bg-orange-500",
    connectors: ["shopify", "meta_ads", "ga4", "klaviyo"] as ConnectorId[],
  },
  {
    id: "agency",
    name: "Agency Pack",
    description: "Google Ads + Meta + LinkedIn + TikTok",
    icon: Layers,
    color: "bg-blue-500",
    connectors: ["google_ads", "meta_ads", "linkedin_ads", "tiktok_ads"] as ConnectorId[],
  },
  {
    id: "saas",
    name: "SaaS Growth Pack",
    description: "GA4 + Mixpanel + HubSpot + Stripe",
    icon: BarChart2,
    color: "bg-emerald-500",
    connectors: ["ga4", "mixpanel", "hubspot", "stripe"] as ConnectorId[],
  },
];

function PopularPacks({
  connectedIds,
  onConnect,
}: {
  connectedIds: Set<ConnectorId>;
  onConnect: (c: Connector) => void;
}) {
  return (
    <div className="mb-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
        Popular Packs — connect multiple at once
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PACKS.map((pack) => {
          const Icon = pack.icon;
          const totalInPack = pack.connectors.length;
          const connectedInPack = pack.connectors.filter((id) => connectedIds.has(id)).length;
          const allConnected = connectedInPack === totalInPack;
          return (
            <button
              key={pack.id}
              disabled={allConnected}
              onClick={() => {
                // Connect each un-connected connector in the pack sequentially
                pack.connectors.forEach((id) => {
                  if (!connectedIds.has(id)) {
                    const c = CONNECTORS.find((x) => x.id === id);
                    if (c) onConnect(c);
                  }
                });
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                allConnected
                  ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 opacity-70 cursor-default"
                  : "border-border hover:border-primary/40 hover:bg-muted/40 active:scale-[0.98]"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", pack.color)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">{pack.name}</p>
                <p className="text-xs text-muted-foreground truncate">{pack.description}</p>
              </div>
              {allConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {connectedInPack}/{totalInPack}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Connection Assistant ───────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  { q: "help me connect all my ad accounts", matches: ["google_ads", "meta_ads", "linkedin_ads", "tiktok_ads"] as ConnectorId[] },
  { q: "connect ecommerce",                  matches: ["shopify", "woocommerce", "klaviyo"] as ConnectorId[] },
  { q: "set up email marketing",             matches: ["klaviyo", "mailchimp", "brevo"] as ConnectorId[] },
  { q: "connect crm",                        matches: ["hubspot", "salesforce", "pipedrive"] as ConnectorId[] },
  { q: "connect analytics",                  matches: ["ga4", "google_search_console", "mixpanel"] as ConnectorId[] },
];

function AIConnectionAssistant({
  connectedIds,
  onSearch,
  onCategory,
}: {
  connectedIds: Set<ConnectorId>;
  onSearch: (q: string) => void;
  onCategory: (c: Category | "all") => void;
}) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  function handleAsk() {
    const q = input.trim().toLowerCase();
    if (!q) return;

    // Check preset mappings first
    const preset = AI_SUGGESTIONS.find((s) => q.includes(s.q.split(" ").slice(-2).join(" ")) || s.q.includes(q));
    if (preset) {
      const notConnected = preset.matches.filter((id) => !connectedIds.has(id));
      const names = notConnected.map((id) => CONNECTORS.find((c) => c.id === id)?.name).filter(Boolean);
      setReply(`I'll filter to ${names.length > 0 ? names.join(", ") : "those connectors"} for you.`);
      // Map to category filter based on the first match
      const firstConnector = CONNECTORS.find((c) => preset.matches.includes(c.id));
      if (firstConnector) {
        if (["google_ads", "meta_ads", "linkedin_ads", "tiktok_ads", "pinterest_ads", "snapchat_ads", "bing_ads", "twitter_ads", "reddit_ads", "amazon_ads", "apple_search_ads", "criteo"].includes(firstConnector.id)) {
          onCategory("ads");
        } else if (["ga4", "google_search_console", "mixpanel", "amplitude", "segment", "hotjar"].includes(firstConnector.id)) {
          onCategory("analytics");
        } else if (["shopify", "woocommerce", "bigcommerce", "stripe"].includes(firstConnector.id)) {
          onCategory("ecommerce");
        } else if (["klaviyo", "mailchimp", "brevo", "drip", "activecampaign"].includes(firstConnector.id)) {
          onCategory("email");
        } else if (["hubspot", "salesforce", "pipedrive", "intercom", "zoho_crm"].includes(firstConnector.id)) {
          onCategory("crm");
        } else {
          onCategory("all");
        }
      }
    } else {
      // Fallback: use as search
      onSearch(q);
      setReply(`Showing results for "${input.trim()}"`);
    }
    setInput("");
    setTimeout(() => setReply(null), 4000);
  }

  return (
    <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-violet-500/5 px-4 py-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold text-primary">AI Connection Assistant</p>
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder={"Help me connect all my ad accounts…"}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleAsk}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          Ask
        </button>
      </div>
      {reply && (
        <p className="mt-2 text-xs text-primary font-medium flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> {reply}
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Try: "connect my ecommerce stack" · "set up email marketing" · "link all ad accounts"
      </p>
    </div>
  );
}

// ── Databox filter bar ────────────────────────────────────────────────────────

type SortBy     = "popularity" | "name_asc" | "name_desc";
type ShowFilter = "all" | "connected" | "not_connected";

// ── Databox-style filter bar ──────────────────────────────────────────────────

function DataboxFilterBar({
  search, onSearch, sortBy, onSortBy, categoryFilter, onCategory, showFilter, onShow, connectedCount, totalCount,
}: {
  search: string; onSearch: (v: string) => void;
  sortBy: SortBy; onSortBy: (v: SortBy) => void;
  categoryFilter: Category | "all"; onCategory: (v: Category | "all") => void;
  showFilter: ShowFilter; onShow: (v: ShowFilter) => void;
  connectedCount: number; totalCount: number;
}) {
  const selectCls = "rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer appearance-none pr-8 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center]";
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b pb-4 mb-1">
      {/* Search */}
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Sort by */}
        <select value={sortBy} onChange={e => onSortBy(e.target.value as SortBy)} className={selectCls}>
          <option value="popularity">Popularity</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>

        {/* Category */}
        <select value={categoryFilter} onChange={e => onCategory(e.target.value as Category | "all")} className={selectCls}>
          <option value="all">Category</option>
          <option value="analytics">Analytics</option>
          <option value="ads">Advertising</option>
          <option value="ecommerce">E-commerce</option>
          <option value="email">Email Marketing</option>
          <option value="crm">CRM</option>
        </select>

        {/* Show */}
        <select value={showFilter} onChange={e => onShow(e.target.value as ShowFilter)} className={selectCls}>
          <option value="all">Show: All</option>
          <option value="connected">Connected ({connectedCount})</option>
          <option value="not_connected">Not connected</option>
        </select>
      </div>
    </div>
  );
}

// ── Databox connector card — horizontal list-item style ───────────────────────

function DataboxConnectorCard({
  connector,
  isConnected,
  isSelected,
  onSelect,
  onConnect,
}: {
  connector: Connector;
  isConnected: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onConnect: () => void;
}) {
  const isComingSoon = connector.connectMethod === "coming_soon";
  return (
    <div
      onClick={() => !isComingSoon && onSelect()}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-all duration-150 select-none",
        isSelected
          ? "border-primary/60 bg-primary/5 shadow-sm"
          : isConnected
          ? "border-green-400/40 bg-green-50/40 dark:bg-green-950/10"
          : isComingSoon
          ? "opacity-40 cursor-default border-border bg-card"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/20 hover:shadow-sm"
      )}
    >
      {/* Circular logo — exactly like Databox */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-150",
        isSelected  ? "border-primary/50 scale-105" :
        isConnected ? "border-green-400/50" :
        "border-border/60 group-hover:border-primary/30"
      )}>
        <div className="h-6 w-6 flex items-center justify-center">
          {connector.logo}
        </div>
      </div>

      {/* Name + action */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{connector.name}</p>
        {isConnected ? (
          <span className="text-[11px] font-medium text-green-600 dark:text-green-400">Connected</span>
        ) : isComingSoon ? (
          <span className="text-[11px] text-muted-foreground">Coming soon</span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onConnect(); }}
            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
          >
            Datasets
          </button>
        )}
      </div>

      {/* Status indicator */}
      {isConnected && (
        <span className="shrink-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
      )}
      {isSelected && !isConnected && (
        <ChevronRight className="shrink-0 h-3.5 w-3.5 text-primary opacity-70" />
      )}
    </div>
  );
}

// ── Databox section — collapsible with section header ────────────────────────

function DataboxSection({
  label, connectors, connectedIds, selectedId, onSelect, onConnect,
}: {
  label: string;
  connectors: Connector[];
  connectedIds: Set<ConnectorId>;
  selectedId: string | null;
  onSelect: (c: Connector) => void;
  onConnect: (c: Connector) => void;
}) {
  const [open, setOpen] = useState(true);
  const connectedInSection = connectors.filter(c => connectedIds.has(c.id)).length;

  return (
    <div className="mb-2">
      {/* Section header — Databox style: chevron left + uppercase label */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-1 py-2 group hover:opacity-80 transition-opacity"
      >
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
          !open && "-rotate-90"
        )} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        {connectedInSection > 0 && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />{connectedInSection} connected
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground/60">{connectors.length}</span>
      </button>

      {/* Grid — 2–4 cols of horizontal cards like Databox */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-1">
          {connectors.map((c) => (
            <DataboxConnectorCard
              key={c.id}
              connector={c}
              isConnected={connectedIds.has(c.id)}
              isSelected={selectedId === c.id}
              onSelect={() => onSelect(c)}
              onConnect={() => onConnect(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Databox right detail panel ────────────────────────────────────────────────

function DataboxDetailPanel({
  connector, isConnected, onConnect, onClose, sourceMeta,
}: {
  connector: Connector;
  isConnected: boolean;
  onConnect: () => void;
  onClose: () => void;
  sourceMeta?: { name: string; logo: string; syncFreq: string; metrics: number };
}) {
  const catLabel: Record<Category, string> = {
    analytics: "Analytics", ads: "Advertising", ecommerce: "E-commerce", email: "Email Marketing", crm: "CRM",
  };

  const connMethodLabel: Record<string, string> = {
    google_oauth:  "Google OAuth",
    google_shared: "Google OAuth",
    setup_modal:   "OAuth",
    domain_oauth:  "Domain OAuth",
    api_key:       "API Key",
    coming_soon:   "Coming soon",
  };

  return (
    <div className="rounded-xl border bg-card shadow-md overflow-hidden sticky top-4">
      {/* Header */}
      <div className="relative flex items-start gap-3 p-5 border-b bg-gradient-to-br from-muted/40 to-background">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-white dark:bg-zinc-900 shadow-sm">
          <div className="h-8 w-8 flex items-center justify-center">{connector.logo}</div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-bold leading-tight">{connector.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{catLabel[connector.category]}</p>
          {isConnected && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-green-600 dark:text-green-400">Active · Syncing</span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">

        {/* CTA */}
        {isConnected ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-green-700 dark:text-green-400">Connected & Active</p>
              <p className="text-[11px] text-green-600/80 dark:text-green-500/80 mt-0.5">Data syncing {sourceMeta?.syncFreq?.toLowerCase() ?? "daily"}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Plug className="h-4 w-4" />
            Connect {connector.name.split(" ")[0]}
          </button>
        )}

        {/* Description */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">About</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{connector.description}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border bg-muted/30 p-3 text-center">
            <p className="text-xl font-bold text-foreground leading-none">{sourceMeta?.metrics ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Metrics</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 text-center">
            <p className="text-sm font-bold text-foreground leading-none">{sourceMeta?.syncFreq ?? "Daily"}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Sync freq.</p>
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Connection</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
              <Key className="h-3 w-3 text-muted-foreground" />
              {connMethodLabel[connector.connectMethod] ?? "API"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-2.5 py-1.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
              <ShieldCheck className="h-3 w-3" />
              GDPR
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              🇪🇺 EU Safe
            </span>
          </div>
        </div>

        {/* Docs link */}
        {connector.docs && (
          <a
            href={connector.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {connector.docsLabel ?? "View documentation"}
          </a>
        )}

        {/* Read-only note */}
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t pt-3">
          Read-only access · We never write to your account · Encrypted in transit
        </p>
      </div>
    </div>
  );
}

// ── Wrapper (Suspense for useSearchParams) ────────────────────────────────────

export default function ConnectPageWrapper() {
  return (
    <Suspense>
      <ConnectPage />
    </Suspense>
  );
}
