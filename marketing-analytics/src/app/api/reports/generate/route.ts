/**
 * POST /api/reports/generate
 * Generates a full narrative AI marketing report.
 *
 * If ANTHROPIC_API_KEY is set, calls Claude. Otherwise uses a detailed rule-based fallback.
 * Returns: { title, period, sections: [{ heading, body }][], generatedAt }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ReportInput {
  period?: string;
  sessions?: number;
  revenue?: number;
  conversions?: number;
  conversionRate?: number;
  bounceRate?: number;
  topChannel?: string;
  topChannelShare?: number;
  roas?: number;
  cac?: number;
  previousRevenue?: number;
  previousSessions?: number;
  propertyName?: string;
}

function pct(v: number) {
  return v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`;
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function generateRuleBasedReport(input: ReportInput) {
  const {
    period = "last 30 days",
    sessions = 0,
    revenue = 0,
    conversions = 0,
    conversionRate = 0,
    bounceRate = 0,
    topChannel = "Organic",
    topChannelShare = 0,
    roas,
    cac,
    previousRevenue,
    previousSessions,
    propertyName = "your site",
  } = input;

  const revGrowth = previousRevenue && previousRevenue > 0
    ? ((revenue - previousRevenue) / previousRevenue) * 100
    : null;
  const sessionGrowth = previousSessions && previousSessions > 0
    ? ((sessions - previousSessions) / previousSessions) * 100
    : null;

  const revenueHealth = revGrowth === null ? "neutral" : revGrowth >= 10 ? "strong" : revGrowth >= 0 ? "steady" : "declining";
  const crHealth = conversionRate >= 3.5 ? "strong" : conversionRate >= 2 ? "average" : "below-average";
  const brHealth = bounceRate <= 45 ? "good" : bounceRate <= 60 ? "average" : "high";

  const sections = [
    {
      heading: "Executive Summary",
      body: `During the ${period}, ${propertyName} recorded ${fmt(sessions)} sessions and generated £${revenue.toLocaleString()} in revenue across ${fmt(conversions)} conversions.${
        revGrowth !== null
          ? ` Revenue ${revGrowth >= 0 ? "grew" : "fell"} by ${pct(revGrowth)} compared to the prior period, indicating a ${revenueHealth} trajectory.`
          : ""
      } The overall conversion rate stood at ${conversionRate.toFixed(2)}%, which is ${crHealth === "strong" ? "above industry average — a strong result" : crHealth === "average" ? "in line with industry norms" : "below the typical 2–4% benchmark and warrants attention"}. ${topChannel} was the dominant acquisition channel, accounting for ${topChannelShare.toFixed(0)}% of all traffic.`,
    },
    {
      heading: "Traffic & Acquisition",
      body: `${sessionGrowth !== null ? `Session volume ${sessionGrowth >= 0 ? "increased" : "decreased"} by ${pct(sessionGrowth)} period-over-period, reaching ${fmt(sessions)} total visits.` : `Total sessions for the period reached ${fmt(sessions)}.`} ${topChannel} drove the majority of visits at ${topChannelShare.toFixed(0)}%, suggesting ${
        topChannel.toLowerCase().includes("organic") || topChannel.toLowerCase().includes("seo")
          ? "strong content authority — continue investing in SEO and content production"
          : topChannel.toLowerCase().includes("paid") || topChannel.toLowerCase().includes("cpc")
          ? "healthy paid channel performance; validate ROAS to ensure spend efficiency"
          : "a reliance on this channel — consider diversifying to reduce concentration risk"
      }. The bounce rate of ${bounceRate.toFixed(1)}% is ${brHealth === "good" ? "healthy, indicating engaged visitors" : brHealth === "average" ? "typical, though improving landing page relevance could lift it further" : "elevated — landing pages may not be matching visitor intent, which is reducing engagement and conversion potential"}.`,
    },
    {
      heading: "Revenue & Conversion Performance",
      body: `The ${conversionRate.toFixed(2)}% conversion rate ${crHealth === "strong" ? "is performing above the industry average of 2–3.5%, reflecting a well-optimised funnel" : crHealth === "average" ? "sits in line with industry averages; targeted A/B tests on the checkout flow or landing pages could push this to 3.5%+" : "is below industry benchmarks. Priority actions include improving page load speed, simplifying the checkout process, and A/B testing CTA copy and placement"}. With ${fmt(conversions)} conversions generating £${revenue.toLocaleString()}, the average revenue per conversion is £${(conversions > 0 ? revenue / conversions : 0).toFixed(2)}.${
        roas !== undefined ? ` Return on ad spend (ROAS) of ${roas.toFixed(1)}× is ${roas >= 4 ? "strong — every £1 in ad spend is returning £" + roas.toFixed(1) : roas >= 2 ? "moderate; optimising ad targeting and creative could push this above 4×" : "below target; consider pausing underperforming campaigns and reallocating budget"}.` : ""
      }${cac !== undefined ? ` Customer acquisition cost of £${cac.toFixed(0)} ${cac <= 30 ? "is efficient for this market" : cac <= 60 ? "is moderate; look for ways to improve funnel quality" : "is elevated and should be reduced by improving landing page conversion or lowering CPCs"}.` : ""}`,
    },
    {
      heading: "Key Opportunities",
      body: [
        crHealth !== "strong"
          ? "1. **Conversion optimisation**: Run A/B tests on your primary landing pages and checkout flow. Even a 0.5pp lift in conversion rate would meaningfully increase revenue without additional traffic spend."
          : "1. **Scale winning traffic**: Your conversion rate is strong. Focus on scaling the top-performing paid channels and content types to drive more qualified sessions.",
        brHealth === "high"
          ? "2. **Reduce bounce rate**: Review the top entry pages by bounce rate. Ensure messaging matches the ad or organic keyword that brought the visitor in."
          : "2. **Expand audience reach**: Bounce rate is healthy, suggesting good landing page/audience alignment. Test new audience segments and lookalikes.",
        topChannelShare > 60
          ? `3. **Diversify acquisition**: ${topChannel} represents over 60% of traffic. Build out one or two additional channels to reduce dependency and increase resilience.`
          : "3. **Double down on what's working**: Your traffic mix is reasonably diversified. Invest more in your top 1–2 channels to deepen their contribution.",
        "4. **Automated reporting**: Set up weekly KPI alerts (via the Alerts section) so you catch dips in conversion rate or revenue within 24 hours rather than at the end of the month.",
      ].join("\n\n"),
    },
    {
      heading: "Recommended Next Steps",
      body: `Based on this ${period} performance, the following actions are recommended for the next 30 days:\n\n• Review and pause the bottom 20% of paid keywords/ad sets by CPA.\n• Implement a re-engagement email sequence for cart abandoners (if not already active).\n• Publish at least two long-form content pieces targeting high-intent keywords.\n• Set up KPI alert thresholds in Nexoryx One for conversion rate, sessions, and revenue.\n• Schedule a weekly PDF report to be sent to all stakeholders to maintain alignment.`,
    },
  ];

  return {
    title: `Marketing Performance Report — ${period.charAt(0).toUpperCase() + period.slice(1)}`,
    period,
    propertyName,
    sections,
    generatedAt: new Date().toISOString(),
    model: "rule-based",
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: ReportInput = await req.json().catch(() => ({}));

  // ── Try Claude if key is set ──────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const prompt = `You are a senior marketing analyst. Write a professional marketing performance report based on the following data:

Period: ${body.period ?? "last 30 days"}
Property: ${body.propertyName ?? "the client site"}
Sessions: ${body.sessions ?? 0}
Revenue: £${body.revenue ?? 0}
Conversions: ${body.conversions ?? 0}
Conversion Rate: ${body.conversionRate ?? 0}%
Bounce Rate: ${body.bounceRate ?? 0}%
Top Channel: ${body.topChannel ?? "Unknown"} (${body.topChannelShare ?? 0}% of traffic)
${body.roas !== undefined ? `ROAS: ${body.roas}×` : ""}
${body.cac !== undefined ? `CAC: £${body.cac}` : ""}
${body.previousRevenue !== undefined ? `Previous Period Revenue: £${body.previousRevenue}` : ""}
${body.previousSessions !== undefined ? `Previous Period Sessions: ${body.previousSessions}` : ""}

Write exactly 5 sections with these headings (use them exactly):
1. Executive Summary
2. Traffic & Acquisition
3. Revenue & Conversion Performance
4. Key Opportunities
5. Recommended Next Steps

Each section should be 3-5 sentences of professional, data-driven analysis. Do not use markdown headers — just the section content. Return as JSON: { "sections": [{ "heading": "...", "body": "..." }] }`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.sections?.length >= 3) {
            return NextResponse.json({
              title: `Marketing Performance Report — ${body.period ?? "Last 30 Days"}`,
              period: body.period ?? "last 30 days",
              propertyName: body.propertyName ?? "your site",
              sections: parsed.sections,
              generatedAt: new Date().toISOString(),
              model: "claude-3-haiku",
            });
          }
        }
      }
    } catch {
      // Fall through to rule-based
    }
  }

  // ── Rule-based fallback ───────────────────────────────────────────────────
  const report = generateRuleBasedReport(body);
  return NextResponse.json(report);
}
