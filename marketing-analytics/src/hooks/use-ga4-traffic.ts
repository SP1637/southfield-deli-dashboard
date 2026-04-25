import { useQuery } from "@tanstack/react-query";
import type { FilterValues } from "@/components/dashboard/filter-bar";
import type { TrafficKpis, TimeSeriesRow, TrafficByChannelRow } from "@/types";

interface TrafficApiData {
  kpis: TrafficKpis;
  dailyTimeSeries: TimeSeriesRow[];
  byChannel: TrafficByChannelRow[];
  weekly: Array<{ week: string; totalUsers: number }>;
  monthly: Array<{ month: string; totalUsers: number }>;
}

export function useGA4Traffic(filters: FilterValues) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.channelGroup && { channelGroup: filters.channelGroup }),
    ...(filters.deviceCategory && { deviceCategory: filters.deviceCategory }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
  } as Record<string, string>);

  return useQuery<{ data: TrafficApiData; cached: boolean }>({
    queryKey: ["ga4-traffic", filters],
    queryFn: () =>
      fetch(`/api/ga4/traffic?${params}`).then((r) => {
        if (!r.ok) throw new Error(`GA4 API error: ${r.status}`);
        return r.json();
      }),
    enabled: !!filters.startDate,
  });
}
