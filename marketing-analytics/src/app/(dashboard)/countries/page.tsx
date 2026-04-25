"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelVisualization } from "@/components/dashboard/funnel-visualization";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Countries } from "@/hooks/use-ga4-countries";
import { toGA4DateString } from "@/lib/utils";
import type { CountryRow } from "@/types";

const COUNTRY_COLUMNS: Column<CountryRow>[] = [
  { key: "country", label: "Country", format: "string", sortable: false },
  { key: "totalUsers", label: "Total Users", format: "number" },
  { key: "newUsers", label: "New Users", format: "number" },
  { key: "pageViews", label: "Page Views", format: "number" },
  { key: "addsToCart", label: "Adds to Cart", format: "number" },
  { key: "checkouts", label: "Checkouts", format: "number" },
  { key: "paymentInfoAdds", label: "Payment Info", format: "number" },
  { key: "purchases", label: "Purchases", format: "number" },
  { key: "grossPurchaseRevenue", label: "Revenue", format: "currency" },
];

export default function CountriesPage() {
  const [propertyId, setPropertyId] = useState(process.env.NEXT_PUBLIC_GA4_PROPERTY_ID ?? "");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 6)),
    endDate: toGA4DateString(new Date()),
    propertyId,
  });

  const { data, isLoading, isError, error, refetch } = useGA4Countries({ ...filters, propertyId });
  const d = data?.data;

  // Build funnel steps from country KPIs (approximate — no real per-step data in countries endpoint)
  const funnelSteps = d
    ? [
        { name: "Page Views", eventName: "page_view", value: d.countryRows.reduce((s, r) => s + r.pageViews, 0), rateFromTop: 1, rateFromPrev: null },
        { name: "Adds to Cart", eventName: "add_to_cart", value: d.countryRows.reduce((s, r) => s + r.addsToCart, 0), rateFromTop: 0, rateFromPrev: 0 },
        { name: "Checkouts", eventName: "begin_checkout", value: d.countryRows.reduce((s, r) => s + r.checkouts, 0), rateFromTop: 0, rateFromPrev: 0 },
        { name: "Payment Info", eventName: "add_payment_info", value: d.countryRows.reduce((s, r) => s + r.paymentInfoAdds, 0), rateFromTop: 0, rateFromPrev: 0 },
        { name: "Purchases", eventName: "purchase", value: d.countryRows.reduce((s, r) => s + r.purchases, 0), rateFromTop: 0, rateFromPrev: 0 },
      ].map((s, i, arr) => ({
        ...s,
        rateFromTop: arr[0].value > 0 ? s.value / arr[0].value : 0,
        rateFromPrev: i === 0 ? null : arr[i - 1].value > 0 ? s.value / arr[i - 1].value : 0,
      }))
    : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Sales Funnel by Country</h1>
          <p className="text-sm text-muted-foreground">Country-level performance across the purchase funnel</p>
        </div>
        <div className="flex items-center gap-2">
          <PropertySelector value={propertyId} onChange={(id) => { setPropertyId(id); setFilters((f) => ({ ...f, propertyId: id })); }} />
          <button onClick={() => refetch()} className="rounded-md border p-2 text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={(f) => setFilters({ ...f, propertyId })} show={[]} />

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(error as Error)?.message ?? "Failed to load data"}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Users" value={d?.kpis.totalUsers ?? 0} delta={d?.kpis.totalUsersDelta ?? 0} loading={isLoading} comparisonLabel="from previous week" />
        <KpiCard label="Purchases" value={d?.kpis.purchases ?? 0} delta={d?.kpis.purchasesDelta ?? 0} loading={isLoading} comparisonLabel="from previous week" />
        <KpiCard label="Total Purchasers" value={d?.kpis.totalPurchasers ?? 0} delta={d?.kpis.totalPurchasersDelta ?? 0} loading={isLoading} comparisonLabel="from previous week" />
        <KpiCard label="First-Time Purchasers" value={d?.kpis.firstTimePurchasers ?? 0} delta={d?.kpis.firstTimePurchasersDelta ?? 0} loading={isLoading} comparisonLabel="from previous week" />
        <KpiCard label="Gross Revenue" value={d?.kpis.grossPurchaseRevenue ?? 0} delta={d?.kpis.grossPurchaseRevenueDelta ?? 0} format="currency" loading={isLoading} comparisonLabel="from previous week" />
      </div>

      <FunnelVisualization steps={funnelSteps} loading={isLoading} />

      <TimeSeriesChart
        title="Page Views by Day"
        data={d?.timeSeries ?? []}
        color="#10b981"
        loading={isLoading}
      />

      <DataTable<CountryRow>
        title="Country Performance"
        columns={COUNTRY_COLUMNS}
        rows={d?.countryRows ?? []}
        defaultSortKey="totalUsers"
        loading={isLoading}
      />
    </div>
  );
}
