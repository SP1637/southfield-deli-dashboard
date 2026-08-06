/**
 * POST /api/share  — generate a signed shareable dashboard link
 * GET  /api/share?token=  — validate a share token
 *
 * Tokens are signed JWTs (HS256) using NEXTAUTH_SECRET.
 * They contain: propertyId, expiresAt, createdBy (user email).
 * No database needed — the token itself is the state.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SECRET = process.env.NEXTAUTH_SECRET ?? "fallback-secret";

function base64url(str: string): string {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function sign(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const crypto = require("crypto");
  const sig = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verify(token: string): object | null {
  try {
    const [header, body, sig] = token.split(".");
    const crypto = require("crypto");
    const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { propertyId = "", expiryDays = 30 } = body;

  const payload = {
    propertyId,
    createdBy: session?.user?.email ?? "demo-user",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiryDays * 86400,
  };

  const token = sign(payload);
  const url = `${process.env.NEXTAUTH_URL ?? ""}/share/${token}`;

  return NextResponse.json({ token, url, expiresAt: new Date(payload.exp * 1000).toISOString() });
}

// GET is intentionally public — used by the /share/[token] page (no login needed)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const payload = verify(token);
  if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

  return NextResponse.json({ valid: true, payload });
}
