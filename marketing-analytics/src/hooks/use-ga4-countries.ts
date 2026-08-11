import { useQuery } from "@tanstack/react-query";
import type { FilterValues } from "@/components/dashboard/filter-bar";
import type { KpiMetrics, TimeSeriesRow, CountryRow } from "@/types";

interface CountriesApiData {
  kpis: KpiMetrics;
  timeSeries: TimeSeriesRow[];
  countryRows: CountryRow[];
}

export function useGA4Countries(filters: FilterValues) {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.country && { country: filters.country }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
  } as Record<string, string>);

  return useQuery<{ data: CountriesApiData; cached: boolean }>({
    queryKey: ["ga4-countries", filters],
    queryFn: () =>
      fetch(`/api/ga4/countries?${params}`).then((r) => {
        if (!r.ok) throw new Error(`GA4 API error: ${r.status}`);
        return r.json();
      }),
    enabled: !!filters.startDate,
  });
}
