/**
 * Cookie-based token store for OAuth access tokens.
 *
 * Tokens are stored as httpOnly cookies so they never reach client-side JS.
 * We XOR-obfuscate with NEXTAUTH_SECRET so the raw token isn't visible in
 * server logs or cookie inspection tools.
 *
 * Production upgrade path: swap readToken/writeToken to use a DB (e.g. Vercel KV).
 */
import { cookies } from "next/headers";

const SECRET = process.env.NEXTAUTH_SECRET;
if (!SECRET) {
  // In build/test environments this may fire — safe to warn; at runtime it must be set
  console.warn("[token-store] NEXTAUTH_SECRET is not set — token encryption will fail at runtime");
}

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

export async function readToken(provider: string): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(`token_${provider}`)?.value;
  if (!raw) return null;
  const decoded = xorDecode(raw);
  return decoded || null;
}

export async function writeToken(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } },
  provider: string,
  token: string,
  maxAge = 60 * 60 * 24 * 30  // 30 days
) {
  res.cookies.set(`token_${provider}`, xorEncode(token), {
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

/** Exchange an OAuth authorization code for an access + refresh token. */
export async function exchangeCode(params: {
  tokenUrl: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  extraBody?: Record<string, string>;
}): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
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
