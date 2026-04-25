"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelVisualization } from "@/components/dashboard/funnel-visualization";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Funnel } from "@/hooks/use-ga4-funnel";
import { toGA4DateString } from "@/lib/utils";
import type { ChannelRow } from "@/types";

const CHANNEL_COLUMNS: Column<ChannelRow>[] = [
  { key: "sourceMedium", label: "Source / Medium", format: "string", sortable: false },
  { key: "totalUsers", label: "Total Users", format: "number" },
  { key: "newUsers", label: "New Users", format: "number" },
  { key: "pageViews", label: "Page Views", format: "number" },
  { key: "addsToCart", label: "Adds to Cart", format: "number" },
  { key: "checkouts", label: "Checkouts", format: "number" },
  { key: "paymentInfoAdds", label: "Payment Info", format: "number" },
  { key: "purchases", label: "Purchases", format: "number" },
  { key: "grossPurchaseRevenue", label: "Revenue", format: "currency" },
];

export default function FunnelPage() {
  const [propertyId, setPropertyId] = useState(process.env.NEXT_PUBLIC_GA4_PROPERTY_ID ?? "");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 29)),
    endDate: toGA4DateString(new Date()),
    propertyId,
  });

  const handleFiltersChange = (f: FilterValues) => setFilters({ ...f, propertyId });
  const handlePropertyChange = (id: string) => {
    setPropertyId(id);
    setFilters((prev) => ({ ...prev, propertyId: id }));
  };

  const { data, isLoading, isError, error, refetch } = useGA4Funnel({ ...filters, propertyId });
  const d = data?.data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Sales Funnel by Channel</h1>
          <p className="text-sm text-muted-foreground">
            Page Views → Add to Cart → Checkout → Payment Info → Purchase
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PropertySelector value={propertyId} onChange={handlePropertyChange} />
          <button
            onClick={() => refetch()}
            className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={handleFiltersChange}
        show={["campaign", "sourceMedium"]}
      />

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(error as Error)?.message ?? "Failed to load GA4 data. Check your credentials."}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Users" value={d?.kpis.totalUsers ?? 0} delta={d?.kpis.totalUsersDelta ?? 0} loading={isLoading} />
        <KpiCard label="Purchases" value={d?.kpis.purchases ?? 0} delta={d?.kpis.purchasesDelta ?? 0} loading={isLoading} />
        <KpiCard label="Total Purchasers" value={d?.kpis.totalPurchasers ?? 0} delta={d?.kpis.totalPurchasersDelta ?? 0} loading={isLoading} />
        <KpiCard label="First-Time Purchasers" value={d?.kpis.firstTimePurchasers ?? 0} delta={d?.kpis.firstTimePurchasersDelta ?? 0} loading={isLoading} />
        <KpiCard label="Gross Revenue" value={d?.kpis.grossPurchaseRevenue ?? 0} delta={d?.kpis.grossPurchaseRevenueDelta ?? 0} format="currency" loading={isLoading} />
      </div>

      {/* Funnel */}
      <FunnelVisualization steps={d?.funnelSteps ?? []} loading={isLoading} />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeSeriesChart
          title="Total Users over Time"
          data={d?.timeSeries ?? []}
          color="#6366f1"
          loading={isLoading}
        />
        <DonutChart
          title="Purchases by Source / Medium"
          data={(d?.donut ?? []).map((s, i) => ({ ...s, color: "" }))}
          loading={isLoading}
        />
      </div>

      {/* Source/Medium table */}
      <DataTable<ChannelRow>
        title="Source / Medium Performance"
        columns={CHANNEL_COLUMNS}
        rows={d?.channelRows ?? []}
        defaultSortKey="totalUsers"
        loading={isLoading}
      />

      {data?.cached && (
        <p className="text-right text-xs text-muted-foreground">
          Cached · fetched {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : ""}
        </p>
      )}
    </div>
  );
}
