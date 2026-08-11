/**
 * GET /api/cron/refresh-tokens
 *
 * Called by Vercel Cron every 6 hours.
 * Iterates all connected_integrations and refreshes access tokens
 * that are expiring within 24 hours.
 *
 * Protected by CRON_SECRET header — Vercel sets this automatically
 * when using cron jobs defined in vercel.json.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { refreshGoogleToken, refreshMetaToken } from "@/lib/token-store";

// Platforms that use Google OAuth (same refresh mechanism)
const GOOGLE_PLATFORMS = ["google_ads", "ga4", "google_search_console"];

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now

  const results: { provider: string; userId: string; status: string }[] = [];

  try {
    // Fetch all integrations expiring within 24 hours
    const { data: integrations, error } = await supabase
      .from("connected_integrations")
      .select("user_id, provider, expires_at, access_token, refresh_token")
      .not("expires_at", "is", null)
      .lt("expires_at", threshold.toISOString());

    if (error) throw error;

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        message: "No tokens expiring within 24 hours",
        checked: 0,
        refreshed: 0,
        at: now.toISOString(),
      });
    }

    // Refresh each one
    for (const row of integrations) {
      const { user_id, provider } = row;
      try {
        if (GOOGLE_PLATFORMS.includes(provider)) {
          const token = await refreshGoogleToken(user_id, provider);
          results.push({ provider, userId: user_id, status: token ? "refreshed" : "failed" });
        } else if (provider === "meta_ads") {
          const token = await refreshMetaToken(user_id);
          results.push({ provider, userId: user_id, status: token ? "refreshed" : "failed" });
        } else if (provider === "shopify") {
          // Shopify offline tokens don't expire — mark as skipped
          results.push({ provider, userId: user_id, status: "skipped_permanent" });
        } else if (provider === "linkedin_ads") {
          // LinkedIn tokens last 60 days — we can't refresh without user interaction
          results.push({ provider, userId: user_id, status: "skipped_manual" });
        } else {
          results.push({ provider, userId: user_id, status: "skipped_unknown" });
        }
      } catch (err: any) {
        console.error(`[cron/refresh-tokens] ${provider} user=${user_id}`, err.message);
        results.push({ provider, userId: user_id, status: `error: ${err.message}` });
      }
    }

    const refreshed = results.filter(r => r.status === "refreshed").length;
    const failed    = results.filter(r => r.status === "failed").length;

    console.log(`[cron/refresh-tokens] checked=${integrations.length} refreshed=${refreshed} failed=${failed}`);

    return NextResponse.json({
      checked: integrations.length,
      refreshed,
      failed,
      results,
      at: now.toISOString(),
    });

  } catch (err: any) {
    console.error("[cron/refresh-tokens]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
