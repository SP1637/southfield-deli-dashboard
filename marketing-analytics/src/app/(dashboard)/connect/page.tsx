"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Circle, ArrowRight, Plug, AlertCircle,
  ExternalLink, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Connector definitions ────────────────────────────────────────────────────

type Category = "analytics" | "ads" | "ecommerce" | "email";
type ConnectorId =
  | "ga4" | "google_ads" | "meta_ads" | "shopify"
  | "tiktok_ads" | "linkedin_ads" | "klaviyo" | "pinterest_ads";

interface Connector {
  id: ConnectorId;
  name: string;
  description: string;
  category: Category;
  color: string;
  logo: React.ReactNode;
  /** true = real OAuth flow exists, false = coming soon / api-key modal */
  implemented: boolean;
  comingSoon?: boolean;
}

const CONNECTORS: Connector[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Page views, sessions, events, funnels & conversions",
    category: "analytics",
    color: "#E37400",
    implemented: true,
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
    color: "#4285F4",
    implemented: false,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#4285F4" />
        <circle cx="14" cy="26" r="4" fill="#FBBC05" />
        <circle cx="26" cy="26" r="4" fill="#34A853" />
        <circle cx="20" cy="16" r="4" fill="white" />
        <line x1="14" y1="26" x2="20" y2="16" stroke="white" strokeWidth="2" />
        <line x1="26" y1="26" x2="20" y2="16" stroke="white" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    description: "Facebook & Instagram campaigns, reach & conversions",
    category: "ads",
    color: "#0866FF",
    implemented: false,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#0866FF" />
        <path
          d="M20 8C13.373 8 8 13.373 8 20c0 5.99 4.388 10.954 10.125 11.854V23.75H15.25V20h2.875v-2.494c0-2.836 1.69-4.4 4.274-4.4 1.238 0 2.533.221 2.533.221v2.784h-1.428c-1.407 0-1.846.873-1.846 1.769V20h3.143l-.502 3.75H21.66v8.104C27.612 30.954 32 25.99 32 20c0-6.627-5.373-12-12-12z"
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
    color: "#96BF48",
    implemented: false,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#96BF48" />
        <path
          d="M26.5 13.5c0 0-.2-.1-.5-.1-.3 0-.6.2-.8.5L24 15c-.6-1.7-1.7-3-3.3-3-.1 0-.3 0-.4 0-.5-.6-1.1-.9-1.7-.9-4.1 0-6.1 5.1-6.7 7.7l-2.9.9c-.9.3-.9.3-1 1.2L7 28l12 2.3L26 28l-.5-14.5zM22.5 14.3l-1.5.5c.3-1.2.8-1.8 1.2-2.1.2.4.3 1 .3 1.6zM20.6 12c.1 0 .2 0 .3.1-.5.3-1.1 1.1-1.4 2.6l-3.3 1c.8-2.5 2.2-3.7 4.4-3.7zM18.5 29.5L12 28l1.5-8.5 6 1.5-1 8.5z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    description: "Video ads, impressions, clicks & conversions",
    category: "ads",
    color: "#010101",
    implemented: false,
    comingSoon: true,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#010101" />
        <path
          d="M28 16.5a6.5 6.5 0 01-6.5-6.5h-3.5v13.8c0 1.8-1.4 3.2-3.2 3.2s-3.2-1.4-3.2-3.2 1.4-3.2 3.2-3.2c.3 0 .6 0 .9.1V17c-.3 0-.6-.1-.9-.1a6.7 6.7 0 000 13.4 6.7 6.7 0 006.7-6.7V18a10 10 0 006.5 2.4v-3.5c-.7 0-1.3-.2-1.8-.4H28v-.05z"
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
    color: "#0A66C2",
    implemented: false,
    comingSoon: true,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#0A66C2" />
        <path
          d="M13 17h-3v10h3V17zm-1.5-4.5a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zM30 27h-3v-5c0-1.2-.4-2-1.5-2-1.6 0-2 1.1-2 2.1V27h-3V17h3v1.4c.4-.8 1.4-1.6 2.9-1.6C28.4 16.8 30 18.2 30 21.7V27z"
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
    color: "#F2622E",
    implemented: false,
    comingSoon: true,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#F2622E" />
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">K</text>
      </svg>
    ),
  },
  {
    id: "pinterest_ads",
    name: "Pinterest Ads",
    description: "Pin performance, saves, clicks & ROAS",
    category: "ads",
    color: "#E60023",
    implemented: false,
    comingSoon: true,
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
        <rect width="40" height="40" rx="8" fill="#E60023" />
        <path
          d="M20 8c-6.627 0-12 5.373-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C18.748 31.937 19.365 32 20 32c6.627 0 12-5.373 12-12S26.627 8 20 8z"
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

// ── Modal for non-implemented connectors ────────────────────────────────────

function ConnectModal({
  connector,
  onClose,
}: {
  connector: Connector;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          {connector.logo}
          <div>
            <h2 className="text-lg font-bold">{connector.name}</h2>
            <p className="text-sm text-muted-foreground">{connector.description}</p>
          </div>
        </div>

        {connector.comingSoon ? (
          submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold">You&apos;re on the list!</p>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll notify you when {connector.name} integration launches.
              </p>
              <Button className="mt-4 w-full" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-6">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  🚧 This integration is in development
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Join the waitlist and we&apos;ll notify you as soon as it&apos;s ready.
                </p>
              </div>
              <label className="block text-sm font-medium mb-2">Your email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                className="mt-4 w-full"
                onClick={() => email && setSubmitted(true)}
                disabled={!email}
              >
                Join Waitlist
              </Button>
            </div>
          )
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ll be redirected to authorize access. We only request read-only permissions.
            </p>
            <Button className="w-full gap-2" onClick={onClose}>
              <ExternalLink className="h-4 w-4" />
              Authorize {connector.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "connected_sources";

export default function ConnectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connectedIds, setConnectedIds] = useState<Set<ConnectorId>>(new Set());
  const [activeModal, setActiveModal] = useState<Connector | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");

  // Load persisted connections from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved: ConnectorId[] = raw ? JSON.parse(raw) : [];
      setConnectedIds(new Set(saved));
    } catch {
      setConnectedIds(new Set());
    }
  }, []);

  // GA4 is auto-connected when signed in
  useEffect(() => {
    if (session) {
      setConnectedIds((prev) => {
        if (prev.has("ga4")) return prev;
        const next = new Set(prev);
        next.add("ga4");
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        } catch {}
        return next;
      });
    }
  }, [session]);

  function toggleConnect(connector: Connector) {
    if (connector.id === "ga4") {
      if (!session) signIn("google", { callbackUrl: "/connect" });
      return;
    }
    setActiveModal(connector);
  }

  function markConnected(id: ConnectorId) {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const categories: (Category | "all")[] = ["all", "analytics", "ads", "ecommerce", "email"];
  const filtered = filter === "all" ? CONNECTORS : CONNECTORS.filter((c) => c.category === filter);
  const connectedCount = connectedIds.size;

  return (
    <>
      {/* ── Header ── */}
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
          <Button
            className="gap-2 shrink-0"
            onClick={() => router.push("/funnel")}
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Progress bar ── */}
      {connectedCount > 0 && (
        <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {connectedCount} source{connectedCount !== 1 ? "s" : ""} connected
            </p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min((connectedCount / CONNECTORS.length) * 100, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {connectedCount} / {CONNECTORS.length}
          </span>
        </div>
      )}

      {/* ── Category filters ── */}
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

      {/* ── Connector grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((connector) => {
          const isConnected = connectedIds.has(connector.id);
          const isGA4 = connector.id === "ga4";
          const needsAuth = isGA4 && !session && status !== "loading";

          return (
            <div
              key={connector.id}
              className={cn(
                "group relative rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md",
                isConnected
                  ? "border-green-500/40 bg-green-50/30 dark:bg-green-950/10"
                  : "hover:border-primary/40"
              )}
            >
              {/* Status badge */}
              <div className="absolute right-3 top-3">
                {isConnected ? (
                  <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20 text-[10px] font-semibold">
                    ✓ Connected
                  </Badge>
                ) : connector.comingSoon ? (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Soon
                  </Badge>
                ) : null}
              </div>

              {/* Logo */}
              <div className="mb-4">
                {connector.logo}
              </div>

              {/* Info */}
              <p className="font-semibold text-sm leading-tight">{connector.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {connector.description}
              </p>

              {/* Category tag */}
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                {CATEGORY_LABELS[connector.category]}
              </p>

              {/* Connect / Connected button */}
              <div className="mt-4">
                {isConnected ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Data syncing
                  </div>
                ) : (
                  <button
                    onClick={() => toggleConnect(connector)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      connector.comingSoon
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {connector.comingSoon ? "Join waitlist" : needsAuth ? "Sign in to connect" : "Connect"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
        <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Missing an integration?</p>
        <p className="text-xs text-muted-foreground mt-1">
          We&apos;re adding new connectors every month.{" "}
          <a href="mailto:sub17h4@gmail.com" className="underline underline-offset-2 hover:text-foreground">
            Request one →
          </a>
        </p>
      </div>

      {/* ── Modal ── */}
      {activeModal && (
        <ConnectModal
          connector={activeModal}
          onClose={() => {
            setActiveModal(null);
          }}
        />
      )}
    </>
  );
}
