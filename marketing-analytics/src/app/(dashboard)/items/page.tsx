"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Items } from "@/hooks/use-ga4-items";
import { toGA4DateString, formatCompact, formatPercent, formatCurrency } from "@/lib/utils";
import { DEMO_ITEM_FUNNEL, DEMO_ITEM_TIMESERIES, DEMO_ITEM_ROWS } from "@/lib/demo-data";
import type { ItemRow } from "@/types";

const ITEM_COLUMNS: Column<ItemRow>[] = [
  { key: "itemName",          label: "Item Name",       format: "string",   sortable: false },
  { key: "itemsViewed",       label: "Items Viewed",    format: "number" },
  { key: "itemsAddedToCart",  label: "Added to Cart",   format: "number" },
  { key: "itemsCheckedOut",   label: "Checked Out",     format: "number" },
  { key: "itemsPurchased",    label: "Purchased",       format: "number" },
  { key: "grossItemRevenue",  label: "Revenue",         format: "currency" },
];

const STEP_COLORS = ["bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-pink-500"];
const BAR_MAX_H = 140;

export default function ItemsPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useState("");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 6)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Items({ ...filters, propertyId });
  const f         = ga4.data?.data.funnelSummary ?? DEMO_ITEM_FUNNEL;
  const timeSeries = ga4.data?.data.timeSeries   ?? DEMO_ITEM_TIMESERIES;
  const itemRows   = ga4.data?.data.itemRows      ?? DEMO_ITEM_ROWS;
  const loading    = ga4.isLoading && !!session;

  const steps = [
    { name: "Items Viewed",    value: f.itemsViewed,       rate: 1,                  rateFromPrev: null },
    { name: "Added to Cart",   value: f.itemsAddedToCart,  rate: f.viewsToCart,       rateFromPrev: f.viewsToCart },
    { name: "Checked Out",     value: f.itemsCheckedOut,   rate: f.viewsToCheckout,   rateFromPrev: f.cartToCheckout },
    { name: "Purchased",       value: f.itemsPurchased,    rate: f.viewsToPurchase,   rateFromPrev: f.checkoutToPurchase },
  ];
  const topValue = steps[0].value || 1;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sales Funnel by Item</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filters.startDate} — {filters.endDate}
          </p>
        </div>
        {session && (
          <div className="flex items-center gap-2">
            <PropertySelector value={propertyId} onChange={setPropertyId} />
            <button onClick={() => ga4.refetch()} className="rounded-md border p-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={`h-4 w-4 ${ga4.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      <FilterBar filters={filters} onChange={setFilters} show={[]} />

      {/* Item funnel — 4 steps + revenue badge */}
      <div className="rounded-lg border bg-card p-6">
        <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Funnel</p>

        <div className="flex items-end">
          {steps.map((step, i) => {
            const barH = Math.max(Math.round((step.value / topValue) * BAR_MAX_H), 8);
            return (
              <div key={step.name} className="flex flex-1 items-end">
                <div className="flex flex-1 flex-col items-center">
                  <span className="mb-1.5 text-sm font-bold tabular-nums">{formatCompact(step.value)}</span>
                  <div className={`w-full rounded-t-sm ${STEP_COLORS[i]}`} style={{ height: `${barH}px` }} />
                  <p className="mt-2 text-center text-xs font-medium leading-tight px-1">{step.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-indigo-600">{formatPercent(step.rate)}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex w-8 shrink-0 flex-col items-center pb-[52px]">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {step.rateFromPrev !== null ? formatPercent(step.rateFromPrev, 0) : ""}
                    </span>
                    <svg width="16" height="10" viewBox="0 0 16 10" className="text-muted-foreground/50 mt-0.5">
                      <path d="M0 5 H12 M8 1 L14 5 L8 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Revenue metric */}
          <div className="ml-6 flex flex-col items-center justify-end pb-[52px]">
            <p className="text-xs text-muted-foreground">Gross item revenue</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(f.grossItemRevenue)}</p>
          </div>
        </div>

        {/* Conversion summary */}
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3">
          {[
            { label: "Views → Cart",     rate: f.viewsToCart },
            { label: "Views → Checkout", rate: f.viewsToCheckout },
            { label: "Views → Purchase", rate: f.viewsToPurchase },
          ].map((c) => (
            <div key={c.label} className="text-center">
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums">{formatPercent(c.rate)}</p>
            </div>
          ))}
        </div>
      </div>

      <TimeSeriesChart title="Dynamics — Items Viewed" data={timeSeries} color="#f59e0b" loading={loading} />

      <DataTable<ItemRow>
        title="Item Performance"
        columns={ITEM_COLUMNS}
        rows={itemRows}
        defaultSortKey="itemsViewed"
        loading={loading}
      />
    </>
  );
}
