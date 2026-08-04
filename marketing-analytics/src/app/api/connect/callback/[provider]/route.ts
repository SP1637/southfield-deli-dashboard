import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_PROVIDERS, getClientId, getClientSecret, type OAuthProviderId,
} from "@/lib/oauth-providers";
import { exchangeCode, writeToken } from "@/lib/token-store";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upsertUser, saveIntegration } from "@/lib/supabase";

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

  // ── Exchange code for tokens ──────────────────────────────────────────────
  const config = OAUTH_PROVIDERS[provider as OAuthProviderId];
  const clientId     = getClientId(provider as OAuthProviderId);
  const clientSecret = getClientSecret(provider as OAuthProviderId);

  const redirectUri = `${base}/api/connect/callback/${provider}`;
  const shopDomain  = cookieStore.get(`oauth_shop_${provider}`)?.value;
  const tokenUrl = provider === "shopify" && shopDomain
    ? `https://${shopDomain}.myshopify.com/admin/oauth/access_token`
    : config?.tokenUrl;

  const response = NextResponse.redirect(`${base}/connect?connected=${provider}`);

  if (config && clientId && clientSecret && tokenUrl) {
    let tokenData: { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string } | null = null;

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
      // ── 1. Cookie fallback (always works, no DB needed) ──────────────────
      await writeToken(response, provider, tokenData.access_token);
      if (tokenData.refresh_token) {
        await writeToken(response, `${provider}_refresh`, tokenData.refresh_token, 60 * 60 * 24 * 365);
      }

      // ── 2. Persist to Supabase if user is logged in ──────────────────────
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          const user = await upsertUser({
            email: session.user.email,
            name: session.user.name ?? null,
            image: session.user.image ?? null,
          });
          if (user) {
            const expiresAt = tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000)
              : null;
            await saveIntegration({
              userId: user.id,
              provider,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token ?? null,
              expiresAt,
              scope: tokenData.scope ?? null,
              metadata: shopDomain ? { shopDomain } : {},
            });
          }
        }
      } catch (dbErr: any) {
        // DB save failed — cookie fallback still works, don't break the flow
        console.error("[callback] Supabase save failed:", dbErr.message);
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
