/**
 * GET /api/integrations/status
 *
 * Returns which providers are connected for the current user.
 * Checks Supabase first (persistent), falls back to cookies (session-only).
 *
 * Response:
 *   { connected: { ga4: true, google_ads: false, meta_ads: true, … } }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getAllIntegrations } from "@/lib/supabase";
import { cookies } from "next/headers";

const ALL_PROVIDERS = [
  "ga4",
  "google_ads",
  "meta_ads",
  "shopify",
  "linkedin_ads",
  "tiktok_ads",
  "pinterest_ads",
  "snapchat_ads",
  "bing_ads",
  "salesforce",
];

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();

  // ── Demo mode ────────────────────────────────────────────────────────────
  if (cookieStore.has("nexoryx_demo")) {
    // Show a realistic set of connected platforms for the demo
    return NextResponse.json({
      connected: {
        ga4: true,
        google_ads: true,
        meta_ads: true,
        shopify: true,
        linkedin_ads: false,
        tiktok_ads: true,
        pinterest_ads: false,
        snapchat_ads: false,
        bing_ads: false,
        salesforce: false,
      },
      source: "demo",
    });
  }

  // ── Real user: check Supabase ─────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    try {
      const user = await getUserByEmail(session.user.email);
      if (user) {
        const integrations = await getAllIntegrations(user.id);
        const connectedSet = new Set(integrations.map((i) => i.provider));

        const connected: Record<string, boolean> = {};
        for (const p of ALL_PROVIDERS) {
          connected[p] = connectedSet.has(p);
        }

        return NextResponse.json({ connected, source: "database" });
      }
    } catch (err: any) {
      console.error("[integrations/status] Supabase error:", err.message);
      // Fall through to cookie fallback
    }
  }

  // ── Cookie fallback (no DB or not logged in) ──────────────────────────────
  const connected: Record<string, boolean> = {};
  for (const p of ALL_PROVIDERS) {
    connected[p] = cookieStore.has(`connected_${p}`);
  }

  return NextResponse.json({
    connected,
    source: session ? "cookies" : "unauthenticated",
  });
}

export async function DELETE(req: NextRequest) {
  const { provider } = await req.json().catch(() => ({ provider: null }));
  if (!provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getUserByEmail, deleteIntegration } = await import("@/lib/supabase");
    const user = await getUserByEmail(session.user.email);
    if (user) {
      await deleteIntegration(user.id, provider);
    }
  } catch (err: any) {
    console.error("[integrations/status] delete error:", err.message);
  }

  // Also clear the cookie fallback
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(`connected_${provider}`);
  response.cookies.delete(`token_${provider}`);
  response.cookies.delete(`token_${provider}_refresh`);
  return response;
}
