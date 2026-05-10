import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_PROVIDERS, getClientId, getClientSecret, type OAuthProviderId,
} from "@/lib/oauth-providers";
import { exchangeCode, writeToken } from "@/lib/token-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = req.nextUrl;
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState  = cookieStore.get(`oauth_state_${provider}`)?.value;

  // ── User denied or error ─────────────────────────────────────────────────
  if (error) {
    const url = new URL("/connect", base);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("provider", provider);
    return NextResponse.redirect(url.toString());
  }

  // ── CSRF check ───────────────────────────────────────────────────────────
  if (!code || !savedState || state !== savedState) {
    const url = new URL("/connect", base);
    url.searchParams.set("error", "state_mismatch");
    url.searchParams.set("provider", provider);
    return NextResponse.redirect(url.toString());
  }

  // ── Exchange code for access_token ───────────────────────────────────────
  const config = OAUTH_PROVIDERS[provider as OAuthProviderId];
  const clientId     = getClientId(provider as OAuthProviderId);
  const clientSecret = getClientSecret(provider as OAuthProviderId);

  const redirectUri = `${base}/api/connect/callback/${provider}`;

  // Shopify: token exchange URL is per-shop (not a static URL in oauth-providers.ts)
  const shopDomain = cookieStore.get(`oauth_shop_${provider}`)?.value;
  const tokenUrl = provider === "shopify" && shopDomain
    ? `https://${shopDomain}.myshopify.com/admin/oauth/access_token`
    : config?.tokenUrl;

  const response = NextResponse.redirect(`${base}/connect?connected=${provider}`);

  if (config && clientId && clientSecret && tokenUrl) {
    // TikTok uses a JSON body instead of form-encoded
    let tokenData: { access_token?: string; refresh_token?: string } | null = null;

    if (provider === "tiktok_ads") {
      try {
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: clientId, secret: clientSecret, auth_code: code }),
        });
        const json = await res.json();
        tokenData = json?.data ?? null;
      } catch {}
    } else {
      tokenData = await exchangeCode({
        tokenUrl,
        code,
        clientId,
        clientSecret,
        redirectUri,
      });
    }

    if (tokenData?.access_token) {
      // Store access_token in httpOnly cookie (obfuscated)
      await writeToken(response, provider, tokenData.access_token);

      // If we got a refresh_token, store it separately (Google Ads, Bing)
      if (tokenData.refresh_token) {
        await writeToken(response, `${provider}_refresh`, tokenData.refresh_token, 60 * 60 * 24 * 365);
      }
    }
  }

  // Client-readable connection flag (no sensitive data)
  response.cookies.set(`connected_${provider}`, "true", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  // Clean up CSRF state cookies
  response.cookies.delete(`oauth_state_${provider}`);
  response.cookies.delete(`oauth_shop_${provider}`);

  return response;
}
