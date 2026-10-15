/**
 * GET /api/social/instagram?since=&until=
 * Fetches Instagram Business account insights (reach, impressions, followers, engagement).
 * Requires meta_organic OAuth token (token_meta_organic cookie).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readToken } from "@/lib/token-store";

export interface InstagramMetrics {
  username: string;
  accountId: string;
  followers: number;
  reach: number;
  impressions: number;
  profileViews: number;
  websiteClicks: number;
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
    // Get Facebook pages to find linked Instagram account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,instagram_business_account,access_token&access_token=${token}`
    );
    if (!pagesRes.ok) throw new Error(`Pages fetch ${pagesRes.status}`);
    const pagesJson = await pagesRes.json();
    if (pagesJson.error) throw new Error(pagesJson.error.message);
    const pages: any[] = pagesJson.data ?? [];

    const pageWithIg = pages.find((p: any) => p.instagram_business_account);
    if (!pageWithIg) {
      return NextResponse.json({ demo: false, data: null, message: "No Instagram Business account linked to your Facebook Page" });
    }

    const igId = pageWithIg.instagram_business_account.id;
    const pageToken = pageWithIg.access_token;

    // Fetch Instagram account details + insights
    const [profileRes, insightsRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/${igId}?fields=username,followers_count&access_token=${pageToken}`),
      fetch(
        `https://graph.facebook.com/v19.0/${igId}/insights?` +
        `metric=reach,impressions,profile_views,website_clicks` +
        `&period=day&date_preset=last_30d&access_token=${pageToken}`
      ),
    ]);

    const profile = profileRes.ok ? await profileRes.json() : {};
    const sum = async (name: string) => {
      if (!insightsRes.ok) return 0;
      const json = await insightsRes.json();
      return (json.data ?? [])
        .find((m: any) => m.name === name)?.values
        ?.reduce((a: number, v: any) => a + (v.value ?? 0), 0) ?? 0;
    };

    const insJson = insightsRes.ok ? await insightsRes.json() : { data: [] };
    const metrics: any[] = insJson.data ?? [];
    const sumMetric = (name: string) =>
      metrics.find((m: any) => m.name === name)?.values
        ?.reduce((a: number, v: any) => a + (v.value ?? 0), 0) ?? 0;

    const data: InstagramMetrics = {
      username: profile.username ?? "unknown",
      accountId: igId,
      followers: profile.followers_count ?? 0,
      reach: sumMetric("reach"),
      impressions: sumMetric("impressions"),
      profileViews: sumMetric("profile_views"),
      websiteClicks: sumMetric("website_clicks"),
      period: "last_30d",
    };

    return NextResponse.json({ demo: false, data });
  } catch (err: any) {
    console.error("[Instagram]", err.message);
    return NextResponse.json({ demo: true, data: getDemoData(), error: err.message });
  }
}

function getDemoData(): InstagramMetrics {
  return {
    username: "nexoryxone",
    accountId: "demo",
    followers: 8640,
    reach: 62400,
    impressions: 118000,
    profileViews: 4200,
    websiteClicks: 980,
    period: "last_30d",
  };
}
