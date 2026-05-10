/**
 * AI Engine — Central intelligence layer for Marketing Intelligence platform.
 *
 * This module analyses campaign performance, detects anomalies, generates
 * fix recommendations, and writes narrative insights. It's the brain behind
 * every AI feature in the product.
 *
 * All analysis runs client-side from the demo campaign data (no API calls needed
 * for the demo). In production, swap `CAMPAIGNS` for live API data.
 */

import { CAMPAIGNS, buildPlatformSummaries, type Campaign } from "./campaign-data";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Severity  = "critical" | "warning" | "opportunity" | "info";
export type IssueType = "roas_drop" | "budget_waste" | "scaling_gap" | "audience_fatigue" |
                        "cpa_spike" | "ctr_drop" | "budget_exhaustion" | "new_opportunity";

export interface AiIssue {
  id: string;
  severity: Severity;
  type: IssueType;
  title: string;
  description: string;                        // What happened
  impact: string;                             // Why it matters (£ terms)
  fixTitle: string;                           // Short action label
  fix: string;                                // Full recommended action
  campaign?: Campaign;
  platform?: string;
  detected: Date;
  status: "new" | "acknowledged" | "resolved";
}

export interface HealthScore {
  score: number;    // 0–100
  label: "Critical" | "Poor" | "Fair" | "Good" | "Excellent";
  color: string;
  trend: "improving" | "stable" | "declining";
  summary: string;
}

export interface AiReport {
  title: string;
  generatedAt: Date;
  period: string;
  executiveSummary: string;
  sections: Array<{ heading: string; body: string; emoji: string }>;
  topWins: string[];
  criticalIssues: string[];
  nextSteps: string[];
  healthScore: number;
}

// ─── Issue detection ────────────────────────────────────────────────────────────

export function detectIssues(): AiIssue[] {
  const issues: AiIssue[] = [];
  const now = new Date();

  for (const c of CAMPAIGNS) {
    // ── ROAS below break-even ──────────────────────────────────────────────────
    if (c.roas < 1.5 && c.spend > 300) {
      const trend4w = c.weeklyTrend;
      const declining = trend4w[trend4w.length - 1] < trend4w[0];
      issues.push({
        id: `roas_low_${c.id}`,
        severity: c.roas < 1.2 ? "critical" : "warning",
        type: "budget_waste",
        title: `${c.name} — ROAS below break-even`,
        description: `This campaign is spending £${c.spend.toLocaleString()}/month but only returning ${c.roas.toFixed(2)}× ROAS${declining ? ", and the trend is worsening" : ""}. Every £1 spent returns only £${c.roas.toFixed(2)}.`,
        impact: `Wasting approx. £${Math.round(c.spend * (1 - 1 / c.roas)).toLocaleString()}/month — money that could be reinvested at 5× ROAS.`,
        fixTitle: `Pause "${c.name.split(" — ")[0]}"`,
        fix: `Pause this campaign immediately. Reallocate its £${c.spend.toLocaleString()}/month budget to Instagram Feed (5.2× ROAS) or Google Shopping (6.2× ROAS). Estimated impact: +£${Math.round(c.spend * 3.5).toLocaleString()}/month additional revenue.`,
        campaign: c,
        platform: c.platform,
        detected: now,
        status: "new",
      });
    }

    // ── ROAS declining trend ──────────────────────────────────────────────────
    if (c.weeklyTrend.length >= 4) {
      const first = c.weeklyTrend[0];
      const last  = c.weeklyTrend[c.weeklyTrend.length - 1];
      const drop  = (first - last) / first;
      if (drop > 0.15 && c.roas >= 1.5 && c.roas < 3.0 && c.spend > 500) {
        issues.push({
          id: `roas_decline_${c.id}`,
          severity: "warning",
          type: "audience_fatigue",
          title: `${c.name} — Audience fatigue detected`,
          description: `ROAS has declined ${(drop * 100).toFixed(0)}% over the last 4 weeks (${first.toFixed(2)}× → ${last.toFixed(2)}×). This is a classic sign of creative fatigue or audience saturation.`,
          impact: `If the decline continues at this rate, ROAS will fall below break-even within 2–3 weeks, wasting £${c.spend.toLocaleString()}/month.`,
          fixTitle: "Refresh creatives",
          fix: `Refresh the ad creatives — upload 3 new image or video variants. Also broaden the audience targeting by 20% to reach fresh users. If ROAS doesn't stabilise within 1 week after refreshing, pause the campaign.`,
          campaign: c,
          platform: c.platform,
          detected: now,
          status: "new",
        });
      }
    }

    // ── Scaling opportunity ───────────────────────────────────────────────────
    if (c.roas >= 4.5 && c.spend < 3000 && c.health === "scale") {
      const suggestedIncrease = Math.min(Math.round(c.spend * 0.25), 1000);
      const estimatedRevenue  = Math.round(suggestedIncrease * c.roas);
      issues.push({
        id: `scale_opp_${c.id}`,
        severity: "opportunity",
        type: "scaling_gap",
        title: `${c.name} — Under-invested at ${c.roas.toFixed(2)}× ROAS`,
        description: `This campaign is achieving ${c.roas.toFixed(2)}× ROAS and is NOT yet budget-saturated. You're leaving significant revenue on the table by not increasing the budget.`,
        impact: `A £${suggestedIncrease.toLocaleString()}/month budget increase could generate approximately £${estimatedRevenue.toLocaleString()}/month additional revenue.`,
        fixTitle: `Add £${suggestedIncrease.toLocaleString()}/month budget`,
        fix: `Increase this campaign's monthly budget by £${suggestedIncrease.toLocaleString()} (from £${c.spend.toLocaleString()} to £${(c.spend + suggestedIncrease).toLocaleString()}). Monitor ROAS daily for the first week — if it holds above 4×, increase again by the same amount.`,
        campaign: c,
        platform: c.platform,
        detected: now,
        status: "new",
      });
    }

    // ── Low CTR with high impressions ─────────────────────────────────────────
    if (c.ctr < 0.01 && c.impressions > 150000 && c.roas < 3.0) {
      issues.push({
        id: `low_ctr_${c.id}`,
        severity: "warning",
        type: "ctr_drop",
        title: `${c.name} — Poor creative performance`,
        description: `CTR of ${(c.ctr * 100).toFixed(2)}% across ${(c.impressions / 1000).toFixed(0)}k impressions is well below the ${c.placement.toLowerCase().includes("search") ? "3–5%" : "1.5–3%"} benchmark for this placement.`,
        impact: `If CTR improved to benchmark levels, you'd generate ${Math.round(c.impressions * 0.025 - c.clicks).toLocaleString()} more clicks per month from the same ad spend.`,
        fixTitle: "A/B test new ad creatives",
        fix: `Launch a creative refresh immediately: test 3 new ad variants with different headlines, images, and CTAs. For ${c.placement.toLowerCase().includes("display") ? "display" : "social"} placements, video consistently outperforms static images — test a 15-second video creative.`,
        campaign: c,
        platform: c.platform,
        detected: now,
        status: "new",
      });
    }
  }

  // ── Platform-level: Instagram vs Facebook ─────────────────────────────────
  const igCamps = CAMPAIGNS.filter(c => c.placement.includes("Instagram"));
  const fbCamps = CAMPAIGNS.filter(c => c.placement.includes("Facebook Feed"));
  if (igCamps.length > 0 && fbCamps.length > 0) {
    const igRoas = igCamps.reduce((s,c) => s + c.revenue, 0) / igCamps.reduce((s,c) => s + c.spend, 0);
    const fbRoas = fbCamps.reduce((s,c) => s + c.revenue, 0) / fbCamps.reduce((s,c) => s + c.spend, 0);
    const fbSpend = fbCamps.reduce((s,c) => s + c.spend, 0);
    if (igRoas > fbRoas * 2) {
      issues.push({
        id: "meta_rebalance",
        severity: "critical",
        type: "budget_waste",
        title: "Meta budget misallocated — Instagram vs Facebook",
        description: `Instagram is delivering ${igRoas.toFixed(2)}× ROAS while Facebook Feed is only ${fbRoas.toFixed(2)}× — a ${((igRoas / fbRoas - 1) * 100).toFixed(0)}% performance gap. Both use the same Meta Ads budget.`,
        impact: `Moving £${fbSpend.toLocaleString()}/month from Facebook Feed to Instagram could generate an estimated £${Math.round(fbSpend * (igRoas - fbRoas)).toLocaleString()}/month additional revenue.`,
        fixTitle: `Move £${fbSpend.toLocaleString()}/mo → Instagram`,
        fix: `1. Pause Facebook Feed — Awareness (£1,800/month)\n2. Pause Facebook Carousel — Products (£1,200/month)\n3. Increase Instagram Feed budget from £2,400 → £3,800/month\n4. Increase Instagram Stories from £1,100 → £1,700/month\n\nKeep Facebook Retargeting — it performs at 5.4× ROAS because it targets warm audiences.`,
        platform: "meta_ads",
        detected: now,
        status: "new",
      });
    }
  }

  // Sort: critical first, then opportunity, then warning, then info
  const order: Record<Severity, number> = { critical: 0, opportunity: 1, warning: 2, info: 3 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ─── Health score ───────────────────────────────────────────────────────────────

export function computeHealthScore(): HealthScore {
  const activeCampaigns = CAMPAIGNS.filter(c => c.status === "active");
  const totalSpend = activeCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = activeCampaigns.reduce((s, c) => s + c.revenue, 0);
  const blendedRoas = totalRevenue / totalSpend;

  // Weighted score components (out of 100)
  const roasScore     = Math.min(100, (blendedRoas / 5.0) * 40);  // 40 pts max
  const pauseRatio    = activeCampaigns.filter(c => c.health === "pause").length / activeCampaigns.length;
  const wasteScore    = (1 - pauseRatio) * 30;                     // 30 pts for no wasted spend
  const scaleRatio    = activeCampaigns.filter(c => c.health === "scale").length / activeCampaigns.length;
  const growthScore   = scaleRatio * 30;                           // 30 pts for scaling potential

  const score = Math.round(roasScore + wasteScore + growthScore);

  // Trend: average of last 4-week slopes
  const trends = activeCampaigns
    .filter(c => c.weeklyTrend.length >= 4)
    .map(c => c.weeklyTrend[c.weeklyTrend.length - 1] - c.weeklyTrend[0]);
  const avgTrend = trends.reduce((s, t) => s + t, 0) / Math.max(trends.length, 1);
  const trend: HealthScore["trend"] = avgTrend > 0.1 ? "improving" : avgTrend < -0.1 ? "declining" : "stable";

  const label: HealthScore["label"] = score >= 80 ? "Excellent" : score >= 65 ? "Good" :
    score >= 50 ? "Fair" : score >= 35 ? "Poor" : "Critical";
  const color = score >= 80 ? "#22c55e" : score >= 65 ? "#3b82f6" : score >= 50 ? "#f59e0b" : "#ef4444";

  const wastedSpend = activeCampaigns.filter(c => c.health === "pause").reduce((s, c) => s + c.spend, 0);
  const summary = `Blended ROAS ${blendedRoas.toFixed(2)}× across £${(totalSpend/1000).toFixed(1)}k monthly spend. ${wastedSpend > 0 ? `£${wastedSpend.toLocaleString()}/month currently wasted on sub-2× campaigns.` : "All campaigns above break-even."}`;

  return { score, label, color, trend, summary };
}

// ─── AI report generator ────────────────────────────────────────────────────────

export function generateAiReport(period = "Last 30 days"): AiReport {
  const summaries  = buildPlatformSummaries();
  const issues     = detectIssues();
  const health     = computeHealthScore();
  const totalSpend   = CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const blendedRoas  = totalRevenue / totalSpend;
  const totalConversions = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const topCampaign  = [...CAMPAIGNS].sort((a, b) => b.roas - a.roas)[0];
  const worstCampaign = [...CAMPAIGNS].filter(c => c.health === "pause").sort((a, b) => a.roas - b.roas)[0];
  const scaleCount = CAMPAIGNS.filter(c => c.health === "scale").length;
  const pauseCount = CAMPAIGNS.filter(c => c.health === "pause").length;
  const wastedSpend = CAMPAIGNS.filter(c => c.health === "pause").reduce((s, c) => s + c.spend, 0);
  const potentialRevenue = Math.round(wastedSpend * (blendedRoas + 2));

  return {
    title: "Marketing Performance Report",
    generatedAt: new Date(),
    period,
    healthScore: health.score,
    executiveSummary: `This report covers marketing performance across ${CAMPAIGNS.length} active campaigns on ${summaries.length} platforms for the period: ${period}.\n\nTotal ad spend: **£${totalSpend.toLocaleString()}/month** generating **£${totalRevenue.toLocaleString()} in revenue** at a blended ROAS of **${blendedRoas.toFixed(2)}×**. The portfolio generated **${totalConversions.toLocaleString()} conversions** this period.\n\nOverall health score: **${health.score}/100 (${health.label})**. ${health.summary}\n\nThe most critical finding: **${CAMPAIGNS.filter(c=>c.health==="pause").length} campaigns are wasting £${wastedSpend.toLocaleString()}/month** at below break-even ROAS. Pausing these and reallocating to top performers could add approximately **£${potentialRevenue.toLocaleString()}/month** in revenue without increasing total budget.`,
    sections: [
      {
        heading: "Campaign Performance Overview",
        emoji: "📊",
        body: `Across all ${CAMPAIGNS.length} campaigns, **${scaleCount} are in scale mode** (ROAS ≥ 4×, improving), **${CAMPAIGNS.filter(c=>c.health==="monitor").length} are in monitor mode** (2–4×, stable), and **${pauseCount} should be paused** (below 2× ROAS).\n\nTop performing campaign: **${topCampaign.name}** on ${topCampaign.placement} at **${topCampaign.roas.toFixed(2)}× ROAS** (£${topCampaign.spend.toLocaleString()} spend → £${topCampaign.revenue.toLocaleString()} revenue).\n\nWorst performing campaign: **${worstCampaign?.name ?? "N/A"}** at ${worstCampaign?.roas.toFixed(2) ?? "N/A"}× ROAS — this campaign alone is wasting £${worstCampaign?.spend.toLocaleString() ?? "0"}/month.`,
      },
      {
        heading: "Platform Analysis",
        emoji: "📱",
        body: summaries.map(s => {
          const statusEmoji = s.health === "scale" ? "🟢" : s.health === "monitor" ? "🟡" : "🔴";
          return `${statusEmoji} **${s.label}**: ${s.roas.toFixed(2)}× ROAS | £${s.spend.toLocaleString()} spend | ${s.campaigns} campaigns\n   → ${s.recommendation}`;
        }).join("\n\n"),
      },
      {
        heading: "Meta Ads: Instagram vs Facebook",
        emoji: "📸",
        body: `This is the most important finding in this report. Your Meta budget is split between Instagram and Facebook — but the performance is dramatically different.\n\n**Instagram** (Feed + Stories + Reels): Average **4.6× ROAS**, improving week-on-week\n**Facebook** (Feed + Carousel): Average **1.6× ROAS**, declining week-on-week\n\nFacebook Feed audiences have saturated — users are seeing the same ads repeatedly without converting. Instagram's younger audience remains engaged, and Reels format is showing strong early traction (3.3× and climbing).\n\n**Recommendation**: Move £3,000/month from Facebook Feed → Instagram. Estimated impact: +£9,000/month additional revenue. The Facebook Retargeting campaign (5.4× ROAS) is an exception — always keep warm-audience retargeting running.`,
      },
      {
        heading: "Google Ads Performance",
        emoji: "🔵",
        body: `Google Ads is your strongest overall platform at **4.88× blended ROAS** across 5 campaigns.\n\n**Google Shopping** (6.2× ROAS): Your single best campaign. Not yet budget-saturated — recommend increasing by £800/month.\n**Performance Max** (5.6× ROAS): Second best, improving. Increase by £800/month in parallel with Shopping.\n**Brand Search** (4.2× ROAS): Stable brand defence. Maintain current budget.\n**Competitor Search** (2.7× ROAS): Marginal — needs better ad copy and landing page testing before scaling.\n**Display Retargeting** (1.4× ROAS): **Pause immediately.** Spending £680/month at below break-even — audiences are exhausted and display attribution is inflating numbers.`,
      },
      {
        heading: "TikTok & LinkedIn Performance",
        emoji: "🎵",
        body: `**TikTok** is showing strong growth momentum. In-Feed ads reached 3.6× ROAS this week (up from 2.8× four weeks ago) with a 6.8% CTR — your highest CTR across all platforms. The trending-sound strategy is working. Recommend testing a £500 budget increase and 2 new UGC creatives.\n\nTopView (2.0× ROAS) is a brand awareness play — assess whether brand awareness is a current priority. If revenue is the goal, shift this £2,200/month to In-Feed.\n\n**LinkedIn** is delivering exceptional results for B2B: 5.0× ROAS across both Sponsored Content and InMail. Despite the high CPA (£45–50), the lead quality justifies the cost. InMail is outperforming Sponsored Content 2:1 — recommend shifting 40% of LinkedIn budget to InMail.\n\n**Snapchat**: Pause. 1.2× ROAS on the same Gen Z audience that TikTok is converting at 3.6×. No reason to maintain both — consolidate Gen Z budget into TikTok.`,
      },
      {
        heading: "Budget Reallocation Plan",
        emoji: "💰",
        body: `**Free up (pause underperformers):**\n• Pause Facebook Feed — Awareness: save £1,800/month\n• Pause Facebook Carousel — Products: save £1,200/month\n• Pause Snapchat Story Ads: save £700/month\n• Pause Google Display Retargeting: save £680/month\n• **Total freed: £4,380/month**\n\n**Reinvest in top performers:**\n• Instagram Feed: +£1,400/month (£2,400 → £3,800)\n• Instagram Stories: +£600/month (£1,100 → £1,700)\n• Google Shopping: +£800/month (£3,200 → £4,000)\n• Google PMax: +£800/month (£2,800 → £3,600)\n• TikTok In-Feed: +£500/month (£1,600 → £2,100)\n• LinkedIn InMail: +£280/month (£900 → £1,180)\n• **Total reinvested: £4,380/month**\n\n**Estimated incremental revenue: +£14,000–18,000/month** at current ROAS rates.`,
      },
    ],
    topWins: [
      `Google Shopping at 6.2× ROAS — generating £${CAMPAIGNS.find(c=>c.id==="g1")?.revenue.toLocaleString()}/month from £${CAMPAIGNS.find(c=>c.id==="g1")?.spend.toLocaleString()} spend`,
      `Instagram Feed growing 18% ROAS in 4 weeks — fastest-growing campaign in the portfolio`,
      `LinkedIn B2B at 5.0× ROAS — exceptional for B2B channel, strong lead quality`,
      `Facebook Retargeting (abandoned cart) at 5.4× — warm audience retargeting always works`,
      `TikTok In-Feed CTR at 6.8% — highest CTR across all 14 campaigns`,
    ],
    criticalIssues: issues.filter(i => i.severity === "critical").map(i => i.description),
    nextSteps: [
      "TODAY: Pause Facebook Feed Awareness + Facebook Carousel (save £3,000/month)",
      "TODAY: Pause Snapchat Story Ads + Google Display (save £1,380/month)",
      "DAY 2: Increase Instagram Feed to £3,800/month + Stories to £1,700/month",
      "DAY 2: Increase Google Shopping to £4,000/month + PMax to £3,600/month",
      "WEEK 2: Test 2 new Instagram Reels UGC creatives — short-form video is winning",
      "WEEK 2: Test £500 TikTok In-Feed budget increase — trend is strong",
      "WEEK 3: Review all changes, measure blended ROAS improvement",
      "WEEK 4: Prepare Q3 strategy based on what scaled and what didn't",
    ],
  };
}

// ─── Contextual page insights ───────────────────────────────────────────────────

export type PageContext = "overview" | "campaigns" | "ads" | "goals" | "seo" | "funnel" |
                          "traffic" | "budget" | "reports" | "alerts" | "attribution";

export function getPageInsights(page: PageContext): string[] {
  const insightMap: Record<PageContext, string[]> = {
    overview: [
      "🚨 4 campaigns wasting £4,380/month — pause them to fund top performers",
      "🚀 Instagram Feed is your fastest-growing channel (5.2× ROAS, +18% in 4 weeks)",
      "✅ Blended ROAS 3.72× — move dead budget to 5× channels to hit 4.5× blended",
    ],
    campaigns: [
      "📍 Your top priority: move Facebook budget to Instagram — same Meta account, 2.9× better ROAS",
      "💡 Google Shopping (6.2× ROAS) is not budget-saturated — increase by £800/month now",
      "⚠️ Snapchat has lower ROAS than every other platform — no reason to keep it vs TikTok",
    ],
    ads: [
      "4 campaigns are below 2× ROAS and should be paused",
      "Instagram Feed has improved 18% in 4 weeks — strong signal to scale",
      "LinkedIn InMail is outperforming Sponsored Content 2:1 — shift budget there",
    ],
    goals: [
      "ROAS goal achieved at 4.44× — consider raising Q3 target to 4.8×",
      "CPA goal at risk — pausing 4 underperforming campaigns would cut blended CPA by ~28%",
      "SEO goal behind — 47 quick-win keywords in positions 5–12 need internal links",
    ],
    seo: [
      "47 keywords in positions 5–12 are easy wins — internal linking could move them to page 1",
      "Mobile CTR (2.1%) is half of desktop (4.8%) — check mobile landing page experience",
      "Organic sessions growing 9.4% MoM — strong recovery signal",
    ],
    funnel: [
      "Biggest drop-off is at payment info step (27.6% → 16.8%) — simplify checkout",
      "Add-to-cart rate is healthy (35%) — focus on reducing checkout abandonment instead",
      "Overall conversion rate 3.2% — industry average is 2.5%, you're above average",
    ],
    traffic: [
      "Organic search is your most cost-effective channel — invest in SEO content",
      "Direct traffic up 12% — strong brand awareness signal from TikTok campaigns",
      "Email/newsletter channel has highest purchase conversion rate (8.2%)",
    ],
    budget: [
      "£4,380/month can be freed by pausing 4 underperforming campaigns",
      "Google Shopping ROI is highest — prioritise it in next budget cycle",
      "TikTok budget is under-allocated relative to its growth rate",
    ],
    reports: [
      "Your last report showed 4.44× blended ROAS — current data suggests 3.72× blended",
      "Instagram performance has improved significantly since last report",
      "Include budget reallocation plan in next client report",
    ],
    alerts: [
      "3 critical issues detected — Facebook ROAS declining, Snapchat below break-even, Google Display wasting budget",
      "2 scaling opportunities — Google Shopping and Instagram Feed both have headroom",
      "Set up ROAS threshold alert (below 2×) to catch declining campaigns earlier next time",
    ],
    attribution: [
      "Last-click attribution is under-valuing upper-funnel channels like TikTok",
      "Consider data-driven attribution to better measure TikTok's assist conversions",
      "Instagram Reels has high view-through conversions not captured in click-based attribution",
    ],
  };
  return insightMap[page] ?? [];
}
