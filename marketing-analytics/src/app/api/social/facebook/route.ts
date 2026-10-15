/**
 * GET /api/social/facebook?since=&until=
 * Fetches Facebook Page insights (organic reach, impressions, engagement).
 * Requires meta_organic OAuth token (token_meta_organic cookie).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readToken } from "@/lib/token-store";

export interface FacebookPageMetrics {
  pageName: string;
  pageId: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  pageViews: number;
  period: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await readToken("meta_organic");

  if (!token) {
    return NextResponse.json({ demo: true, data: getDemoData() });
  }

  try {
    // Get pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,fan_count,access_token&access_token=${token}`
    );
    if (!pagesRes.ok) throw new Error(`Pages fetch ${pagesRes.status}`);
    const pagesJson = await pagesRes.json();
    if (pagesJson.error) throw new Error(pagesJson.error.message);
    const pages: any[] = pagesJson.data ?? [];

    if (pages.length === 0) {
      return NextResponse.json({ demo: false, data: [] });
    }

    // Fetch insights for the first page
    const page = pages[0];
    const pageToken = page.access_token;
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}/insights?` +
      `metric=page_impressions,page_reach,page_engaged_users,page_views_total` +
      `&period=day&date_preset=last_30d&access_token=${pageToken}`
    );

    let reach = 0, impressions = 0, engagement = 0, pageViews = 0;
    if (insightsRes.ok) {
      const insJson = await insightsRes.json();
      const metrics: any[] = insJson.data ?? [];
      const sum = (name: string) =>
        metrics.find((m: any) => m.name === name)?.values
          ?.reduce((a: number, v: any) => a + (v.value ?? 0), 0) ?? 0;
      reach = sum("page_reach");
      impressions = sum("page_impressions");
      engagement = sum("page_engaged_users");
      pageViews = sum("page_views_total");
    }

    const data: FacebookPageMetrics = {
      pageName: page.name,
      pageId: page.id,
      followers: page.fan_count ?? 0,
      reach,
      impressions,
      engagement,
      pageViews,
      period: "last_30d",
    };

    return NextResponse.json({ demo: false, data });
  } catch (err: any) {
    console.error("[Facebook Pages]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), error: err.message });
  }
}

function getDemoData(): FacebookPageMetrics {
  return {
    pageName: "Nexoryx",
    pageId: "demo",
    followers: 12400,
    reach: 84200,
    impressions: 142000,
    engagement: 6800,
    pageViews: 3200,
    period: "last_30d",
  };
}
