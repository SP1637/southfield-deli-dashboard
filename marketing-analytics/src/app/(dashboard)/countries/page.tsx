"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelVisualization } from "@/components/dashboard/funnel-visualization";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Countries } from "@/hooks/use-ga4-countries";
import { toGA4DateString } from "@/lib/utils";
import {
  DEMO_COUNTRY_KPIS, DEMO_COUNTRY_FUNNEL_STEPS,
  DEMO_COUNTRY_TIMESERIES, DEMO_COUNTRY_ROWS,
} from "@/lib/demo-data";
import type { CountryRow } from "@/types";

const COUNTRY_COLUMNS: Column<CountryRow>[] = [
  { key: "country",              label: "Country",       format: "string",   sortable: false },
  { key: "totalUsers",           label: "Total Users",   format: "number" },
  { key: "newUsers",             label: "New Users",     format: "number" },
  { key: "pageViews",            label: "Page Views",    format: "number" },
  { key: "addsToCart",           label: "Adds to Cart",  format: "number" },
  { key: "checkouts",            label: "Checkouts",     format: "number" },
  { key: "paymentInfoAdds",      label: "Payment Info",  format: "number" },
  { key: "purchases",            label: "Purchases",     format: "number" },
  { key: "grossPurchaseRevenue", label: "Revenue",       format: "currency" },
];

export default function CountriesPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useState("");
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 6)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Countries({ ...filters, propertyId });
  const isDemo = !session || ga4.isError || !ga4.data;
  const kpis        = ga4.data?.data.kpis        ?? DEMO_COUNTRY_KPIS;
  const funnelSteps = DEMO_COUNTRY_FUNNEL_STEPS; // computed from table data
  const timeSeries  = ga4.data?.data.timeSeries  ?? DEMO_COUNTRY_TIMESERIES;
  const countryRows = ga4.data?.data.countryRows ?? DEMO_COUNTRY_ROWS;
  const loading     = ga4.isLoading && !!session;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sales Funnel by Country</h1>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Users"           value={kpis.totalUsers}           delta={kpis.totalUsersDelta}           loading={loading} comparisonLabel="from previous week" />
        <KpiCard label="Purchases"             value={kpis.purchases}             delta={kpis.purchasesDelta}             loading={loading} comparisonLabel="from previous week" />
        <KpiCard label="Total Purchasers"      value={kpis.totalPurchasers}      delta={kpis.totalPurchasersDelta}      loading={loading} comparisonLabel="from previous week" />
        <KpiCard label="First-Time Purchasers" value={kpis.firstTimePurchasers}  delta={kpis.firstTimePurchasersDelta}  loading={loading} comparisonLabel="from previous week" />
        <KpiCard label="Gross Revenue"         value={kpis.grossPurchaseRevenue} delta={kpis.grossPurchaseRevenueDelta} format="currency" loading={loading} comparisonLabel="from previous week" />
      </div>

      <FunnelVisualization steps={funnelSteps} loading={loading} />

      <TimeSeriesChart title="Dynamics by Country — Page Views" data={timeSeries} color="#10b981" loading={loading} />

      <DataTable<CountryRow>
        title="Country Performance"
        columns={COUNTRY_COLUMNS}
        rows={countryRows}
        defaultSortKey="totalUsers"
        loading={loading}
      />
    </>
  );
}
