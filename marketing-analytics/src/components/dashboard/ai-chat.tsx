"use client";

/**
 * AI Chat FAB — Floating campaign intelligence assistant.
 * Shows page-contextual insights from getPageInsights() + handles campaign Q&A
 * using the local AI engine (no API key needed).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Send, ChevronDown, RotateCcw, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPageInsights, detectIssues, computeHealthScore, type PageContext } from "@/lib/ai-engine";
import { CAMPAIGNS, buildPlatformSummaries } from "@/lib/campaign-data";

type Message = { id: string; role: "user" | "assistant"; content: string };

// ── Page context detection ────────────────────────────────────────────────────

function pathToContext(pathname: string): PageContext {
  if (pathname.includes("/campaigns"))  return "campaigns";
  if (pathname.includes("/ads"))        return "ads";
  if (pathname.includes("/goals"))      return "goals";
  if (pathname.includes("/seo"))        return "seo";
  if (pathname.includes("/funnel"))     return "funnel";
  if (pathname.includes("/traffic"))    return "traffic";
  if (pathname.includes("/budget"))     return "budget";
  if (pathname.includes("/reports"))    return "reports";
  if (pathname.includes("/alerts"))     return "alerts";
  if (pathname.includes("/attribution"))return "attribution";
  return "overview";
}

// ── Connector setup knowledge base ───────────────────────────────────────────

function getConnectorAnswer(t: string): string | null {

  // ── What connectors / platforms are available ──
  if (t.includes("what connector") || t.includes("which connector") || t.includes("what platform") ||
      t.includes("which platform") || t.includes("what can i connect") || t.includes("available integration") ||
      t.includes("list of") || t.includes("all connector") || t.includes("supported platform")) {
    return `🔌 **33 connectors available** — go to **Data Sources** in the sidebar to connect any of them:\n\n**Analytics**\n• Google Analytics 4 (GA4)\n• Google Search Console\n• YouTube\n• Mixpanel\n• Amplitude\n• Segment\n• Hotjar\n\n**Paid Ads**\n• Google Ads\n• Meta Ads (Facebook + Instagram)\n• TikTok Ads\n• LinkedIn Ads\n• Reddit Ads\n• Amazon Ads\n• Apple Search Ads\n• Criteo\n• Snapchat Ads\n• Microsoft / Bing Ads\n• Twitter / X Ads\n• Pinterest Ads *(coming soon)*\n\n**Ecommerce**\n• Shopify (OAuth)\n• WooCommerce\n• Stripe\n• BigCommerce\n\n**Email Marketing**\n• Klaviyo\n• Mailchimp\n• Brevo\n• Drip\n• ActiveCampaign\n\n**CRM**\n• HubSpot\n• Intercom\n• Pipedrive\n• Zoho CRM\n• Salesforce\n\nClick any connector on the Data Sources page to get step-by-step setup instructions.`;
  }

  // ── GA4 ──
  if (t.includes("ga4") || t.includes("google analytics") || t.includes("property id") ||
      (t.includes("analytics") && !t.includes("google ads"))) {
    return `📊 **How to connect Google Analytics 4:**\n\n1. Open **Google Analytics** → Admin (gear icon bottom-left)\n2. Under *Property* click **Property Settings**\n3. Copy the **Property ID** — it's a number like \`123456789\`\n4. In this dashboard go to **Data Sources** → click **Google Analytics 4**\n5. Paste your Property ID and click **Connect GA4**\n\nThe purple "Sample data" banner disappears once connected and your real data loads.\n\n💡 *Tip: If your GA4 account has multiple properties (e.g. staging vs production), make sure you copy the production Property ID.*`;
  }

  // ── Google Ads ──
  if ((t.includes("google ads") || t.includes("google ad")) && !t.includes("analytics")) {
    return `🔵 **How to connect Google Ads:**\n\n1. Sign in to **Google Ads** → click the wrench icon → **API Center**\n2. Apply for a **Developer Token** (takes 1–3 days for approval if you don't have one)\n3. Copy your **Customer ID** — the 10-digit number at the top right (e.g. \`123-456-7890\`)\n4. Go to **Data Sources** → click **Google Ads** → enter both values\n\n⚠️ *The Developer Token is account-level — one token works for all your Google Ads accounts.*\n\n**Already connected but no data?** Check that your Customer ID has no dashes — enter it as \`1234567890\`, not \`123-456-7890\`.`;
  }

  // ── Meta Ads / Facebook / Instagram ──
  if (t.includes("meta ads") || t.includes("meta ad") || t.includes("facebook ads") ||
      t.includes("facebook ad") || (t.includes("meta") && (t.includes("connect") || t.includes("setup") || t.includes("api") || t.includes("token") || t.includes("not work")))) {
    return `📘 **How to connect Meta Ads:**\n\n1. Go to **Data Sources** → click **Meta Ads**\n2. Click **Connect with Meta** — you'll be redirected to Facebook to authorise\n3. Select the **Ad Account** you want to connect\n4. You'll be redirected back automatically\n\nMeta uses OAuth — no API keys needed. The same login connects both Facebook and Instagram ad data.\n\n**Not working?** Make sure you're logging in as a user who has *Admin* or *Advertiser* access on the Meta Business account — Analyst-only access won't work.\n\n**Token expired?** Just click Connect again to re-authorise.`;
  }

  // ── TikTok Ads ──
  if (t.includes("tiktok") || t.includes("tik tok")) {
    return `🎵 **How to connect TikTok Ads:**\n\n1. Go to **Data Sources** → click **TikTok Ads**\n2. Click **Authorize with TikTok** — you'll be redirected to TikTok Business Center\n3. Grant access to your **Ad Account**\n4. You'll be redirected back automatically\n\n**Can't see your account?** Make sure you're logged into TikTok Business Center with the account that owns your ad account — not just a personal TikTok account.\n\n**Access denied error?** You need *Operator* or *Admin* role on the TikTok Business account — ask your account admin to update your permissions.`;
  }

  // ── LinkedIn Ads ──
  if (t.includes("linkedin")) {
    return `💼 **How to connect LinkedIn Ads:**\n\n1. Go to **Data Sources** → click **LinkedIn Ads**\n2. Click **Connect with LinkedIn** — authorise with your LinkedIn account\n3. Select your **Campaign Manager account**\n4. You'll be redirected back automatically\n\n**Nothing showing after connecting?** Your LinkedIn account needs *Account Manager* or *Campaign Manager* role on the ad account. Basic member access won't pull data.\n\n**Multiple accounts?** LinkedIn will show all accounts your profile has access to — pick the right one during the OAuth flow.`;
  }

  // ── Snapchat Ads ──
  if (t.includes("snapchat") || t.includes("snap ads") || t.includes("snap ad")) {
    return `👻 **How to connect Snapchat Ads:**\n\n1. Go to **Data Sources** → click **Snapchat Ads**\n2. Click **Connect with Snapchat** — you'll be redirected to Snapchat Business\n3. Authorise access to your **Ad Account**\n4. You'll be redirected back automatically\n\n**Token expired?** Snapchat access tokens last 30 days. Click Connect again to refresh.\n\n**No ad account found?** Log into Snapchat Ads Manager first to ensure your account is set up, then reconnect.`;
  }

  // ── Bing / Microsoft Ads ──
  if (t.includes("bing") || t.includes("microsoft ads") || t.includes("microsoft ad")) {
    return `🟦 **How to connect Microsoft / Bing Ads:**\n\n1. Go to **Data Sources** → click **Microsoft / Bing Ads**\n2. Click **Connect with Microsoft** — authorise with your Microsoft account\n3. Your **Customer ID** and **Developer Token** are fetched automatically\n4. You'll be redirected back automatically\n\n**Developer Token not approved?** Apply at **Microsoft Advertising → Tools → API Access**. Basic tokens (for your own account only) are approved instantly.\n\n**Seeing the wrong account?** Make sure you log in with the Microsoft account that owns the ad account, not a linked personal account.`;
  }

  // ── Twitter / X Ads ──
  if (t.includes("twitter") || t.includes("x ads") || t.includes("x ad") || t.includes("tweet")) {
    return `🐦 **How to connect Twitter / X Ads:**\n\n1. Go to **Data Sources** → click **Twitter / X Ads**\n2. You'll need a **Bearer Token** from the Twitter Developer Portal\n3. Go to **developer.twitter.com** → create a project → copy the Bearer Token\n4. Paste it on the Data Sources page and click Save\n\n**Don't have a developer account?** Sign up free at developer.twitter.com — basic access is instant.\n\n**Bearer Token vs API Key?** Use the **Bearer Token** (starts with \`AAAA...\`), not the API Key or API Secret.`;
  }

  // ── YouTube ──
  if (t.includes("youtube") || t.includes("you tube") || t.includes("channel id")) {
    return `▶️ **How to connect YouTube:**\n\n1. Go to **YouTube Studio** → click your profile icon at the top right → **Settings**\n2. Under *Channel* → *Advanced settings* → copy your **Channel ID** (starts with \`UC...\`)\n3. Go to **Data Sources** → click **YouTube** → paste the Channel ID and save\n\n**Where to find Channel ID?** It's on youtube.com/account_advanced — or in YouTube Studio → Customisation → Basic info → scroll to the bottom.\n\n**Different from Channel Handle (@yourname)?** Yes — the Channel ID starts with \`UC\` followed by 22 characters. Don't paste your handle.`;
  }

  // ── Google Search Console ──
  if (t.includes("search console") || t.includes("gsc") || t.includes("google search")) {
    return `🔍 **How to connect Google Search Console:**\n\n1. Go to **Google Search Console** (search.google.com/search-console)\n2. Select your property and copy the **Site URL** exactly as it appears (e.g. \`https://yoursite.com/\`)\n3. Go to **Data Sources** → click **Google Search Console** → paste the URL and save\n\n**URL format matters:** Use the exact URL shown in Search Console — including the trailing slash if it's there. \`https://yoursite.com/\` and \`https://yoursite.com\` are treated as different properties.\n\n**Domain property vs URL prefix?** Both work — just copy whatever is shown in your Search Console property selector.`;
  }

  // ── Shopify ──
  if (t.includes("shopify")) {
    return `🛍️ **How to connect Shopify:**\n\n1. Go to **Data Sources** → click **Shopify**\n2. Enter your **store domain** (e.g. \`yourstore.myshopify.com\` — without https://)\n3. Click **Connect** — you'll be redirected to Shopify to authorise\n4. Click **Install app** on the Shopify permissions page\n5. You'll be redirected back automatically\n\n**Which domain format?** Always use \`yourstore.myshopify.com\` — not your custom domain (e.g. not \`www.yourstore.com\`).\n\n**Don't have store owner access?** Shopify requires store owner or staff with *Apps and channels* permission to install apps.`;
  }

  // ── WooCommerce ──
  if (t.includes("woocommerce") || t.includes("woo commerce") || t.includes("woo")) {
    return `🛒 **How to connect WooCommerce:**\n\n1. In your **WordPress admin** go to **WooCommerce → Settings → Advanced → REST API**\n2. Click **Add key** → set permissions to **Read** → click **Generate API key**\n3. Copy the **Consumer Key** and **Consumer Secret** (only shown once!)\n4. Go to **Data Sources** → click **WooCommerce**\n5. Enter your **Store URL**, **Consumer Key**, and **Consumer Secret** → click Save\n\n⚠️ *Save your Consumer Secret immediately — WooCommerce only shows it once after generation.*\n\n**Getting 401 errors?** Make sure WordPress permalinks are set to anything other than "Plain" — go to Settings → Permalinks and save.`;
  }

  // ── Klaviyo ──
  if (t.includes("klaviyo")) {
    return `📧 **How to connect Klaviyo:**\n\n1. In **Klaviyo** go to **Account → Settings → API Keys**\n2. Click **Create Private API Key** → give it a name → set scope to **Read-only**\n3. Copy the key (starts with \`pk_...\`)\n4. Go to **Data Sources** → click **Klaviyo** → paste the key and save\n\n**Private Key vs Public Key?** Use the **Private API Key** (starts with \`pk_\`) — the Public Key is for tracking only.\n\n**Key not working?** Make sure the key has *Full Access* or at minimum *Read Access* for Metrics, Campaigns, and Flows.`;
  }

  // ── Mailchimp ──
  if (t.includes("mailchimp") || t.includes("mail chimp")) {
    return `🐒 **How to connect Mailchimp:**\n\n1. In **Mailchimp** click your profile icon → **Account & billing → Extras → API keys**\n2. Click **Create A Key** → copy the key (format: \`abc123...-us1\`)\n3. Go to **Data Sources** → click **Mailchimp** → paste the key and save\n\n**The \`-us1\` at the end is part of the key** — it tells us which Mailchimp data centre your account is on. Include it.\n\n**Key invalid error?** Make sure you copy the full key including the datacenter suffix (e.g. \`-us1\`, \`-us6\`, \`-eu1\` etc.).`;
  }

  // ── HubSpot ──
  if (t.includes("hubspot") || t.includes("hub spot")) {
    return `🟠 **How to connect HubSpot:**\n\n1. In **HubSpot** go to **Settings (gear icon) → Integrations → Private Apps**\n2. Click **Create a private app** → name it → under *Scopes* enable **CRM read** permissions\n3. Click **Create app** → copy the **Access Token** (starts with \`pat-na1-...\`)\n4. Go to **Data Sources** → click **HubSpot** → paste the token and save\n\n**Legacy API Key deprecated:** HubSpot retired API Keys in 2023 — use a **Private App Token** instead.\n\n**Seeing 403 errors?** Your private app needs *crm.objects.contacts.read*, *crm.objects.deals.read* scopes at minimum.`;
  }

  // ── ActiveCampaign ──
  if (t.includes("activecampaign") || t.includes("active campaign")) {
    return `⚡ **How to connect ActiveCampaign:**\n\n1. In **ActiveCampaign** go to **Settings → Developer**\n2. Copy your **API URL** and **API Key** from that page\n3. Go to **Data Sources** → click **ActiveCampaign** → paste the API Key and save\n\n**API URL format:** Your API URL looks like \`https://youraccountname.api-us1.com\` — you don't need to enter this separately, just the key.\n\n**Key not accepting?** Make sure you're copying from Settings → Developer, not from a third-party integration page.`;
  }

  // ── Salesforce ──
  if (t.includes("salesforce") || t.includes("sales force")) {
    return `☁️ **How to connect Salesforce:**\n\n1. In **Salesforce** go to **Setup → App Manager → New Connected App**\n2. Enable **OAuth Settings** → add callback URL: \`https://marketing-analytics-self.vercel.app/api/connect/callback/salesforce\`\n3. Add scopes: **api** and **refresh_token**\n4. Save, then copy the **Consumer Key** and **Consumer Secret**\n5. Go to **Data Sources** → click **Salesforce** → click **Connect with Salesforce**\n\n**Sandbox vs Production?** This connects to your production org at login.salesforce.com. For sandbox, contact support.\n\n**Permission error?** The Salesforce user must have the *API Enabled* permission in their profile.`;
  }

  // ── Reddit Ads ──
  if (t.includes("reddit")) {
    return `🟠 **How to connect Reddit Ads:**\n\n1. Go to **ads.reddit.com** → click your name (top-right) → **App Settings**\n2. Click **Create Application** → choose **Script** type\n3. Copy your **Client ID** and **Client Secret**\n4. Use them to generate an OAuth **Access Token** (or use a Reddit API client library)\n5. In this dashboard go to **Data Sources** → click **Reddit Ads** → paste your Access Token\n\n**What data you'll get:** Campaign spend, impressions, clicks, conversions, CPM, CTR by subreddit and creative.`;
  }

  // ── Amazon Ads ──
  if (t.includes("amazon ads") || t.includes("amazon advertising") || t.includes("amazon ad")) {
    return `🟡 **How to connect Amazon Ads:**\n\n1. Go to **advertising.amazon.com** → click **Settings → API Access**\n2. Create a new **LWA (Login with Amazon) application**\n3. Note your **Client ID** and **Client Secret**\n4. Find your **Profile ID** in the Amazon Advertising console\n5. In this dashboard go to **Data Sources** → click **Amazon Ads**\n\n**Prerequisites:** You need an Amazon Advertising account and API access. This works for Sponsored Products, Sponsored Brands and DSP campaigns.\n\n**Contact support** to complete the setup — we'll configure the env vars for you.`;
  }

  // ── Apple Search Ads ──
  if (t.includes("apple search") || t.includes("apple ads") || t.includes("app store ads")) {
    return `🍎 **How to connect Apple Search Ads:**\n\n1. Log in to **searchads.apple.com** → Settings → **API Keys**\n2. Click **Create API Key** — download the **.p8 private key** file\n3. Note your **Client ID**, **Team ID**, and **Key ID**\n4. In this dashboard go to **Data Sources** → click **Apple Search Ads**\n\n**What data you'll get:** Campaign taps, installs, CPT (Cost Per Tap), TTR, and conversion rates for App Store campaigns.\n\n**Note:** Apple Search Ads is only for mobile app promotion on the App Store.`;
  }

  // ── Criteo ──
  if (t.includes("criteo")) {
    return `🔴 **How to connect Criteo:**\n\n1. Log in to **Criteo Management Center** → go to **Settings → API Access**\n2. Create a new API app to get your **Client ID** and **Client Secret**\n3. In this dashboard go to **Data Sources** → click **Criteo**\n\n**What data you'll get:** Retargeting campaign performance, dynamic product ads, CPC, ROAS, reach and frequency metrics.`;
  }

  // ── Mixpanel ──
  if (t.includes("mixpanel")) {
    return `🟣 **How to connect Mixpanel:**\n\n1. Log in to **Mixpanel** → click your avatar (top-right) → **Organisation Settings**\n2. Go to **Service Accounts** → **Create Service Account**\n3. Select your project and assign the **Analyst** role\n4. Copy the **Service Account Secret**\n5. In this dashboard go to **Data Sources** → click **Mixpanel** → paste the secret\n\n**What data you'll get:** User events, funnel analysis, retention cohorts, A/B test results and user property insights.`;
  }

  // ── Amplitude ──
  if (t.includes("amplitude")) {
    return `🔷 **How to connect Amplitude:**\n\n1. Log in to **Amplitude** → click **Settings** (gear icon, bottom-left)\n2. Select your project → go to **General**\n3. Copy the **API Key** shown in the project info\n4. In this dashboard go to **Data Sources** → click **Amplitude** → paste the API key\n\n**What data you'll get:** Behavioural events, user journeys, retention charts, cohort analysis and feature adoption metrics.`;
  }

  // ── Segment ──
  if (t.includes("segment") && !t.includes("audience segment")) {
    return `🟢 **How to connect Segment:**\n\n1. Log in to **app.segment.com** → go to **Settings → Access Management**\n2. Click **Tokens** → **Create Token**\n3. Set name, choose **Workspace Owner** role, click Create\n4. Copy the token — it is shown only once\n5. In this dashboard go to **Data Sources** → click **Segment** → paste the token\n\n**What data you'll get:** Unified customer profiles, event streams, source summaries and destination sync status.`;
  }

  // ── Hotjar ──
  if (t.includes("hotjar")) {
    return `🌡️ **How to connect Hotjar:**\n\n1. Log in to **Hotjar** → click **Settings** (top-right)\n2. Go to **Sites & Organisations**\n3. Your **Site ID** is the 7-digit number next to your site name\n4. In this dashboard go to **Data Sources** → click **Hotjar** → paste the Site ID\n\n**What data you'll get:** Page heatmap scores, session recording counts, survey responses, and form completion/abandonment rates.`;
  }

  // ── Stripe ──
  if (t.includes("stripe")) {
    return `💜 **How to connect Stripe:**\n\n1. Log in to **Stripe Dashboard** → click **Developers** (top-right) → **API Keys**\n2. Copy the **Secret key** (starts with \`sk_live_\` for production)\n3. 💡 Tip: Create a **Restricted Key** with read-only access to Charges, Customers, Subscriptions for extra safety\n4. In this dashboard go to **Data Sources** → click **Stripe** → paste the key\n\n**What data you'll get:** Payment revenue, MRR, ARR, refund rates, dispute rates, customer LTV and churn metrics.`;
  }

  // ── BigCommerce ──
  if (t.includes("bigcommerce") || t.includes("big commerce")) {
    return `🛍️ **How to connect BigCommerce:**\n\n1. Log in to **BigCommerce Admin** → click **Advanced Settings → API Accounts**\n2. Click **Create API Account** → choose **V2/V3 API Token**\n3. Set permissions: **Orders** (read), **Products** (read), **Store Information** (read)\n4. Copy the **Access Token** — it is shown only once\n5. In this dashboard go to **Data Sources** → click **BigCommerce** → paste the token\n\n**What data you'll get:** Orders, revenue, conversion rate, average order value, product performance and customer analytics.`;
  }

  // ── Brevo ──
  if (t.includes("brevo") || t.includes("sendinblue")) {
    return `📨 **How to connect Brevo (formerly Sendinblue):**\n\n1. Log in to **Brevo** → click your name (top-right) → **SMTP & API**\n2. Click the **API Keys** tab\n3. Click **Generate a new API key**, name it and confirm\n4. Copy the key (starts with \`xkeysib-\`)\n5. In this dashboard go to **Data Sources** → click **Brevo** → paste the key\n\n**What data you'll get:** Email campaign open rates, click rates, unsubscribes, SMS delivery stats and contact list growth.`;
  }

  // ── Drip ──
  if (t.includes("drip") && !t.includes("drip campaign")) {
    return `💧 **How to connect Drip:**\n\n1. Log in to **Drip** → click your name (top-right) → **User Settings**\n2. Click the **API Token** tab\n3. Copy your personal API token\n4. In this dashboard go to **Data Sources** → click **Drip** → paste the token\n\n**What data you'll get:** Email automation performance, subscriber segments, revenue attribution per email flow and e-commerce revenue tracking.`;
  }

  // ── Intercom ──
  if (t.includes("intercom")) {
    return `💬 **How to connect Intercom:**\n\n1. Go to **app.intercom.com** → Settings → Integrations → **Developer Hub**\n2. Click **Your Apps** → **New App** (or select an existing app)\n3. Go to the **Authentication** tab → copy the **Access Token**\n4. In this dashboard go to **Data Sources** → click **Intercom** → paste the token\n\n**What data you'll get:** Conversation volume, response times, leads captured, deal pipeline and contact engagement scores.`;
  }

  // ── Pipedrive ──
  if (t.includes("pipedrive")) {
    return `📊 **How to connect Pipedrive:**\n\n1. Log in to **Pipedrive** → click your avatar (top-right) → **Personal preferences**\n2. Go to the **API** tab\n3. Copy your **personal API token**\n4. In this dashboard go to **Data Sources** → click **Pipedrive** → paste the token\n\n**What data you'll get:** Active deals, pipeline stage distribution, deal close rates, revenue forecast and activity metrics (calls, emails, meetings).`;
  }

  // ── Zoho CRM ──
  if (t.includes("zoho")) {
    return `🔴 **How to connect Zoho CRM:**\n\n1. Go to **api-console.zoho.com** → click **Self Client → Create**\n2. Enter scope: \`ZohoCRM.modules.READ\` and click Create\n3. Copy the **authorization code** and exchange it for an Access Token via Zoho's OAuth flow\n4. In this dashboard go to **Data Sources** → click **Zoho CRM** → paste your Access Token\n\n**Note:** Access tokens expire after 1 hour — use the Refresh Token to get new ones.\n\n**What data you'll get:** Leads, contacts, accounts, deals by stage, revenue forecast and pipeline activity.`;
  }

  // ── Pinterest ──
  if (t.includes("pinterest")) {
    return `📌 **Pinterest Ads — Coming Soon**\n\nPinterest Ads integration is on our roadmap and will be available in an upcoming release.\n\nIn the meantime you can connect **18 other platforms** including Google Ads, Meta, TikTok, LinkedIn, and Snapchat from the **Data Sources** page.\n\nWant to be notified when Pinterest launches? Reach out via the feedback button in Settings.`;
  }

  // ── Troubleshooting: not connecting / errors / not working ──
  if (t.includes("not work") || t.includes("not connect") || t.includes("error") ||
      t.includes("failed") || t.includes("broken") || t.includes("not load") ||
      t.includes("not show") || t.includes("empty") || t.includes("no data") ||
      t.includes("can't connect") || t.includes("cannot connect") || t.includes("won't connect") ||
      t.includes("issue with") || t.includes("problem with") || t.includes("trouble")) {
    return `🔧 **Connector troubleshooting:**\n\n**OAuth connectors (Meta, Google, TikTok, LinkedIn etc.)**\n• Token expired? → Click **Connect** again to re-authorise\n• Wrong account? → Log out of that platform in your browser first, then reconnect\n• Permission denied? → You need Admin or Advertiser access on the ad account\n\n**API Key connectors (Klaviyo, Mailchimp, HubSpot etc.)**\n• Double-check you copied the full key including any suffix (e.g. \`-us1\` for Mailchimp)\n• Make sure the key has *Read* permissions — write-only keys won't work\n• Keys are case-sensitive — copy, don't retype\n\n**GA4 / Google Analytics**\n• Make sure the Property ID is numbers only — no letters or dashes\n• The purple banner at the top means no property is connected yet\n\n**Still stuck?** Tell me which specific connector is giving you trouble and I'll give you exact steps.`;
  }

  // ── Data / dashboard showing wrong / sample data ──
  if (t.includes("sample data") || t.includes("demo data") || t.includes("fake data") ||
      t.includes("not my data") || t.includes("wrong data") || t.includes("showing example") ||
      t.includes("purple banner") || t.includes("banner")) {
    return `🧪 **Why you're seeing sample data:**\n\nThe purple banner means your GA4 property isn't connected yet. The dashboard always shows realistic sample data as a placeholder until you connect.\n\n**To see your real data:**\n1. Go to **Data Sources** (sidebar)\n2. Click **Google Analytics 4**\n3. Enter your **GA4 Property ID** (found in GA4 Admin → Property Settings)\n4. Click **Connect GA4**\n\nThe banner will disappear instantly and your real analytics will load.\n\n💡 Connecting GA4 doesn't cost anything and takes under 2 minutes.`;
  }

  // ── API key questions ──
  if (t.includes("api key") || t.includes("access token") || t.includes("secret key") ||
      t.includes("bearer token") || t.includes("credentials") || t.includes("where do i find")) {
    return `🔑 **Where to find API credentials by platform:**\n\n**Analytics**\n• **GA4** → Google Analytics Admin → Property Settings → Property ID\n• **Mixpanel** → Organisation Settings → Service Accounts\n• **Amplitude** → Settings → Project → API Key\n• **Segment** → Settings → Access Management → Tokens\n• **Hotjar** → Settings → Sites & Organisations → Site ID\n• **Search Console** → Paste your verified site URL\n• **YouTube** → YouTube Studio → Channel ID\n\n**Ads**\n• **Google Ads** → Tools → API Center → Developer Token\n• **Reddit Ads** → App Settings → Access Token\n• **Meta/LinkedIn/TikTok/Snapchat/Bing/Shopify** → OAuth (no key needed)\n\n**Email**\n• **Klaviyo** → Account → Settings → API Keys\n• **Mailchimp** → Profile → Extras → API Keys\n• **Brevo** → SMTP & API → API Keys (starts with xkeysib-)\n• **Drip** → User Settings → API Token\n• **ActiveCampaign** → Settings → Developer\n\n**Ecommerce**\n• **Stripe** → Developers → API Keys (sk_live_...)\n• **BigCommerce** → Advanced Settings → API Accounts\n• **WooCommerce** → Settings → Advanced → REST API\n\n**CRM**\n• **HubSpot** → Settings → Integrations → Private Apps\n• **Intercom** → Developer Hub → Access Token\n• **Pipedrive** → Personal Preferences → API Tab\n• **Zoho CRM** → api-console.zoho.com → Access Token\n\nAsk me about any specific platform for a full step-by-step guide.`;
  }

  // ── OAuth questions ──
  if (t.includes("oauth") || t.includes("authorise") || t.includes("authorize") ||
      t.includes("sign in with") || t.includes("login with") || t.includes("redirect")) {
    return `🔐 **OAuth connectors (one-click sign-in):**\n\nThese platforms use secure OAuth — no API keys needed, just click Connect and sign in:\n\n• **Meta Ads** (Facebook + Instagram)\n• **Google Ads**\n• **LinkedIn Ads**\n• **TikTok Ads**\n• **Snapchat Ads**\n• **Microsoft / Bing Ads**\n• **Shopify**\n• **Salesforce**\n\n**How it works:**\n1. Click Connect on the Data Sources page\n2. You're redirected to the platform's login page\n3. You approve access\n4. You're sent back to the dashboard automatically\n\nYour credentials are never stored — only a secure access token is saved.`;
  }

  // ── Dashboard features / pages ──
  if (t.includes("report") || t.includes("generate report") || t.includes("ai report")) {
    return `📄 **Reports page:**\n\nGo to **Reports** in the sidebar to generate AI-written performance reports.\n\n• Choose a time period (7 days to 12 months)\n• Click **Generate Report** — takes ~1 second\n• Get a full report with: Executive Summary, Channel Performance, Wins & Issues, Recommendations\n• **Copy as text** or **Export as PDF** with one click\n\nThe AI report uses your live campaign data — not generic templates.`;
  }

  if (t.includes("alert") || (t.includes("notification") && !t.includes("connect"))) {
    return `🚨 **Alerts page:**\n\nGo to **Alerts** in the sidebar to see AI-detected issues across your campaigns.\n\n• **Critical alerts** — things costing you money right now (e.g. campaigns with ROAS below break-even)\n• **Warnings** — trends that need monitoring\n• **Opportunities** — quick wins identified by the AI\n• Each alert has a **one-click Apply Fix** button\n• You can also set custom KPI threshold alerts (e.g. alert me when ROAS drops below 2×)`;
  }

  if (t.includes("forecast") || t.includes("prediction") || t.includes("predict")) {
    return `🔮 **Forecasts page:**\n\nGo to **Forecasts** in the sidebar to see AI-generated revenue and ROAS predictions.\n\n• 30/60/90-day forecasts based on current campaign trajectory\n• Scenario modelling (what if I increase budget by 20%?)\n• Seasonality adjustments built in\n\nForecasts use your connected campaign data — the more connectors you have active, the more accurate they are.`;
  }

  if (t.includes("goal") || t.includes("kpi") || t.includes("target")) {
    return `🎯 **Goals page:**\n\nGo to **Goals** in the sidebar to set and track KPI targets.\n\n• Set targets for ROAS, Revenue, Spend, Conversions, CTR\n• Progress bars show you how close you are to each goal\n• Goals are saved to your browser (localStorage) so they persist between sessions\n• The AI Alerts page monitors your goals and alerts you if you're falling behind`;
  }

  if (t.includes("budget planner") || t.includes("budget plan") || t.includes("allocat")) {
    return `💰 **Budget Planner page:**\n\nGo to **Budget** in the sidebar to plan and optimise your ad spend.\n\n• See current spend per platform and campaign\n• AI recommends budget reallocation based on ROAS\n• Model "what if" scenarios (what happens if I move £1,000 from Facebook to TikTok?)\n• Monthly and annual budget views`;
  }

  if (t.includes("attribution") || t.includes("last click") || t.includes("first click") || t.includes("credit")) {
    return `🔄 **Attribution page:**\n\nGo to **Attribution** in the sidebar to see how credit is assigned across your customer journey.\n\n• Switch between attribution models: Last Click, First Click, Linear, Time Decay, Data-Driven\n• See how each model changes your platform ROAS\n• Identify which touchpoints drive the most conversions\n• Multi-touch journeys visualised in the funnel view`;
  }

  // ── General help ──
  if (t.includes("help") || t.includes("what can you") || t.includes("what do you") ||
      t.includes("capabilities") || t.includes("features") || t.includes("what are you")) {
    return `👋 **I can help you with:**\n\n**🔌 Connecting platforms**\n→ Ask: "How do I connect Klaviyo?" or "TikTok not working"\n\n**📊 Campaign performance**\n→ Ask: "What's my ROAS?", "Which campaigns to pause?", "Instagram vs Facebook"\n\n**💡 AI recommendations**\n→ Ask: "What should I do next?", "Where should I increase budget?"\n\n**🚨 Issues & alerts**\n→ Ask: "What issues do I have?", "What's critical right now?"\n\n**📄 Dashboard features**\n→ Ask about: Reports, Alerts, Budget, Forecasts, Goals, Attribution, Funnel\n\nJust type naturally — I understand questions like "my shopify won't connect" or "how do I find my mailchimp api key".`;
  }

  return null; // No connector/help match — fall through to campaign engine
}

// ── Campaign-aware Q&A engine ─────────────────────────────────────────────────

function getCampaignAnswer(q: string): string {
  const t = q.toLowerCase();

  // Try connector/setup/help answers first
  const connectorAnswer = getConnectorAnswer(t);
  if (connectorAnswer) return connectorAnswer;

  const summaries = buildPlatformSummaries();
  const health = computeHealthScore();
  const issues = detectIssues();
  const totalSpend   = CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const blendedRoas  = totalRevenue / totalSpend;

  // Health / overview
  if (t.includes("health") || t.includes("overview") || t.includes("summary") || t.includes("how am i doing")) {
    return `📊 **Portfolio Health: ${health.score}/100 (${health.label})**\n\n${health.summary}\n\n**Trend:** ${health.trend === "improving" ? "📈 Improving" : health.trend === "declining" ? "📉 Declining" : "→ Stable"}\n\nTop action: ${issues.filter(i => i.severity === "critical")[0]?.fixTitle ?? "Monitor your top performers daily."}`;
  }

  // Instagram
  if (t.includes("instagram") || t.includes("ig")) {
    const igCamps = CAMPAIGNS.filter(c => c.placement.includes("Instagram"));
    const igRoas  = igCamps.reduce((s,c)=>s+c.revenue,0) / (igCamps.reduce((s,c)=>s+c.spend,0) || 1);
    return `📸 **Instagram performance:**\n\n${igCamps.map(c => `• **${c.name.split(" — ")[1] ?? c.name}**: ${c.roas.toFixed(2)}× ROAS | £${c.spend.toLocaleString()}/mo spend | ${c.health === "scale" ? "🟢 Scale" : c.health === "monitor" ? "🟡 Monitor" : "🔴 Pause"}`).join("\n")}\n\n**Blended Instagram ROAS: ${igRoas.toFixed(2)}×**\n\nInstagram Feed is your fastest-growing campaign — up 18% in 4 weeks. IG Reels (3.3× and climbing) is a strong growth bet.`;
  }

  // Facebook
  if (t.includes("facebook") || t.includes("fb")) {
    const fbCamps = CAMPAIGNS.filter(c => c.placement.includes("Facebook"));
    const fbRoas  = fbCamps.reduce((s,c)=>s+c.revenue,0) / (fbCamps.reduce((s,c)=>s+c.spend,0) || 1);
    return `📘 **Facebook performance:**\n\n${fbCamps.map(c => `• **${c.name.split(" — ")[1] ?? c.name}**: ${c.roas.toFixed(2)}× ROAS | £${c.spend.toLocaleString()}/mo | ${c.health === "scale" ? "🟢 Scale" : c.health === "monitor" ? "🟡 Monitor" : "🔴 Pause"}`).join("\n")}\n\n**Blended Facebook ROAS: ${fbRoas.toFixed(2)}×**\n\n⚠️ Facebook Feed audiences are saturating — declining 4 weeks in a row. Only keep the Retargeting campaign (5.4× ROAS — warm audiences still convert).`;
  }

  // Meta / Instagram vs Facebook
  if (t.includes("meta") || (t.includes("instagram") && t.includes("facebook"))) {
    const igCamps = CAMPAIGNS.filter(c => c.placement.includes("Instagram"));
    const fbCamps = CAMPAIGNS.filter(c => c.placement.includes("Facebook Feed"));
    const igRoas  = igCamps.reduce((s,c)=>s+c.revenue,0) / (igCamps.reduce((s,c)=>s+c.spend,0) || 1);
    const fbRoas  = fbCamps.reduce((s,c)=>s+c.revenue,0) / (fbCamps.reduce((s,c)=>s+c.spend,0) || 1);
    const fbSpend = fbCamps.reduce((s,c)=>s+c.spend,0);
    return `⚖️ **Instagram vs Facebook:**\n\n• Instagram: **${igRoas.toFixed(2)}× ROAS** 📈 Growing\n• Facebook Feed: **${fbRoas.toFixed(2)}× ROAS** 📉 Declining\n\nInstagram is ${((igRoas/fbRoas-1)*100).toFixed(0)}% more effective at the same budget.\n\n**Recommendation:** Move £${fbSpend.toLocaleString()}/mo from Facebook Feed → Instagram Feed + Stories. Estimated revenue increase: **+£${Math.round(fbSpend*(igRoas-fbRoas)).toLocaleString()}/month**.`;
  }

  // ROAS
  if (t.includes("roas") || t.includes("return on ad")) {
    const topByCamp = [...CAMPAIGNS].sort((a,b)=>b.roas-a.roas).slice(0,3);
    return `💰 **ROAS Breakdown:**\n\n**Blended ROAS: ${blendedRoas.toFixed(2)}×**\n\n**Top 3 campaigns:**\n${topByCamp.map((c,i)=>`${i+1}. ${c.name}: **${c.roas.toFixed(2)}×** (£${c.spend.toLocaleString()} → £${c.revenue.toLocaleString()})`).join("\n")}\n\n**Platform ROAS:**\n${summaries.map(s=>`• ${s.label}: ${s.roas.toFixed(2)}×`).join("\n")}`;
  }

  // Google
  if (t.includes("google")) {
    const gCamps = CAMPAIGNS.filter(c => c.platform === "google_ads");
    const gRoas  = gCamps.reduce((s,c)=>s+c.revenue,0) / gCamps.reduce((s,c)=>s+c.spend,0);
    return `🔵 **Google Ads (${gCamps.length} campaigns, ${gRoas.toFixed(2)}× blended ROAS):**\n\n${gCamps.map(c=>`• **${c.name.split(" — ")[1]??c.name}**: ${c.roas.toFixed(2)}× ROAS — ${c.health==="pause"?"🔴 PAUSE":c.health==="scale"?"🟢 Scale":"🟡 Monitor"}`).join("\n")}\n\n💡 Google Shopping (6.2×) is your single best campaign — not budget-saturated. Increase by £800/month now.`;
  }

  // TikTok
  if (t.includes("tiktok") || t.includes("tik tok")) {
    const ttCamps = CAMPAIGNS.filter(c => c.platform === "tiktok");
    return `🎵 **TikTok performance:**\n\n${ttCamps.map(c=>`• **${c.name.split(" — ")[1]??c.name}**: ${c.roas.toFixed(2)}× ROAS | ${(c.ctr*100).toFixed(1)}% CTR | ${c.health==="scale"?"🟢 Scale":"🟡 Monitor"}`).join("\n")}\n\nTikTok In-Feed has your **highest CTR (6.8%)** across all platforms. Strong growth trajectory — up from 2.8× to 3.6× in 4 weeks. Recommend testing a £500 budget increase.`;
  }

  // Budget / spend
  if (t.includes("budget") || t.includes("spend") || t.includes("waste") || t.includes("wasting")) {
    const wasteCamps = CAMPAIGNS.filter(c => c.health === "pause");
    const wastedSpend = wasteCamps.reduce((s,c)=>s+c.spend,0);
    return `💸 **Budget Analysis:**\n\n**Total monthly spend: £${totalSpend.toLocaleString()}**\nRevenue: £${totalRevenue.toLocaleString()} → ${blendedRoas.toFixed(2)}× blended ROAS\n\n⚠️ **Currently wasted: £${wastedSpend.toLocaleString()}/month** across ${wasteCamps.length} underperforming campaigns:\n${wasteCamps.map(c=>`• ${c.name}: ${c.roas.toFixed(2)}× ROAS — pause and reallocate`).join("\n")}\n\nReallocating this to top performers could add **£${Math.round(wastedSpend*3).toLocaleString()}/month** in revenue.`;
  }

  // Issues / problems
  if (t.includes("issue") || t.includes("problem") || t.includes("alert") || t.includes("critical")) {
    const critical = issues.filter(i => i.severity === "critical");
    const warnings = issues.filter(i => i.severity === "warning");
    return `🚨 **${issues.length} AI-detected issues:**\n\n**Critical (${critical.length}):**\n${critical.map(i=>`• ${i.title}: ${i.fixTitle}`).join("\n")}\n\n**Warnings (${warnings.length}):**\n${warnings.map(i=>`• ${i.title}`).join("\n")}\n\nGo to the **Alerts page** to see detailed fix recommendations and apply them with one click.`;
  }

  // What to do / recommend / next steps
  if (t.includes("what should") || t.includes("recommend") || t.includes("next step") || t.includes("action") || t.includes("priority")) {
    return `🎯 **Top 3 priorities right now:**\n\n1. **Pause 4 underperforming campaigns** (save £4,380/month wasted budget)\n   → Facebook Feed, Facebook Carousel, Snapchat Stories, Google Display\n\n2. **Scale Instagram Feed + Google Shopping**\n   → Both have room to grow without saturating. Add £1,400 to Instagram, £800 to Shopping.\n\n3. **Refresh Facebook Reels creatives**\n   → Declining trend, but salvageable with new UGC video creatives.\n\nEstimated impact: **+£14,000–18,000/month** at current ROAS rates.`;
  }

  // Scale / best campaigns
  if (t.includes("scale") || t.includes("best campaign") || t.includes("top campaign")) {
    const scaleCamps = CAMPAIGNS.filter(c => c.health === "scale").sort((a,b)=>b.roas-a.roas);
    return `🚀 **Campaigns to scale (${scaleCamps.length} identified):**\n\n${scaleCamps.map((c,i)=>`${i+1}. **${c.name}** — ${c.roas.toFixed(2)}× ROAS\n   £${c.spend.toLocaleString()}/mo → recommend +${Math.round(c.spend*0.25).toLocaleString()}/mo increase`).join("\n\n")}\n\nStart with Google Shopping (6.2×) and Instagram Feed (5.2×) — both have the best ROAS and headroom.`;
  }

  // Pause / bad campaigns
  if (t.includes("pause") || t.includes("worst") || t.includes("bad campaign") || t.includes("stop")) {
    const pauseCamps = CAMPAIGNS.filter(c => c.health === "pause").sort((a,b)=>a.roas-b.roas);
    return `🔴 **Campaigns to pause immediately (${pauseCamps.length}):**\n\n${pauseCamps.map(c=>`• **${c.name}**: ${c.roas.toFixed(2)}× ROAS — wasting £${c.spend.toLocaleString()}/month\n  → Fix: ${c.aiNote}`).join("\n\n")}\n\nPausing all ${pauseCamps.length} would free **£${pauseCamps.reduce((s,c)=>s+c.spend,0).toLocaleString()}/month** to reinvest in 5× ROAS campaigns.`;
  }

  // Default — general summary
  return `📊 **Nexoryx One Summary:**\n\n• **${CAMPAIGNS.length} campaigns** across 6 platforms\n• **Blended ROAS: ${blendedRoas.toFixed(2)}×** | £${totalSpend.toLocaleString()}/mo spend\n• **${CAMPAIGNS.filter(c=>c.health==="scale").length} campaigns** to scale | **${CAMPAIGNS.filter(c=>c.health==="pause").length}** to pause\n• **Portfolio health: ${health.score}/100** (${health.label})\n\nTop insight: Instagram is **${((CAMPAIGNS.filter(c=>c.placement.includes("Instagram")).reduce((s,c)=>s+c.revenue,0)/CAMPAIGNS.filter(c=>c.placement.includes("Instagram")).reduce((s,c)=>s+c.spend,0)) / (CAMPAIGNS.filter(c=>c.placement.includes("Facebook Feed")).reduce((s,c)=>s+c.revenue,0)/CAMPAIGNS.filter(c=>c.placement.includes("Facebook Feed")).reduce((s,c)=>s+c.spend,0))).toFixed(1)}× more effective than Facebook Feed** at the same budget.\n\nTry: *"How to connect Klaviyo?"*, *"TikTok not working"*, *"Which campaigns should I pause?"*`;
}

// ── Simple markdown renderer ──────────────────────────────────────────────────

function MD({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            {i < arr.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIChat() {
  const pathname = usePathname();
  const pageCtx  = pathToContext(pathname ?? "/");
  const insights = getPageInsights(pageCtx);

  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState<"chat" | "insights">("chat");
  const [msgs, setMsgs]   = useState<Message[]>([{
    id: "init",
    role: "assistant",
    content: "👋 I'm your **Captain AI**. I can help you:\n\n• **Connect any platform** — GA4, Meta, TikTok, Shopify, Klaviyo and more\n• **Fix connector issues** — troubleshoot errors step by step\n• **Analyse campaigns** — ROAS, budgets, what to pause or scale\n• **Navigate the dashboard** — Reports, Alerts, Forecasts, Goals\n\nJust ask naturally — like *'how do I connect Klaviyo?'* or *'my Meta ads won\\'t connect'*.",
  }]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setInput("");
    setTyping(true);
    const delay = 500 + Math.random() * 400;
    setTimeout(() => {
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: getCampaignAnswer(trimmed) }]);
      setTyping(false);
    }, delay);
  }, [typing]);

  const reset = () => {
    setMsgs([{ id: "init", role: "assistant", content: "👋 I'm your **Captain AI**. Ask me anything — connecting platforms, fixing issues, campaign performance, or how to use the dashboard." }]);
    setTyping(false);
  };

  const QUICK_PROMPTS = [
    "How to connect GA4?",
    "Which connectors are available?",
    "Which campaigns to pause?",
    "What's my blended ROAS?",
  ];

  const showSuggestions = msgs.length <= 1;
  const criticalCount = detectIssues().filter(i => i.severity === "critical" && i.status !== "resolved").length;

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-[72px] right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
          style={{ maxHeight: "min(78vh, 620px)" }}>

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Captain AI</p>
                <p className="text-[10px] text-white/60">Connectors · Campaigns · Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white" title="Reset chat">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex border-b">
            {([
              { id: "chat" as const,     label: "Chat" },
              { id: "insights" as const, label: `Page Insights ${insights.length > 0 ? `(${insights.length})` : ""}` },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors",
                  tab === t.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Insights tab */}
          {tab === "insights" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                AI insights for this page
              </p>
              {insights.length === 0 ? (
                <p className="text-xs text-muted-foreground">No specific insights for this page yet.</p>
              ) : insights.map((insight, i) => (
                <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2.5 text-xs text-foreground leading-relaxed">
                  {insight}
                </div>
              ))}

              {criticalCount > 0 && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-3 py-2.5">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                    🚨 {criticalCount} critical issue{criticalCount > 1 ? "s" : ""} detected
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Visit the Alerts page for AI-recommended fixes with one-click actions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chat tab */}
          {tab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.map(m => (
                  <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "assistant" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}>
                      <MD text={m.content} />
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                            style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              {showSuggestions && (
                <div className="shrink-0 flex flex-wrap gap-1.5 px-4 pb-3">
                  {QUICK_PROMPTS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="rounded-full border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="shrink-0 border-t p-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send(input)}
                    placeholder="Ask about connectors, campaigns, ROAS…"
                    className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || typing}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-200",
          open
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:shadow-xl hover:scale-105 active:scale-95"
        )}
      >
        {open
          ? <ChevronDown className="h-4 w-4" />
          : <>
              <Sparkles className="h-4 w-4" />
              Ask AI
              {criticalCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {criticalCount}
                </span>
              )}
            </>
        }
      </button>
    </>
  );
}
