import { useQuery } from "@tanstack/react-query";
import type { FilterValues } from "@/components/dashboard/filter-bar";
import type { ItemFunnelData, TimeSeriesRow, ItemRow } from "@/types";

interface ItemsApiData {
  funnelSummary: ItemFunnelData;
  timeSeries: TimeSeriesRow[];
  itemRows: ItemRow[];
}

export function useGA4Items(filters: FilterValues) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.itemName && { itemName: filters.itemName }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
  } as Record<string, string>);

  return useQuery<{ data: ItemsApiData; cached: boolean }>({
    queryKey: ["ga4-items", filters],
    queryFn: () =>
      fetch(`/api/ga4/items?${params}`).then((r) => {
        if (!r.ok) throw new Error(`GA4 API error: ${r.status}`);
        return r.json();
      }),
    enabled: !!filters.startDate,
  });
}
