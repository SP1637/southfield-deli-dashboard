import { useQuery } from "@tanstack/react-query";
import type { FilterValues } from "@/components/dashboard/filter-bar";
import type { KpiMetrics, FunnelStep, TimeSeriesRow, ChannelRow, DonutSlice } from "@/types";

interface FunnelApiData {
  kpis: KpiMetrics;
  funnelSteps: FunnelStep[];
  timeSeries: TimeSeriesRow[];
  channelRows: ChannelRow[];
  donut: DonutSlice[];
}

export function useGA4Funnel(filters: FilterValues) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.campaign && { campaign: filters.campaign }),
    ...(filters.sourceMedium && { sourceMedium: filters.sourceMedium }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
  } as Record<string, string>);

  return useQuery<{ data: FunnelApiData; cached: boolean; fetchedAt: string }>({
    queryKey: ["ga4-funnel", filters],
    queryFn: () => fetch(`/api/ga4/funnel?${params}`).then((r) => {
      if (!r.ok) throw new Error(`GA4 API error: ${r.status}`);
      return r.json();
    }),
    enabled: !!filters.startDate,
  });
}

// Extend FilterValues with propertyId
declare module "@/components/dashboard/filter-bar" {
  interface FilterValues {
    propertyId?: string;
  }
}
