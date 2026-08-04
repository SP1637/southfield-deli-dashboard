"use client";

import { useEffect, useState, useCallback } from "react";

interface UseRealDataOptions {
  startDate?: string;
  endDate?: string;
  skip?: boolean;
}

interface UseRealDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  refetch: () => void;
}

/**
 * Fetches data from a backend API route with loading/error states.
 * The API routes return { demo: true, data: ... } when no credentials.
 */
export function useRealData<T>(
  endpoint: string,
  options: UseRealDataOptions = {}
): UseRealDataResult<T> {
  const { startDate = "30daysAgo", endDate = "today", skip = false } = options;
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetch_ = useCallback(async () => {
    if (skip) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const url = `${endpoint}?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
      setIsDemo(json.demo ?? false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, startDate, endDate, skip]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, isDemo, refetch: fetch_ };
}

/** Fetches the aggregated overview data for the home dashboard. */
export function useOverview(options?: UseRealDataOptions) {
  return useRealData("/api/data/overview", options);
}

/** Fetches GA4 traffic data. */
export function useGA4Traffic(options?: UseRealDataOptions) {
  return useRealData("/api/ga4/traffic", options);
}

/** Fetches all ads data (Google + Meta aggregated). */
export function useAdsData(options?: UseRealDataOptions) {
  return useRealData("/api/ads", options);
}

/** Fetches Shopify revenue/orders data. */
export function useShopifyData(options?: UseRealDataOptions) {
  return useRealData("/api/shopify", options);
}
