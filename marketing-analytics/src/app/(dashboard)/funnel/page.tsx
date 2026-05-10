"use client";

import { useState } from "react";
import { useGA4Property } from "@/hooks/use-ga4-property";
import { subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelVisualization } from "@/components/dashboard/funnel-visualization";
import { TimeSeriesChart } from "@/components/dashboard/time-series-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterBar, type FilterValues } from "@/components/dashboard/filter-bar";
import { PropertySelector } from "@/components/dashboard/property-selector";
import { useGA4Funnel } from "@/hooks/use-ga4-funnel";
import { toGA4DateString } from "@/lib/utils";
import {
  DEMO_FUNNEL_KPIS, DEMO_FUNNEL_STEPS, DEMO_FUNNEL_TIMESERIES,
  DEMO_DONUT, DEMO_CHANNEL_ROWS,
} from "@/lib/demo-data";
import type { ChannelRow } from "@/types";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const CHANNEL_COLUMNS: Column<ChannelRow>[] = [
  { key: "sourceMedium",         label: "Source / Medium",   format: "string",   sortable: false },
  { key: "totalUsers",           label: "Total Users",        format: "number" },
  { key: "newUsers",             label: "New Users",          format: "number" },
  { key: "pageViews",            label: "Page Views",         format: "number" },
  { key: "addsToCart",           label: "Adds to Cart",       format: "number" },
  { key: "checkouts",            label: "Checkouts",          format: "number" },
  { key: "paymentInfoAdds",      label: "Payment Info",       format: "number" },
  { key: "purchases",            label: "Purchases",          format: "number" },
  { key: "grossPurchaseRevenue", label: "Revenue",            format: "currency" },
];

export default function FunnelPage() {
  const { data: session } = useSession();
  const [propertyId, setPropertyId] = useGA4Property();
  const [filters, setFilters] = useState<FilterValues>({
    startDate: toGA4DateString(subDays(new Date(), 29)),
    endDate: toGA4DateString(new Date()),
  });

  const ga4 = useGA4Funnel({ ...filters, propertyId });

  // Use real GA4 data if authenticated, otherwise fall back to demo
  const isDemo = !session || ga4.isError || !ga4.data;
  const kpis        = ga4.data?.data.kpis        ?? DEMO_FUNNEL_KPIS;
  const funnelSteps = ga4.data?.data.funnelSteps ?? DEMO_FUNNEL_STEPS;
  const timeSeries  = ga4.data?.data.timeSeries  ?? DEMO_FUNNEL_TIMESERIES;
  const donut       = ga4.data?.data.donut       ?? DEMO_DONUT;
  const channelRows = ga4.data?.data.channelRows ?? DEMO_CHANNEL_ROWS;
  const loading     = ga4.isLoading && !!session;

  return (
    <>
      <PageHeader title="Sales Funnel by Channel" />
      <PageContent>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        show={["campaign", "sourceMedium"]}
      />

      {/* KPI Cards — 5 across */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Users"           value={kpis.totalUsers}           delta={kpis.totalUsersDelta}           loading={loading} />
        <KpiCard label="Purchases"             value={kpis.purchases}             delta={kpis.purchasesDelta}             loading={loading} />
        <KpiCard label="Total Purchasers"      value={kpis.totalPurchasers}      delta={kpis.totalPurchasersDelta}      loading={loading} />
        <KpiCard label="First-Time Purchasers" value={kpis.firstTimePurchasers}  delta={kpis.firstTimePurchasersDelta}  loading={loading} />
        <KpiCard label="Gross Revenue"         value={kpis.grossPurchaseRevenue} delta={kpis.grossPurchaseRevenueDelta} format="currency" loading={loading} />
      </div>

      {/* Funnel visualization */}
      <FunnelVisualization steps={funnelSteps} loading={loading} />

      {/* Charts — time series left, donut right */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeSeriesChart
          title="Dynamics by Period — Total Users"
          data={timeSeries}
          color="#6366f1"
          loading={loading}
        />
        <DonutChart
          title="Purchases by Source / Medium"
          data={donut}
          loading={loading}
        />
      </div>

      {/* Source / Medium table */}
      <DataTable<ChannelRow>
        title="Source / Medium Performance"
        columns={CHANNEL_COLUMNS}
        rows={channelRows}
        defaultSortKey="totalUsers"
        loading={loading}
      />
      </PageContent>
    </>
  );
}
