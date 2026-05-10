/**
 * POST /api/connect/api-key
 *
 * Securely stores a connector API key (or WooCommerce credentials) in an
 * httpOnly cookie using the same XOR-obfuscation as the OAuth token store.
 * Called by the connect page instead of writing to localStorage.
 *
 * Body (JSON):
 *   { provider: string; key: string }
 *   OR for WooCommerce:
 *   { provider: "woocommerce"; url: string; key: string; secret: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeToken } from "@/lib/token-store";

const ALLOWED_API_KEY_PROVIDERS = new Set([
  // Original connectors
  "klaviyo",
  "mailchimp",
  "hubspot",
  "activecampaign",
  "woocommerce",
  "google_ads_customer",      // stores the Google Ads Customer ID
  "google_search_console",    // stores the verified site URL
  "youtube",                  // stores the YouTube Channel ID
  "twitter_ads",              // stores the Bearer Token
  // New connectors
  "reddit_ads",
  "mixpanel",
  "amplitude",
  "segment",
  "hotjar",
  "stripe",
  "bigcommerce",
  "brevo",
  "drip",
  "intercom",
  "pipedrive",
  "zoho_crm",
]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { provider } = body;
  if (!provider || !ALLOWED_API_KEY_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  if (provider === "woocommerce") {
    const { url, key, secret } = body;
    if (!url || !key || !secret) {
      return NextResponse.json(
        { error: "url, key and secret are required for WooCommerce" },
        { status: 400 }
      );
    }
    // Store all three fields as a single JSON string
    await writeToken(response, "woocommerce", JSON.stringify({ url, key, secret }));
  } else {
    const { key } = body;
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }
    await writeToken(response, provider, key);
  }

  // Set a client-readable connection flag (no sensitive data)
  response.cookies.set(`connected_${provider}`, "true", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
