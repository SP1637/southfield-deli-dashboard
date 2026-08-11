import { NextRequest, NextResponse } from "next/server";
import { OAUTH_PROVIDERS, getClientId, type OAuthProviderId } from "@/lib/oauth-providers";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

  // ── Validate provider ────────────────────────────────────────────────────
  if (!(provider in OAUTH_PROVIDERS)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }
  const config = OAUTH_PROVIDERS[provider as OAuthProviderId];
  const clientId = getClientId(provider as OAuthProviderId);

  // ── No credentials configured ────────────────────────────────────────────
  if (!clientId) {
    const errorUrl = new URL("/connect", base);
    errorUrl.searchParams.set("error", "no_credentials");
    errorUrl.searchParams.set("provider", provider);
    return NextResponse.redirect(errorUrl.toString());
  }

  // ── Build OAuth URL ──────────────────────────────────────────────────────
  const shopDomain = req.nextUrl.searchParams.get("shop") ?? "";
  const authBase =
    typeof config.authUrl === "function"
      ? config.authUrl({ shop: shopDomain })
      : config.authUrl;

  const redirectUri = `${base}/api/connect/callback/${provider}`;
  const state = crypto.randomUUID();

  const url = new URL(authBase);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  if (config.scopes.length > 0) {
    url.searchParams.set(
      "scope",
      config.scopes.join(config.scopeDelimiter ?? " ")
    );
  }
  url.searchParams.set("state", state);

  // Extra params (e.g. access_type=offline for Google)
  if (config.extraAuthParams) {
    for (const [k, v] of Object.entries(config.extraAuthParams)) {
      url.searchParams.set(k, v);
    }
  }

  // Persist shop domain in state cookie so callback can use it
  const cookieStore = await cookies();
  cookieStore.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  if (shopDomain) {
    cookieStore.set(`oauth_shop_${provider}`, shopDomain, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return NextResponse.redirect(url.toString());
}
