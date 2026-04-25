/**
 * Normalise raw GA4 API rows into the typed frontend shapes defined in @/types.
 * All transformers are pure functions so they can be unit-tested independently.
 */
import type { GA4Row } from "./types";
import type {
  ChannelRow,
  CountryRow,
  ItemRow,
  FunnelStep,
  TimeSeriesRow,
  TrafficByChannelRow,
} from "@/types";

const num = (v: string) => parseFloat(v) || 0;

// ─── Funnel ──────────────────────────────────────────────────────────────────

const FUNNEL_STEP_NAMES = [
  "Page Views",
  "Adds to Cart",
  "Checkouts",
  "Payment Info",
  "Purchases",
];

/**
 * Transforms an array of [stepIndex, count] rows (from runFunnelReport) into
 * typed FunnelStep[]. Falls back gracefully if API returns fewer steps.
 */
export function transformFunnelSteps(
  rows: Array<{ stepIndex: number; activeUsers: number }>
): FunnelStep[] {
  const top = rows[0]?.activeUsers ?? 1;
  return rows.map((r, i) => ({
    name: FUNNEL_STEP_NAMES[r.stepIndex] ?? `Step ${r.stepIndex + 1}`,
    eventName: ["page_view", "add_to_cart", "begin_checkout", "add_payment_info", "purchase"][r.stepIndex] ?? "",
    value: r.activeUsers,
    rateFromTop: r.activeUsers / top,
    rateFromPrev: i === 0 ? null : r.activeUsers / (rows[i - 1]?.activeUsers || 1),
  }));
}

// ─── Channel rows ─────────────────────────────────────────────────────────────

export function transformChannelRows(rows: GA4Row[]): ChannelRow[] {
  return rows.map((row) => {
    const [d0] = row.dimensionValues;
    const [m0, m1, m2, m3, m4, m5, m6, m7] = row.metricValues;
    return {
      sourceMedium: d0.value,
      totalUsers: num(m0.value),
      newUsers: num(m1.value),
      pageViews: num(m2.value),
      addsToCart: num(m3.value),
      checkouts: num(m4.value),
      paymentInfoAdds: num(m5.value),
      purchases: num(m6.value),
      grossPurchaseRevenue: num(m7.value),
    };
  });
}

// ─── Country rows ─────────────────────────────────────────────────────────────

export function transformCountryRows(rows: GA4Row[]): CountryRow[] {
  return rows.map((row) => {
    const [d0] = row.dimensionValues;
    const [m0, m1, m2, m3, m4, m5, m6, m7] = row.metricValues;
    return {
      country: d0.value,
      totalUsers: num(m0.value),
      newUsers: num(m1.value),
      pageViews: num(m2.value),
      addsToCart: num(m3.value),
      checkouts: num(m4.value),
      paymentInfoAdds: num(m5.value),
      purchases: num(m6.value),
      grossPurchaseRevenue: num(m7.value),
    };
  });
}

// ─── Item rows ────────────────────────────────────────────────────────────────

export function transformItemRows(rows: GA4Row[]): ItemRow[] {
  return rows.map((row) => {
    const [d0] = row.dimensionValues;
    const [m0, m1, m2, m3, m4] = row.metricValues;
    return {
      itemName: d0.value,
      itemsViewed: num(m0.value),
      itemsAddedToCart: num(m1.value),
      itemsCheckedOut: num(m2.value),
      itemsPurchased: num(m3.value),
      grossItemRevenue: num(m4.value),
    };
  });
}

// ─── Time series ─────────────────────────────────────────────────────────────

/** Parse GA4 date format YYYYMMDD → ISO string YYYY-MM-DD */
function parseDate(d: string): string {
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
  return d;
}

export function transformTimeSeries(
  rows: GA4Row[],
  metricIndex = 0,
  secondMetricIndex?: number
): TimeSeriesRow[] {
  return rows.map((row) => ({
    date: parseDate(row.dimensionValues[0].value),
    value: num(row.metricValues[metricIndex].value),
    ...(secondMetricIndex !== undefined && {
      value2: num(row.metricValues[secondMetricIndex].value),
    }),
  }));
}

// ─── Traffic by channel ───────────────────────────────────────────────────────

export function transformTrafficByChannel(rows: GA4Row[]): TrafficByChannelRow[] {
  const byDate: Record<string, TrafficByChannelRow> = {};

  for (const row of rows) {
    const date = parseDate(row.dimensionValues[0].value);
    const channel = row.dimensionValues[1].value;
    const users = num(row.metricValues[0].value);

    if (!byDate[date]) {
      byDate[date] = {
        date,
        organicSearch: 0,
        email: 0,
        referral: 0,
        organicVideo: 0,
        direct: 0,
      };
    }

    const channelKey = channelToKey(channel);
    byDate[date][channelKey] = (byDate[date][channelKey] as number || 0) + users;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function channelToKey(channel: string): string {
  const map: Record<string, string> = {
    "Organic Search": "organicSearch",
    "Email": "email",
    "Referral": "referral",
    "Organic Video": "organicVideo",
    "Direct": "direct",
  };
  return map[channel] ?? channel.toLowerCase().replace(/\s+/g, "_");
}
