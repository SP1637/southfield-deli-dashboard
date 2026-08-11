/** Raw dimension/metric value as returned by the GA4 Data API */
export interface GA4DimensionValue {
  value: string;
}

export interface GA4MetricValue {
  value: string;
}

export interface GA4Row {
  dimensionValues: GA4DimensionValue[];
  metricValues: GA4MetricValue[];
}

export interface GA4ReportRequest {
  property: string; // "properties/XXXXXXX"
  dateRanges: Array<{ startDate: string; endDate: string }>;
  dimensions?: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  dimensionFilter?: object;
  orderBys?: Array<object>;
  limit?: number;
}

export interface GA4FunnelStep {
  name: string;
  filterExpression: {
    filter: {
      fieldName: string;
      stringFilter: {
        matchType: "EXACT";
        value: string;
      };
    };
  };
}

export interface GA4FunnelReportRequest {
  property: string;
  dateRanges: Array<{ startDate: string; endDate: string }>;
  funnel: { steps: GA4FunnelStep[] };
  funnelBreakdown?: object;
}
