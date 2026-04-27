import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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
  const savedState = cookieStore.get(`oauth_state_${provider}`)?.value;

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

  // ── Success — mark the provider as connected in a cookie ─────────────────
  // In a real app you'd exchange the code for an access_token here and
  // persist it in a database. For this MVP we store the connection flag
  // in a long-lived cookie readable by the client.
  const response = NextResponse.redirect(
    `${base}/connect?connected=${provider}`
  );

  response.cookies.set(`connected_${provider}`, "true", {
    httpOnly: false, // must be readable by JS on the connect page
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  // Clean up CSRF state cookies
  response.cookies.delete(`oauth_state_${provider}`);
  response.cookies.delete(`oauth_shop_${provider}`);

  return response;
}
