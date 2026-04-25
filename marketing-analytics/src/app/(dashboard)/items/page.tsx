"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Items } from "@/hooks/use-ga4-items";
import { toGA4DateString, formatCompact, formatPercent, formatCurrency } from "@/lib/utils";
import type { ItemRow } from "@/types";

const ITEM_COLUMNS: Column<ItemRow>[] = [
  { key: "itemName", label: "Item Name", format: "string", sortable: false },
  { key: "itemsViewed", label: "Items Viewed", format: "number" },
  { key: "itemsAddedToCart", label: "Added to Cart", format: "number" },
  { key: "itemsCheckedOut", label: "Checked Out", format: "number" },
  { key: "itemsPurchased", label: "Purchased", format: "number" },
  { key: "grossItemRevenue", label: "Revenue", format: "currency" },
];

function ItemFunnelCard({ data, loading }: { data: ReturnType<typeof useGA4Items>["data"]; loading: boolean }) {
  const f = data?.data.funnelSummary;

  const steps = f
    ? [
        { label: "Items Viewed", value: f.itemsViewed, rate: null },
        { label: "Added to Cart", value: f.itemsAddedToCart, rate: f.viewsToCart },
        { label: "Checked Out", value: f.itemsCheckedOut, rate: f.viewsToCheckout },
        { label: "Purchased", value: f.itemsPurchased, rate: f.viewsToPurchase },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Item Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 flex-1" />)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {steps.map((step, i) => (
              <div key={step.label} className="flex-1 min-w-[140px] rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{step.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatCompact(step.value)}</p>
                {step.rate !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPercent(step.rate)} from views
                  </p>
                )}
                {f && i === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Revenue: {formatCurrency(f.grossItemRevenue)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {f && !loading && (
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Views → Cart</p>
              <p className="text-sm font-semibold">{formatPercent(f.viewsToCart)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Views → Checkout</p>
              <p className="text-sm font-semibold">{formatPercent(f.viewsToCheckout)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Views → Purchase</p>
              <p className="text-sm font-semibold">{formatPercent(f.viewsToPurchase)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ItemsPage() {
  const [propertyId, setPropertyId] = useState(process.env.NEXT_PUBLIC_GA4_PROPERTY_ID ?? "");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 6)),
    endDate: toGA4DateString(new Date()),
    propertyId,
  });

  const query = useGA4Items({ ...filters, propertyId });
  const { data, isLoading, isError, error, refetch } = query;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Sales Funnel by Item</h1>
          <p className="text-sm text-muted-foreground">Item-level engagement across the purchase funnel</p>
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

      <ItemFunnelCard data={data} loading={isLoading} />

      <TimeSeriesChart
        title="Items Viewed over Time"
        data={data?.data.timeSeries ?? []}
        color="#f59e0b"
        loading={isLoading}
      />

      <DataTable<ItemRow>
        title="Item Performance"
        columns={ITEM_COLUMNS}
        rows={data?.data.itemRows ?? []}
        defaultSortKey="itemsViewed"
        loading={isLoading}
      />
    </div>
  );
}
