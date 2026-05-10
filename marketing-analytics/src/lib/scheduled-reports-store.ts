export interface ScheduledReport {
  email: string;
  name: string;
  propertyId: string;
  frequency: "daily" | "weekly" | "monthly";
  createdAt: string;
}

// Module-level store — populated by POST /api/reports/schedule
export const scheduledReports = new Map<string, ScheduledReport>();
