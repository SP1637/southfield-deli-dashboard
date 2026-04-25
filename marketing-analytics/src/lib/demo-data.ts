/**
 * Demo data sourced directly from the Shopify Sales Funnel Looker Studio template PDF.
 * Used when no GA4 credentials are configured or user is in demo mode.
 */

import type { KpiMetrics, FunnelStep, TimeSeriesRow, ChannelRow, CountryRow, ItemRow, TrafficKpis, TrafficByChannelRow } from "@/types";

// ─── Page 1: Sales Funnel by Channel ─────────────────────────────────────────

export const DEMO_FUNNEL_KPIS: KpiMetrics = {
  totalUsers: 1_700_000,
  purchases: 851_500,
  totalPurchasers: 14_200,
  firstTimePurchasers: 2_700,
  grossPurchaseRevenue: 25_500_000,
  totalUsersDelta: -0.016,
  purchasesDelta: 0.038,
  totalPurchasersDelta: 0.020,
  firstTimePurchasersDelta: -0.007,
  grossPurchaseRevenueDelta: 0.037,
};

export const DEMO_FUNNEL_STEPS: FunnelStep[] = [
  { name: "Page Views",    eventName: "page_view",          value: 5_100_000, rateFromTop: 1.0000, rateFromPrev: null   },
  { name: "Adds to Cart",  eventName: "add_to_cart",        value: 1_800_000, rateFromTop: 0.3530, rateFromPrev: 0.7635 },
  { name: "Checkouts",     eventName: "begin_checkout",     value: 1_400_000, rateFromTop: 0.2771, rateFromPrev: 0.8381 },
  { name: "Payment Info",  eventName: "add_payment_info",   value: 1_200_000, rateFromTop: 0.2322, rateFromPrev: 0.7257 },
  { name: "Purchases",     eventName: "purchase",           value:   851_500, rateFromTop: 0.1685, rateFromPrev: 0.7096 },
];

function dailySeries(base: number, points: number, seed = 42): TimeSeriesRow[] {
  const rows: TimeSeriesRow[] = [];
  let rng = seed;
  const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };
  const start = new Date("2026-03-23");
  for (let i = 0; i < points; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wave = Math.sin((i / points) * Math.PI) * 0.3;
    rows.push({
      date: d.toISOString().slice(0, 10),
      value: Math.round(base * (0.7 + wave + rand() * 0.25)),
    });
  }
  return rows;
}

export const DEMO_FUNNEL_TIMESERIES: TimeSeriesRow[] = dailySeries(60_000, 30, 42);

export const DEMO_DONUT = [
  { name: "youtube / referral",         value: 168_700 },
  { name: "google / organic",           value:  84_000 },
  { name: "newsletter / email",         value:  86_300 },
  { name: "duckduckgo / organic",       value:  82_900 },
  { name: "(direct) / (none)",          value:  85_900 },
  { name: "bing / organic",             value:  84_900 },
  { name: "chat.openai.com / referral", value:  87_600 },
  { name: "accounts.google.com / ref.", value:  85_800 },
  { name: "onboarding / email",         value:  85_400 },
];

export const DEMO_CHANNEL_ROWS: ChannelRow[] = [
  { sourceMedium: "youtube / referral",         totalUsers: 343_400, newUsers: 168_700, pageViews: 1_000_000, addsToCart: 372_700, checkouts: 280_400, paymentInfoAdds: 237_900, purchases: 168_700, grossPurchaseRevenue: 5_000_000 },
  { sourceMedium: "google / organic",           totalUsers: 172_200, newUsers:  84_800, pageViews:   511_800, addsToCart: 186_200, checkouts: 142_600, paymentInfoAdds: 115_700, purchases:  84_000, grossPurchaseRevenue: 2_500_000 },
  { sourceMedium: "newsletter / email",         totalUsers: 172_100, newUsers:  84_800, pageViews:   515_900, addsToCart: 180_100, checkouts: 135_600, paymentInfoAdds: 116_500, purchases:  86_300, grossPurchaseRevenue: 2_600_000 },
  { sourceMedium: "duckduckgo / organic",       totalUsers: 172_000, newUsers:  84_600, pageViews:   502_200, addsToCart: 186_200, checkouts: 142_400, paymentInfoAdds: 115_300, purchases:  82_900, grossPurchaseRevenue: 2_400_000 },
  { sourceMedium: "(direct) / (none)",          totalUsers: 171_900, newUsers:  84_600, pageViews:   515_800, addsToCart: 180_700, checkouts: 142_800, paymentInfoAdds: 116_500, purchases:  85_900, grossPurchaseRevenue: 2_600_000 },
  { sourceMedium: "bing / organic",             totalUsers: 171_900, newUsers:  84_500, pageViews:   494_100, addsToCart: 185_300, checkouts: 141_700, paymentInfoAdds: 117_600, purchases:  84_900, grossPurchaseRevenue: 2_600_000 },
  { sourceMedium: "chat.openai.com / referral", totalUsers: 171_800, newUsers:  84_300, pageViews:   491_200, addsToCart: 176_100, checkouts: 137_700, paymentInfoAdds: 121_200, purchases:  87_600, grossPurchaseRevenue: 2_600_000 },
  { sourceMedium: "accounts.google.com / ref.", totalUsers: 171_700, newUsers:  84_300, pageViews:   502_700, addsToCart: 181_000, checkouts: 135_900, paymentInfoAdds: 114_700, purchases:  85_800, grossPurchaseRevenue: 2_600_000 },
  { sourceMedium: "onboarding / email",         totalUsers: 170_000, newUsers:  83_900, pageViews:   498_000, addsToCart: 179_500, checkouts: 140_000, paymentInfoAdds: 112_000, purchases:  84_500, grossPurchaseRevenue: 2_500_000 },
];

// ─── Page 2: Sales Funnel by Country ─────────────────────────────────────────

export const DEMO_COUNTRY_KPIS: KpiMetrics = {
  totalUsers: 420_100,
  purchases: 212_600,
  totalPurchasers: 3_400,
  firstTimePurchasers: 683,
  grossPurchaseRevenue: 6_400_000,
  totalUsersDelta: 0.009,
  purchasesDelta: 0.031,
  totalPurchasersDelta: 0.008,
  firstTimePurchasersDelta: 0.007,
  grossPurchaseRevenueDelta: 0.038,
};

export const DEMO_COUNTRY_FUNNEL_STEPS: FunnelStep[] = [
  { name: "Page Views",   eventName: "page_view",        value: 1_200_000, rateFromTop: 1.0000, rateFromPrev: null   },
  { name: "Adds to Cart", eventName: "add_to_cart",      value:   450_900, rateFromTop: 0.3632, rateFromPrev: 0.7631 },
  { name: "Checkouts",    eventName: "begin_checkout",   value:   344_100, rateFromTop: 0.2771, rateFromPrev: 0.8385 },
  { name: "Payment Info", eventName: "add_payment_info", value:   288_500, rateFromTop: 0.2324, rateFromPrev: 0.7369 },
  { name: "Purchases",    eventName: "purchase",         value:   212_600, rateFromTop: 0.1712, rateFromPrev: 0.7370 },
];

export const DEMO_COUNTRY_TIMESERIES: TimeSeriesRow[] = dailySeries(180_000, 7, 99);

export const DEMO_COUNTRY_ROWS: CountryRow[] = [
  { country: "Germany",       totalUsers: 84_200, newUsers: 41_300, pageViews: 249_500, addsToCart: 94_000, checkouts: 69_800, paymentInfoAdds: 56_600, purchases: 42_900, grossPurchaseRevenue: 1_300_000 },
  { country: "Australia",     totalUsers: 84_100, newUsers: 41_100, pageViews: 248_300, addsToCart: 91_600, checkouts: 67_800, paymentInfoAdds: 58_100, purchases: 43_300, grossPurchaseRevenue: 1_300_000 },
  { country: "United States", totalUsers: 84_000, newUsers: 41_100, pageViews: 248_700, addsToCart: 87_700, checkouts: 70_800, paymentInfoAdds: 58_000, purchases: 42_500, grossPurchaseRevenue: 1_300_000 },
  { country: "Brazil",        totalUsers: 84_000, newUsers: 41_100, pageViews: 244_600, addsToCart: 91_300, checkouts: 64_900, paymentInfoAdds: 58_400, purchases: 42_400, grossPurchaseRevenue: 1_300_000 },
  { country: "Singapore",     totalUsers: 83_800, newUsers: 40_900, pageViews: 250_500, addsToCart: 86_300, checkouts: 70_800, paymentInfoAdds: 57_400, purchases: 41_600, grossPurchaseRevenue: 1_300_000 },
];

// ─── Page 3: Sales Funnel by Item ────────────────────────────────────────────

export const DEMO_ITEM_FUNNEL = {
  itemsViewed:      17_800,
  itemsAddedToCart:  1_700,
  itemsCheckedOut:   1_000,
  itemsPurchased:      919,
  grossItemRevenue:  8_800,
  viewsToCart:      0.1961,
  viewsToCheckout:  0.1165,
  viewsToPurchase:  0.1043,
  cartToCheckout:   0.5938,
  checkoutToPurchase: 0.8957,
};

export const DEMO_ITEM_TIMESERIES: TimeSeriesRow[] = dailySeries(1_600, 7, 77);

export const DEMO_ITEM_ROWS: ItemRow[] = [
  { itemName: "SigmaBlendElite", itemsViewed: 637, itemsAddedToCart: 127, itemsCheckedOut:  75, itemsPurchased:  69, grossItemRevenue: 1_400 },
  { itemName: "MaxPulseEdge",    itemsViewed: 621, itemsAddedToCart: 133, itemsCheckedOut:  80, itemsPurchased:  71, grossItemRevenue: 1_400 },
  { itemName: "PrimeShiftEdge",  itemsViewed: 607, itemsAddedToCart: 119, itemsCheckedOut:  69, itemsPurchased:  63, grossItemRevenue: 1_400 },
  { itemName: "UltraMatrixX",    itemsViewed: 607, itemsAddedToCart: 133, itemsCheckedOut:  78, itemsPurchased:  70, grossItemRevenue: 1_600 },
  { itemName: "ProCraftEdge",    itemsViewed: 598, itemsAddedToCart: 129, itemsCheckedOut:  78, itemsPurchased:  70, grossItemRevenue: 1_500 },
  { itemName: "MegaFormGT",      itemsViewed: 591, itemsAddedToCart: 113, itemsCheckedOut:  66, itemsPurchased:  58, grossItemRevenue:   995 },
  { itemName: "AlphaCraftVR",    itemsViewed: 585, itemsAddedToCart: 102, itemsCheckedOut:  57, itemsPurchased:  50, grossItemRevenue: 1_200 },
  { itemName: "SigmaWaveElite",  itemsViewed: 583, itemsAddedToCart: 109, itemsCheckedOut:  66, itemsPurchased:  59, grossItemRevenue: 1_200 },
  { itemName: "ProDriveIQ",      itemsViewed: 578, itemsAddedToCart: 112, itemsCheckedOut:  63, itemsPurchased:  56, grossItemRevenue: 1_100 },
  { itemName: "OmegaFormNXT",    itemsViewed: 577, itemsAddedToCart: 107, itemsCheckedOut:  66, itemsPurchased:  59, grossItemRevenue:   991 },
  { itemName: "UltraTechAir",    itemsViewed: 575, itemsAddedToCart: 103, itemsCheckedOut:  62, itemsPurchased:  56, grossItemRevenue:   985 },
  { itemName: "OmegaFormEdge",   itemsViewed: 573, itemsAddedToCart: 101, itemsCheckedOut:  63, itemsPurchased:  55, grossItemRevenue:   849 },
];

// ─── Page 4: Traffic Overview ─────────────────────────────────────────────────

export const DEMO_TRAFFIC_KPIS: TrafficKpis = {
  totalUsers: 3_000_000,
  newUsers:   1_500_000,
  sessions:   6_000_000,
  keyEvents:  9_100_000,
};

export const DEMO_TRAFFIC_DAILY: TimeSeriesRow[] = dailySeries(55_000, 52, 11).map((r, i) => ({
  ...r,
  value2: Math.round(r.value * (2.5 + Math.sin(i * 0.3) * 0.4)),
}));

export const DEMO_TRAFFIC_BY_CHANNEL: TrafficByChannelRow[] = dailySeries(55_000, 52, 11).map((r) => ({
  date: r.date,
  organicSearch: Math.round(r.value * 0.32),
  email:         Math.round(r.value * 0.18),
  referral:      Math.round(r.value * 0.22),
  organicVideo:  Math.round(r.value * 0.16),
  direct:        Math.round(r.value * 0.12),
}));

export const DEMO_WEEKLY = Array.from({ length: 26 }, (_, i) => ({
  week: `W${String(i + 1).padStart(2, "0")}`,
  totalUsers: Math.round(400_000 + Math.sin(i * 0.5) * 80_000 + Math.random() * 50_000),
}));

export const DEMO_MONTHLY = [
  { month: "Oct 2025", totalUsers: 1_200_000 },
  { month: "Nov 2025", totalUsers: 1_350_000 },
  { month: "Dec 2025", totalUsers: 1_500_000 },
  { month: "Jan 2026", totalUsers: 1_400_000 },
  { month: "Feb 2026", totalUsers: 1_600_000 },
  { month: "Mar 2026", totalUsers: 1_800_000 },
  { month: "Apr 2026", totalUsers: 1_900_000 },
];
