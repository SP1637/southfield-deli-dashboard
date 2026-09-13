// Canonical demo data — all pages must use these numbers so they reconcile.
// Fictional company: "Meridian Goods" — UK DTC ecommerce, sells lifestyle products.
// Period: last 30 days vs previous 30 days.

export const DEMO_COMPANY = "Meridian Goods";
export const DEMO_PERIOD  = "Last 30 days";

// ── Top-line KPIs ─────────────────────────────────────────────────────────────
export const DEMO_REVENUE      = 184200;   // £184,200
export const DEMO_SPEND        = 27800;    // £27,800 paid media
export const DEMO_PROFIT       = 72400;    // £72,400
export const DEMO_ROAS         = 4.82;     // blended
export const DEMO_MARGIN       = 39.3;     // %
export const DEMO_CAC          = 38;       // £38
export const DEMO_LTV          = 284;      // £284
export const DEMO_CONVERSIONS  = 3241;
export const DEMO_SESSIONS     = 142800;
export const DEMO_AOV          = 143.45;   // £143.45
export const DEMO_ORDERS       = 1284;
export const DEMO_HEALTH_SCORE = 84;       // /100

// ── Period-over-period deltas (%) ─────────────────────────────────────────────
export const DEMO_DELTA_REVENUE     = +14.2;
export const DEMO_DELTA_SPEND       = +6.1;
export const DEMO_DELTA_PROFIT      = +9.8;
export const DEMO_DELTA_ROAS        = +8.1;
export const DEMO_DELTA_MARGIN      = -1.2;
export const DEMO_DELTA_CAC         = -6.4;
export const DEMO_DELTA_LTV         = +4.1;
export const DEMO_DELTA_CONVERSIONS = +11.8;
export const DEMO_DELTA_SESSIONS    = +6.4;
export const DEMO_DELTA_AOV         = +2.1;
export const DEMO_DELTA_ORDERS      = +11.8;

// ── Channel breakdown (must sum to DEMO_REVENUE / DEMO_SPEND) ─────────────────
export const DEMO_CHANNELS = [
  { id: "meta",     name: "Meta Ads",     spend: 9800,  revenue: 60700, roas: 6.2,  clicks: 44100, conversions: 1241, cpa: 7.90,  trend: +21.0, color: "bg-indigo-500"  },
  { id: "organic",  name: "Organic SEO",  spend: 0,     revenue: 48200, roas: null, clicks: 41300, conversions: 1024, cpa: 0,     trend: +8.1,  color: "bg-emerald-500" },
  { id: "google",   name: "Google Ads",   spend: 12400, revenue: 35900, roas: 2.9,  clicks: 48200, conversions: 812,  cpa: 15.27, trend: -4.2,  color: "bg-blue-500"    },
  { id: "email",    name: "Email",        spend: 800,   revenue: 22100, roas: 27.6, clicks: 12800, conversions: 482,  cpa: 1.66,  trend: -3.2,  color: "bg-violet-500"  },
  { id: "tiktok",   name: "TikTok Ads",   spend: 3200,  revenue: 17300, roas: 5.4,  clicks: 12800, conversions: 384,  cpa: 8.33,  trend: +14.7, color: "bg-pink-500"    },
  { id: "linkedin", name: "LinkedIn Ads", spend: 1600,  revenue: 8200,  roas: 5.1,  clicks: 3200,  conversions: 98,   cpa: 16.33, trend: +5.8,  color: "bg-sky-500"     },
] as const;

// ── Top campaigns ─────────────────────────────────────────────────────────────
export const DEMO_CAMPAIGNS = [
  { name: "Meta Campaign A",        channel: "meta",     spend: 4800,  revenue: 29700, roas: 6.2,  conversions: 621,  status: "active"  },
  { name: "Meta Campaign B",        channel: "meta",     spend: 5000,  revenue: 31000, roas: 6.2,  conversions: 620,  status: "active"  },
  { name: "Email Campaigns",        channel: "email",    spend: 800,   revenue: 22100, roas: 27.6, conversions: 482,  status: "active"  },
  { name: "Google Campaign A",      channel: "google",   spend: 5400,  revenue: 19800, roas: 3.7,  conversions: 412,  status: "active"  },
  { name: "TikTok Campaign B",      channel: "tiktok",   spend: 3200,  revenue: 17300, roas: 5.4,  conversions: 384,  status: "active"  },
  { name: "Google Campaign B",      channel: "google",   spend: 7000,  revenue: 16100, roas: 2.3,  conversions: 400,  status: "warning" },
  { name: "LinkedIn Brand Awareness", channel: "linkedin", spend: 1600, revenue: 8200, roas: 5.1,  conversions: 98,   status: "active"  },
] as const;

// ── Decisions / opportunities ──────────────────────────────────────────────────
export const DEMO_TOTAL_OPPORTUNITY = 31100; // £31,100 identified
export const DEMO_OPT_OPPORTUNITY   = 24800; // £24,800 in Optimization Hub

// ── Audience ──────────────────────────────────────────────────────────────────
export const DEMO_TOTAL_USERS      = 142800;
export const DEMO_RETENTION_RATE   = 81;    // %
export const DEMO_MONTHLY_CHURN    = 4.2;   // %
export const DEMO_REACTIVATED      = 184;

// ── Formatters ────────────────────────────────────────────────────────────────
export function fmtGBP(n: number): string {
  if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `£${(n / 1000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
}

export function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function fmtDelta(d: number): string {
  return `${d > 0 ? "+" : ""}${d}%`;
}
