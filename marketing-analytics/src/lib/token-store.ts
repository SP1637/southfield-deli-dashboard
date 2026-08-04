/**
 * Token store — reads/writes OAuth tokens.
 *
 * Priority order for reads:
 *   1. Supabase DB (persistent, per-user, survives browser clears)
 *   2. httpOnly cookie (session fallback, set immediately after OAuth callback)
 *
 * Writes always go to both (cookie for the current request response, DB for persistence).
 */
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getIntegration, saveIntegration } from "@/lib/supabase";

const SECRET = process.env.NEXTAUTH_SECRET;

function xorEncode(text: string): string {
  if (!SECRET) throw new Error("NEXTAUTH_SECRET must be set to store tokens");
  const bytes = Buffer.from(text, "utf8");
  const key = Buffer.from(SECRET, "utf8");
  return Buffer.from(bytes.map((b, i) => b ^ key[i % key.length])).toString("base64url");
}

function xorDecode(encoded: string): string {
  if (!SECRET) return "";
  try {
    const bytes = Buffer.from(encoded, "base64url");
    const key = Buffer.from(SECRET, "utf8");
    return Buffer.from(bytes.map((b, i) => b ^ key[i % key.length])).toString("utf8");
  } catch {
    return "";
  }
}

/**
 * Read a token for a provider.
 * Tries Supabase first (if user is logged in), falls back to cookie.
 */
export async function readToken(provider: string): Promise<string | null> {
  // Strip _refresh suffix for DB lookup — we store both in metadata or as refresh_token
  const isRefresh = provider.endsWith("_refresh");
  const baseProvider = isRefresh ? provider.replace("_refresh", "") : provider;

  // ── 1. Try Supabase ────────────────────────────────────────────────────────
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await getUserByEmail(session.user.email);
      if (user) {
        const integration = await getIntegration(user.id, baseProvider);
        if (integration) {
          const token = isRefresh ? integration.refresh_token : integration.access_token;
          if (token) return token;
        }
      }
    }
  } catch {
    // Supabase unavailable — fall through to cookie
  }

  // ── 2. Cookie fallback ─────────────────────────────────────────────────────
  const store = await cookies();
  const raw = store.get(`token_${provider}`)?.value;
  if (!raw) return null;
  const decoded = xorDecode(raw);
  return decoded || null;
}

/**
 * Write a token to a response's cookies (XOR-obfuscated, httpOnly).
 * Call saveIntegration() separately to persist to Supabase.
 */
export async function writeToken(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } },
  provider: string,
  token: string,
  maxAge = 60 * 60 * 24 * 30
) {
  res.cookies.set(`token_${provider}`, xorEncode(token), {
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

/** Exchange an OAuth authorization code for access + refresh tokens. */
export async function exchangeCode(params: {
  tokenUrl: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  extraBody?: Record<string, string>;
}): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string } | null> {
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      ...(params.extraBody ?? {}),
    });

    const res = await fetch(params.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[OAuth exchange ${params.tokenUrl}]`, res.status, text);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    console.error("[OAuth exchange]", err.message);
    return null;
  }
}

/**
 * Refresh a Google OAuth access token using the stored refresh token.
 * Updates Supabase and returns the new access token.
 */
export async function refreshGoogleToken(userId: string, provider: string): Promise<string | null> {
  try {
    const integration = await getIntegration(userId, provider);
    if (!integration?.refresh_token) return null;

    const clientId     = process.env.GOOGLE_ADS_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: integration.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (!json.access_token) return null;

    const expiresAt = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000)
      : null;

    await saveIntegration({
      userId,
      provider,
      accessToken: json.access_token,
      refreshToken: integration.refresh_token,
      expiresAt,
    });

    return json.access_token;
  } catch (err: any) {
    console.error("[refreshGoogleToken]", err.message);
    return null;
  }
}

/**
 * Refresh a Meta access token (long-lived tokens via /oauth/access_token).
 */
export async function refreshMetaToken(userId: string): Promise<string | null> {
  try {
    const integration = await getIntegration(userId, "meta_ads");
    if (!integration?.access_token) return null;

    const appId     = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) return null;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}` +
      `&fb_exchange_token=${integration.access_token}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.access_token) return null;

    const expiresAt = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days default

    await saveIntegration({
      userId,
      provider: "meta_ads",
      accessToken: json.access_token,
      expiresAt,
    });

    return json.access_token;
  } catch (err: any) {
    console.error("[refreshMetaToken]", err.message);
    return null;
  }
}
