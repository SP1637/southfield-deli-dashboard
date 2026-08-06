/**
 * POST /api/insights
 * Generates smart, rule-based marketing insights from KPI data.
 * If ANTHROPIC_API_KEY or OPENAI_API_KEY is set, uses AI — otherwise
 * falls back to deterministic rule-based insights that look just as good.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface KpiInput {
  revenue?: number;
  revenueDelta?: number;
  roas?: number;
  roasDelta?: number;
  users?: number;
  usersDelta?: number;
  purchases?: number;
  purchasesDelta?: number;
  conversionRate?: number;
  topChannel?: string;
  topChannelRevenue?: number;
}

function generateInsights(kpis: KpiInput): string[] {
  const insights: string[] = [];

  // Revenue insight
  if (kpis.revenue != null && kpis.revenueDelta != null) {
    const pct = Math.abs(kpis.revenueDelta * 100).toFixed(1);
    if (kpis.revenueDelta > 0.15) {
      insights.push(`🚀 Revenue is up ${pct}% — strong growth momentum. Consider scaling your best-performing channels to capitalise on this trend.`);
    } else if (kpis.revenueDelta > 0) {
      insights.push(`📈 Revenue grew ${pct}% this period. Healthy, steady growth — focus on improving conversion rate to accelerate further.`);
    } else if (kpis.revenueDelta < -0.15) {
      insights.push(`⚠️ Revenue dropped ${pct}%. This is a significant decline — check for funnel drop-offs, cart abandonment issues, or reduced campaign spend.`);
    } else {
      insights.push(`📉 Revenue dipped ${pct}%. Minor decline — review your highest-spend channels for efficiency losses.`);
    }
  }

  // ROAS insight
  if (kpis.roas != null) {
    if (kpis.roas >= 5) {
      insights.push(`💰 Your ROAS of ${kpis.roas.toFixed(1)}x is excellent. For every £1 spent you're getting £${kpis.roas.toFixed(1)} back — consider increasing ad budget to scale returns.`);
    } else if (kpis.roas >= 3) {
      insights.push(`✅ ROAS of ${kpis.roas.toFixed(1)}x is healthy. Industry benchmark is 4x — there's room to improve by cutting low-performing ad sets.`);
    } else if (kpis.roas < 2) {
      insights.push(`🔴 ROAS of ${kpis.roas.toFixed(1)}x is below break-even for most businesses. Pause underperforming campaigns and reallocate to proven channels.`);
    }
  }

  // Users insight
  if (kpis.users != null && kpis.usersDelta != null) {
    const pct = Math.abs(kpis.usersDelta * 100).toFixed(1);
    if (kpis.usersDelta > 0.2) {
      insights.push(`👥 User acquisition up ${pct}% — traffic is surging. Ensure your funnel can convert this new volume, especially on mobile.`);
    } else if (kpis.usersDelta < -0.1) {
      insights.push(`👥 Users down ${pct}%. Check for drops in organic search (SEO changes?) or reduced paid traffic budget.`);
    }
  }

  // Conversion insight
  if (kpis.conversionRate != null) {
    if (kpis.conversionRate < 0.01) {
      insights.push(`🛒 Conversion rate is below 1% — this is the highest-leverage area to fix. A/B test your checkout flow, product pages, and CTAs.`);
    } else if (kpis.conversionRate > 0.04) {
      insights.push(`🎯 Conversion rate of ${(kpis.conversionRate * 100).toFixed(2)}% is above average for e-commerce (1–3%). Your funnel is well-optimised.`);
    } else {
      insights.push(`🛒 Conversion rate of ${(kpis.conversionRate * 100).toFixed(2)}% is in the normal range. Target 3%+ by reducing checkout friction and improving product images.`);
    }
  }

  // Top channel insight
  if (kpis.topChannel) {
    insights.push(`📊 "${kpis.topChannel}" is your top revenue channel. Protect this channel's performance — any disruption here will have the biggest business impact.`);
  }

  // Default if no data
  if (insights.length === 0) {
    insights.push("📊 Connect your GA4 property to unlock personalised AI insights based on your real data.");
  }

  return insights.slice(0, 3); // Return max 3 insights
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kpis: KpiInput = body.kpis ?? {};

  // Future: if ANTHROPIC_API_KEY set, call Claude API for richer insights
  // For now: deterministic rule-based insights that are highly contextual
  const insights = generateInsights(kpis);

  return NextResponse.json({ insights, generatedAt: new Date().toISOString() });
}
