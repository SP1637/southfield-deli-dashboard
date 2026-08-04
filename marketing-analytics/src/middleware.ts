/**
 * Middleware — routing based on auth + onboarding state.
 *
 * Auth detection: we read the NextAuth session cookie directly instead of
 * calling getToken() from next-auth/jwt.  getToken() bundles crypto helpers
 * that can silently return null in the Next.js 15 Edge runtime.
 *
 * NextAuth v4 session-token cookie names:
 *   - production (HTTPS): __Secure-next-auth.session-token
 *   - development (HTTP): next-auth.session-token
 *   - when the JWT is large, NextAuth chunks it into:
 *       __Secure-next-auth.session-token.0
 *       __Secure-next-auth.session-token.1  …etc.
 *
 * We check for both the base name and any .N chunk so large tokens are
 * detected correctly.
 */

import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PATHS = [
  // Core
  "/home",
  "/ask",
  // Decision Intelligence
  "/executive-summary",
  "/recommendations",
  "/alerts",
  "/forecasts",
  // Business Performance
  "/executive-dashboard",
  "/marketing-score",
  "/revenue-intelligence",
  "/roi",
  "/attribution",
  "/goals",
  // Marketing Intelligence
  "/marketing-overview",
  "/campaigns",
  "/channel-performance",
  "/audience",
  "/content-performance",
  "/creative-performance",
  "/seo",
  "/overview",
  "/email-marketing",
  "/media",
  "/video-intelligence",
  "/affiliate",
  "/ads",
  "/marketplace",
  // Revenue Intelligence
  "/revenue",
  "/profit",
  "/margin",
  "/roas",
  "/cac",
  "/revenue-attribution",
  "/revenue-opportunities",
  // Customer Intelligence
  "/customer-journey",
  "/behaviour",
  "/retention",
  "/churn",
  "/cohorts",
  "/demographics",
  "/personas",
  "/audience",
  "/acquisition",
  "/ltv",
  "/segmentation",
  // Sales Intelligence
  "/funnel",
  "/lead-performance",
  "/conversion-analysis",
  "/revenue-pipeline",
  "/items",
  "/orders",
  // Competitor Intelligence
  "/competitors",
  "/share-of-voice",
  "/seo-gap",
  "/keyword-gap",
  "/ad-library",
  "/pricing",
  "/offers",
  "/competitor-content",
  "/social-growth",
  "/reviews",
  "/market-trends",
  // AI Decision Center
  "/ai-decision-center",
  "/recommendations",
  "/opportunities",
  "/risks",
  "/predictions",
  "/root-cause",
  "/budget-optimizer",
  "/campaigns",
  "/seo-optimizer",
  "/creative-optimizer",
  "/audience-optimizer",
  // Forecast Intelligence
  "/forecast-intelligence",
  "/revenue-forecast",
  "/lead-forecast",
  "/budget-forecast",
  "/sales-forecast",
  "/demand-forecast",
  "/seasonality",
  "/predictive-trends",
  // Planning
  "/planning",
  "/campaign-planner",
  "/campaign-calendar",
  "/marketing-calendar",
  "/launch-planner",
  "/budget",
  "/objectives",
  "/okrs",
  "/quarter-planning",
  "/scenario-planning",
  "/forecast-simulator",
  // Integrations
  "/connect",
  "/data-sources",
  "/api-docs",
  "/settings",
  // Legacy / misc
  "/countries",
  "/traffic",
  "/templates",
  "/reports",
  "/roadmap",
  "/web-analytics",
  "/metrics",
  "/tv",
];

const SESSION_COOKIE_PREFIXES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.getAll().some(({ name }) =>
    SESSION_COOKIE_PREFIXES.some(
      (prefix) => name === prefix || name.startsWith(prefix + ".")
    )
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Always pass through: Next.js internals, NextAuth, public routes ─────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/share/")        // read-only shared dashboards — public
  ) {
    return NextResponse.next();
  }

  // Share token validation (GET /api/share?token=) is public — used by /share/[token]
  if (pathname === "/api/share" && req.method === "GET") {
    return NextResponse.next();
  }

  const authed = isAuthenticated(req);

  // "onboarded" cookie is written client-side when the user first clicks
  // "Launch Dashboard".  Middleware reads it to decide the root redirect.
  const hasOnboarded = req.cookies.has("onboarded");

  // ── Root: show landing page to guests; redirect authed users to dashboard ──
  if (pathname === "/") {
    if (authed) {
      // Returning client → dashboard  |  new client → onboarding
      return NextResponse.redirect(
        new URL(hasOnboarded ? "/home" : "/connect", req.url)
      );
    }
    // Not signed in → show the public landing page
    return NextResponse.next();
  }

  // ── Login page: redirect away if already signed in ────────────────────────
  if (pathname === "/login") {
    if (authed) {
      return NextResponse.redirect(
        new URL(hasOnboarded ? "/home" : "/connect", req.url)
      );
    }
    return NextResponse.next();
  }

  // ── Dashboard routes: require authentication ──────────────────────────────
  if (
    DASHBOARD_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
  ) {
    if (!authed) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Other /api/* routes: require authentication ───────────────────────────
  if (pathname.startsWith("/api/")) {
    if (!authed) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
