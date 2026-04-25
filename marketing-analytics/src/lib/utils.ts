import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format large numbers as 1.7M, 851.5K, etc. */
export function formatCompact(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(0);
}

/** Format as currency, e.g. $25.5M */
export function formatCurrency(value: number, currency = "USD"): string {
  const compact = formatCompact(value);
  const symbol = currency === "USD" ? "$" : currency;
  return `${symbol}${compact}`;
}

/** Format a delta as +3.8% or -1.6% */
export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

/** Format a percentage like 36.30% */
export function formatPercent(rate: number, decimals = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

/** Convert a JS Date to the GA4 API date string format YYYY-MM-DD */
export function toGA4DateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse GA4 date string YYYYMMDD → display string */
export function parseGA4Date(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

/** Returns the default 30-day date range */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    startDate: toGA4DateString(start),
    endDate: toGA4DateString(end),
  };
}

/** Shorten long source/medium strings for display */
export function truncateSourceMedium(s: string, max = 24): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Palette used for donut/pie charts across the dashboard
export const CHART_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#14b8a6", // teal
  "#f97316", // orange
  "#a855f7", // purple
];

export const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#6366f1",
  Email: "#10b981",
  Referral: "#f59e0b",
  "Organic Video": "#ec4899",
  Direct: "#3b82f6",
  Paid: "#ef4444",
  Social: "#8b5cf6",
};
