// ─── GA4 Shared Types ────────────────────────────────────────────────────────

export interface KpiMetrics {
  totalUsers: number;
  purchases: number;
  totalPurchasers: number;
  firstTimePurchasers: number;
  grossPurchaseRevenue: number;
  /** Percentage change vs previous period (e.g. -0.016 = -1.6%) */
  totalUsersDelta: number;
  purchasesDelta: number;
  totalPurchasersDelta: number;
  firstTimePurchasersDelta: number;
  grossPurchaseRevenueDelta: number;
}

export interface FunnelStep {
  name: string;
  /** GA4 event name used for this step */
  eventName: string;
  value: number;
  /** Absolute conversion rate from first step (e.g. 0.1685 = 16.85%) */
  rateFromTop: number;
  /** Conversion rate from the previous step (e.g. 0.7635 = 76.35%) */
  rateFromPrev: number | null;
}

export interface FunnelData {
  steps: FunnelStep[];
}

// ─── Channel / Source-Medium ──────────────────────────────────────────────────

export interface ChannelRow {
  sourceMedium: string;
  totalUsers: number;
  newUsers: number;
  pageViews: number;
  addsToCart: number;
  checkouts: number;
  paymentInfoAdds: number;
  purchases: number;
  grossPurchaseRevenue: number;
}

// ─── Country ─────────────────────────────────────────────────────────────────

export interface CountryRow {
  country: string;
  totalUsers: number;
  newUsers: number;
  pageViews: number;
  addsToCart: number;
  checkouts: number;
  paymentInfoAdds: number;
  purchases: number;
  grossPurchaseRevenue: number;
}

// ─── Item ────────────────────────────────────────────────────────────────────

export interface ItemRow {
  itemName: string;
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsCheckedOut: number;
  itemsPurchased: number;
  grossItemRevenue: number;
}

export interface ItemFunnelData {
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsCheckedOut: number;
  itemsPurchased: number;
  grossItemRevenue: number;
  viewsToCart: number;
  viewsToCheckout: number;
  viewsToPurchase: number;
  cartToCheckout: number;
  checkoutToPurchase: number;
}

// ─── Traffic ─────────────────────────────────────────────────────────────────

export interface TrafficKpis {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  keyEvents: number;
}

export interface TrafficTimeSeriesRow {
  date: string;
  totalUsers: number;
  keyEvents: number;
}

export interface TrafficByChannelRow {
  date: string;
  organicSearch: number;
  email: number;
  referral: number;
  organicVideo: number;
  direct: number;
  [key: string]: number | string;
}

// ─── Time Series ─────────────────────────────────────────────────────────────

export interface TimeSeriesRow {
  date: string;
  value: number;
  /** Optional secondary metric (e.g. revenue alongside users) */
  value2?: number;
}

// ─── Pie / Donut chart ───────────────────────────────────────────────────────

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardFilters {
  dateRange: DateRange;
  campaign?: string;
  sourceMedium?: string;
  country?: string;
  propertyId: string;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  cached: boolean;
  fetchedAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ─── NextAuth session extension ──────────────────────────────────────────────

export interface ExtendedSession {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  accessToken: string;
  error?: string;
}

// ─── GA4 Property ────────────────────────────────────────────────────────────

export interface GA4Property {
  name: string;       // e.g. "properties/123456789"
  displayName: string;
  propertyId: string; // e.g. "123456789"
}
