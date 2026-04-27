"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2, ArrowRight, Plug, AlertCircle,
  ChevronRight, X, ExternalLink, Key, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────────────────────

type Category = "analytics" | "ads" | "ecommerce" | "email";

type ConnectorId =
  | "ga4" | "google_ads" | "meta_ads" | "shopify"
  | "tiktok_ads" | "linkedin_ads" | "klaviyo" | "pinterest_ads";

type ConnectMethod =
  | "google_oauth"      // signIn("google") via NextAuth
  | "oauth"             // /api/connect/[provider]
  | "domain_oauth"      // needs shop/domain input first, then /api/connect/[provider]
  | "api_key"           // show API key form
  | "coming_soon";

interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  category: Category;
  connectMethod: ConnectMethod;
  logo: React.ReactNode;
  docs?: string; // link to developer console
}

// ── Connectors ───────────────────────────────────────────────────────────────

const CONNECTORS: Connector[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Page views, sessions, events, funnels & conversions",
    category: "analytics",
    connectMethod: "google_oauth",
    docs: "https://console.cloud.google.com/apis/credentials",
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
    connectMethod: "oauth",
    docs: "https://console.cloud.google.com/apis/credentials",
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
    connectMethod: "oauth",
    docs: "https://developers.facebook.com/apps",
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
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#96BF48" />
        <path
          d="M27.5 13.7c0-.1-.1-.2-.2-.2l-1.2-.1c0 0-.8-.8-.9-.8-.1 0-.3.1-.3.1l-.5 1.4c-.9-.3-1.9-.4-2.4-.4C18.4 13.7 16 16 16 18.9c0 1.7.9 2.9 2.3 3.6l-.4 1.3c-.1.3.1.5.4.5l7.1 1.3c.3.1.5-.1.5-.4l1.8-10.9c0-.2-.1-.5-.2-.6zM22 17l-.7 4.2c-.3-.1-.7-.2-1-.2-1.4 0-2.3-.7-2.3-1.8 0-1.5 1.3-2.8 3-2.8.4 0 .8.1 1 .2v.4z"
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
    connectMethod: "oauth",
    docs: "https://www.linkedin.com/developers/apps",
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
    connectMethod: "oauth",
    docs: "https://ads.tiktok.com/marketing_api/homepage",
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
          d="M20 8C13.4 8 8 13.4 8 20c0 5.1 3.2 9.4 7.6 11.2-.1-1-.2-2.4 0-3.4.2-.9 1.4-6 1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3-.1.4-.3 1.4-.3 1.4-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 7.9-7.3 4.2 0 7.4 3 7.4 6.9 0 4.1-2.6 7.5-6.2 7.5-1.2 0-2.4-.6-2.8-1.4l-.7 2.9c-.3 1-.9 2.3-1.5 3.1.9.3 1.8.4 2.8.4 6.6 0 12-5.4 12-12S26.6 8 20 8z"
          fill="white"
        />
      </svg>
    ),
  },
];

const CATEGORY_LABELS: Record<Category, string> = {
  analytics: "Analytics",
  ads: "Advertising",
  ecommerce: "E-commerce",
  email: "Email Marketing",
};

const STORAGE_KEY = "connected_sources";

// ── Modal ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "setup_required"; connector: Connector }
  | { type: "domain_input"; connector: Connector }
  | { type: "api_key"; connector: Connector }
  | { type: "error"; provider: string; reason: string }
  | null;

function Modal({
  state,
  onClose,
  onConnected,
}: {
  state: ModalState;
  onClose: () => void;
  onConnected: (id: ConnectorId) => void;
}) {
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  if (!state) return null;

  // ── Credentials not configured ─────────────────────────────────────────
  if (state.type === "setup_required") {
    const { connector } = state;
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            App credentials not configured
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            To connect {connector.name}, add your OAuth App credentials to your
            Vercel environment variables, then redeploy.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3 mb-4 font-mono text-xs space-y-1 text-muted-foreground">
          {connector.id === "meta_ads" && (
            <>
              <p>META_APP_ID=your_app_id</p>
              <p>META_APP_SECRET=your_app_secret</p>
            </>
          )}
          {connector.id === "shopify" && (
            <>
              <p>SHOPIFY_API_KEY=your_api_key</p>
              <p>SHOPIFY_API_SECRET=your_api_secret</p>
            </>
          )}
          {connector.id === "linkedin_ads" && (
            <>
              <p>LINKEDIN_CLIENT_ID=your_client_id</p>
              <p>LINKEDIN_CLIENT_SECRET=your_client_secret</p>
            </>
          )}
          {connector.id === "tiktok_ads" && (
            <>
              <p>TIKTOK_APP_ID=your_app_id</p>
              <p>TIKTOK_APP_SECRET=your_app_secret</p>
            </>
          )}
        </div>
        {connector.docs && (
          <a
            href={connector.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline mb-4"
          >
            <ExternalLink className="h-4 w-4" />
            Open {connector.name} Developer Console
          </a>
        )}
        <Button className="w-full" variant="outline" onClick={onClose}>
          Close
        </Button>
      </Backdrop>
    );
  }

  // ── Shopify domain input ────────────────────────────────────────────────
  if (state.type === "domain_input") {
    const { connector } = state;
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />
        <p className="text-sm text-muted-foreground mb-4">
          Enter your Shopify store URL to begin authorization.
        </p>
        <label className="block text-sm font-medium mb-1">Store domain</label>
        <div className="flex items-center rounded-md border bg-background overflow-hidden mb-4">
          <span className="px-3 py-2 text-sm text-muted-foreground border-r bg-muted">https://</span>
          <input
            autoFocus
            value={domain}
            onChange={(e) => setDomain(e.target.value.replace(/[^a-z0-9-]/g, ""))}
            placeholder="your-store"
            className="flex-1 px-3 py-2 text-sm bg-background focus:outline-none"
          />
          <span className="px-3 py-2 text-sm text-muted-foreground border-l bg-muted">.myshopify.com</span>
        </div>
        <Button
          className="w-full gap-2"
          disabled={!domain}
          onClick={() => {
            window.location.href = `/api/connect/shopify?shop=${domain}`;
          }}
        >
          <Globe className="h-4 w-4" />
          Authorize Shopify
        </Button>
      </Backdrop>
    );
  }

  // ── Klaviyo API key ──────────────────────────────────────────────────────
  if (state.type === "api_key") {
    const { connector } = state;
    return (
      <Backdrop onClose={onClose}>
        <ModalHeader connector={connector} onClose={onClose} />
        <p className="text-sm text-muted-foreground mb-4">
          Paste your Klaviyo Private API Key. We&apos;ll use it to pull campaign
          and revenue data.
        </p>
        <label className="block text-sm font-medium mb-1">Private API Key</label>
        <input
          autoFocus
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxx"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4"
        />
        {connector.docs && (
          <a
            href={connector.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Where do I find my API key?
          </a>
        )}
        <Button
          className="w-full gap-2"
          disabled={!apiKey || saving}
          onClick={() => {
            setSaving(true);
            // Store in localStorage (real app: POST to /api/connect/klaviyo with the key)
            try {
              localStorage.setItem("klaviyo_api_key", apiKey);
            } catch {}
            onConnected("klaviyo");
            onClose();
          }}
        >
          <Key className="h-4 w-4" />
          {saving ? "Saving…" : "Save & Connect"}
        </Button>
      </Backdrop>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state.type === "error") {
    return (
      <Backdrop onClose={onClose}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-sm">Authorization failed</p>
            <p className="text-xs text-muted-foreground capitalize">{state.reason.replace(/_/g, " ")}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {state.reason === "no_credentials"
            ? `The ${state.provider.replace(/_/g, " ")} app credentials aren't configured yet. Check your environment variables.`
            : state.reason === "access_denied"
            ? "You cancelled the authorization. Click Connect again when you're ready."
            : "Something went wrong during authorization. Please try again."}
        </p>
        <Button className="w-full" variant="outline" onClick={onClose}>
          Close
        </Button>
      </Backdrop>
    );
  }

  return null;
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-8 shadow-2xl mx-4">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ connector, onClose }: { connector: Connector; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {connector.logo}
        <div>
          <p className="font-bold">{connector.name}</p>
          <p className="text-xs text-muted-foreground">{connector.description}</p>
        </div>
      </div>
      <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground ml-2 shrink-0">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connectedIds, setConnectedIds] = useState<Set<ConnectorId>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [toast, setToast] = useState<string | null>(null);

  // ── Load persisted state ─────────────────────────────────────────────────
  useEffect(() => {
    const fromStorage = (): ConnectorId[] => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
    };
    const fromCookies = (): ConnectorId[] => {
      return CONNECTORS
        .filter((c) => c.connectMethod !== "google_oauth")
        .filter((c) => document.cookie.includes(`connected_${c.id}=true`))
        .map((c) => c.id);
    };
    setConnectedIds(new Set([...fromStorage(), ...fromCookies()]));
  }, []);

  // ── GA4 auto-connected when signed in ────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    setConnectedIds((prev) => {
      if (prev.has("ga4")) return prev;
      const next = new Set(prev);
      next.add("ga4");
      persist(next);
      return next;
    });
  }, [session]);

  // ── Handle OAuth return (?connected=provider or ?error=reason) ───────────
  useEffect(() => {
    const connected = searchParams.get("connected") as ConnectorId | null;
    const error = searchParams.get("error");
    const provider = searchParams.get("provider") ?? "";

    if (connected) {
      setConnectedIds((prev) => {
        const next = new Set(prev);
        next.add(connected);
        persist(next);
        return next;
      });
      showToast(`${connected.replace(/_/g, " ")} connected!`);
      router.replace("/connect", { scroll: false });
    }

    if (error) {
      setModal({ type: "error", provider, reason: error });
      router.replace("/connect", { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(ids: Set<ConnectorId>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])); } catch {}
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // ── Connect action ───────────────────────────────────────────────────────
  const handleConnect = useCallback((connector: Connector) => {
    if (connectedIds.has(connector.id)) return;

    switch (connector.connectMethod) {
      case "google_oauth":
        signIn("google", { callbackUrl: "/connect" });
        break;

      case "oauth":
        // Redirect to our OAuth initiation route
        window.location.href = `/api/connect/${connector.id}`;
        break;

      case "domain_oauth":
        setModal({ type: "domain_input", connector });
        break;

      case "api_key":
        setModal({ type: "api_key", connector });
        break;

      case "coming_soon":
        // No-op; button is disabled
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
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const categories: (Category | "all")[] = ["all", "analytics", "ads", "ecommerce", "email"];
  const filtered = filter === "all" ? CONNECTORS : CONNECTORS.filter((c) => c.category === filter);
  const connectedCount = connectedIds.size;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            Connect your data sources
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose which platforms to pull data from. You can add more at any time.
          </p>
        </div>
        {connectedCount > 0 && (
          <Button className="gap-2 shrink-0" onClick={() => router.push("/funnel")}>
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress */}
      {connectedCount > 0 && (
        <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {connectedCount} source{connectedCount !== 1 ? "s" : ""} connected
            </p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${Math.min((connectedCount / CONNECTORS.length) * 100, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
            {connectedCount}/{CONNECTORS.length}
          </span>
        </div>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {cat === "all" ? "All sources" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Connector grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((connector) => {
          const isConnected = connectedIds.has(connector.id);
          const isComingSoon = connector.connectMethod === "coming_soon";

          return (
            <div
              key={connector.id}
              className={cn(
                "relative rounded-xl border bg-card p-5 transition-all duration-200",
                isConnected
                  ? "border-green-500/40 bg-green-50/30 dark:bg-green-950/10"
                  : isComingSoon
                  ? "opacity-60"
                  : "hover:shadow-md hover:border-primary/40 cursor-pointer"
              )}
            >
              {/* Status badge */}
              <div className="absolute right-3 top-3">
                {isConnected ? (
                  <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20 text-[10px] font-semibold">
                    ✓ Connected
                  </Badge>
                ) : isComingSoon ? (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Soon
                  </Badge>
                ) : null}
              </div>

              {/* Logo */}
              <div className="mb-4">{connector.logo}</div>

              {/* Info */}
              <p className="font-semibold text-sm leading-tight">{connector.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {connector.description}
              </p>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                {CATEGORY_LABELS[connector.category]}
              </p>

              {/* Action */}
              <div className="mt-4">
                {isConnected ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Data syncing
                  </div>
                ) : isComingSoon ? (
                  <span className="text-xs text-muted-foreground">Coming soon</span>
                ) : (
                  <button
                    onClick={() => handleConnect(connector)}
                    className="flex w-full items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    Connect
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
        <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Missing an integration?</p>
        <p className="text-xs text-muted-foreground mt-1">
          We add new connectors every month.{" "}
          <a
            href="mailto:sub17h4@gmail.com"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Request one →
          </a>
        </p>
      </div>

      {/* Modal */}
      <Modal
        state={modal}
        onClose={() => setModal(null)}
        onConnected={(id) => {
          markConnected(id);
          showToast(`${id.replace(/_/g, " ")} connected!`);
        }}
      />
    </>
  );
}
