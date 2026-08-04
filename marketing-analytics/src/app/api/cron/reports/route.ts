/**
 * GET /api/cron/reports
 *
 * Vercel Cron Job — runs every Monday at 08:00 UTC.
 * Reads scheduled report subscriptions from the in-memory store (or future DB),
 * fetches current GA4 KPIs, and sends the email report via Resend.
 *
 * Secured with CRON_SECRET so only Vercel (or your CI pipeline) can call it.
 * In vercel.json set:
 *   { "crons": [{ "path": "/api/cron/reports", "schedule": "0 8 * * 1" }] }
 *
 * Required env vars:
 *   CRON_SECRET        — a random secret string you generate; set in Vercel env vars
 *   RESEND_API_KEY     — for sending emails
 *   GOOGLE_SERVICE_ACCOUNT_JSON — for GA4 data
 */
import { NextRequest, NextResponse } from "next/server";
import { buildGA4Client } from "@/lib/ga4/service-account";
import { buildEmailHtml } from "@/lib/email-report";
import { scheduledReports } from "@/lib/scheduled-reports-store";

export async function GET(req: NextRequest) {
  // ── Auth: verify CRON_SECRET header sent by Vercel ────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }

  const ga4Key = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!ga4Key) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not configured" }, { status: 503 });
  }

  const dashboardUrl = process.env.NEXTAUTH_URL ?? "https://marketing-analytics-self.vercel.app";
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  const startDate = new Date(today.setDate(today.getDate() - 29)).toISOString().slice(0, 10);

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  const ga4Client = buildGA4Client();

  const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];

  for (const [, sub] of scheduledReports) {
    // Only send weekly on Mondays (cron also enforces this, but belt-and-suspenders)
    if (sub.frequency === "weekly" && new Date().getDay() !== 1) continue;
    if (sub.frequency === "monthly" && new Date().getDate() !== 1) continue;

    try {
      // Fetch GA4 KPIs for this property
      const property = `properties/${sub.propertyId}`;
      const [kpiRes] = await ga4Client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "totalUsers" },
          { name: "transactions" },
          { name: "purchaseRevenue" },
        ],
      } as any);

      const row = (kpiRes as any)?.rows?.[0];
      const kpis = {
        revenue:   parseFloat(row?.metricValues?.[2]?.value ?? "0"),
        users:     parseFloat(row?.metricValues?.[0]?.value ?? "0"),
        purchases: parseFloat(row?.metricValues?.[1]?.value ?? "0"),
        roas:      0, // GA4 doesn't provide ad spend; sent as 0
      };

      const html = buildEmailHtml({
        userName:     sub.name,
        userEmail:    sub.email,
        startDate,
        endDate,
        propertyId:   sub.propertyId,
        kpis,
        dashboardUrl,
      });

      const { error } = await resend.emails.send({
        from:    "Nexoryx One Reports <onboarding@resend.dev>",
        to:      sub.email,
        subject: `Your Weekly Marketing Report · ${startDate} → ${endDate}`,
        html,
      });

      results.push({ email: sub.email, status: error ? "failed" : "sent", error: error?.message });
    } catch (err: any) {
      results.push({ email: sub.email, status: "failed", error: err.message });
      console.error(`[Cron] Failed to send report to ${sub.email}:`, err.message);
    }
  }

  console.log(`[Cron] Reports job completed. Sent: ${results.filter((r) => r.status === "sent").length}, Failed: ${results.filter((r) => r.status === "failed").length}`);

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
    runAt: new Date().toISOString(),
  });
}
