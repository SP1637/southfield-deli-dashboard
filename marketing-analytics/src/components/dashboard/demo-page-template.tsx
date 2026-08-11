"use client";

import { PageHeader, PageContent } from "./page-header";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Monthly trend data ────────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function makeTrend(base: number, variance = 0.15, uptrend = true): number[] {
  return MONTHS.map((_, i) => {
    const trend = uptrend ? 1 + (i / MONTHS.length) * 0.4 : 1 - (i / MONTHS.length) * 0.15;
    const noise = 1 + (Math.random() * variance * 2 - variance);
    return Math.round(base * trend * noise);
  });
}

// ─── Page configs ──────────────────────────────────────────────────────────────
interface KPI {
  label: string;
  value: string;
  change: string;
  up: boolean | null;
}
interface Insight {
  type: "good" | "warn" | "info";
  text: string;
}
interface PageConfig {
  kpis: KPI[];
  chartLabel: string;
  chartData: { name: string; primary: number; secondary?: number }[];
  chartPrimaryKey: string;
  chartSecondaryKey?: string;
  insights: Insight[];
  tableHeaders: string[];
  tableRows: string[][];
}

function seed(title: string): number {
  return title.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  "Marketing Score": {
    kpis: [
      { label: "Overall Score", value: "78 / 100", change: "+6 pts vs last month", up: true },
      { label: "Channel Health", value: "82%", change: "+3% this month", up: true },
      { label: "Content Quality", value: "74%", change: "-2% this month", up: false },
      { label: "Audience Reach", value: "91%", change: "+8% this month", up: true },
    ],
    chartLabel: "Marketing Score Trend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 58 + i * 1.8 + (i % 3 === 0 ? -2 : 1), secondary: 70 + i * 0.8 })),
    chartPrimaryKey: "Your Score",
    chartSecondaryKey: "Industry Avg",
    insights: [
      { type: "good", text: "Paid Search score improved 12 pts after bid strategy update" },
      { type: "warn", text: "Email open rate dragging Content Quality score down — review subject lines" },
      { type: "info", text: "Overall score is in top 25% of companies in your category" },
    ],
    tableHeaders: ["Channel", "Score", "vs Last Month", "Status"],
    tableRows: [
      ["Google Ads", "88", "+5", "Excellent"],
      ["Meta Ads", "81", "+2", "Good"],
      ["SEO", "76", "+7", "Good"],
      ["Email Marketing", "63", "-4", "Needs Work"],
      ["Social Media", "79", "+1", "Good"],
    ],
  },
  "Executive Dashboard": {
    kpis: [
      { label: "Total Revenue", value: "£2.4M", change: "+18% YoY", up: true },
      { label: "Marketing ROI", value: "4.2×", change: "+0.3× vs Q2", up: true },
      { label: "New Customers", value: "3,847", change: "+22% this quarter", up: true },
      { label: "Churn Rate", value: "2.1%", change: "-0.4% this quarter", up: true },
    ],
    chartLabel: "Revenue vs Marketing Spend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 150000 + i * 18000 + (i % 4 === 0 ? -10000 : 5000), secondary: 32000 + i * 2000 })),
    chartPrimaryKey: "Revenue",
    chartSecondaryKey: "Spend",
    insights: [
      { type: "good", text: "Q3 revenue hit record high — £2.4M, 18% above target" },
      { type: "good", text: "Customer acquisition cost down 14% through better channel mix" },
      { type: "warn", text: "Europe segment underperforming — consider regional campaign push" },
    ],
    tableHeaders: ["Metric", "Jul", "Aug (proj)", "Target", "Status"],
    tableRows: [
      ["Revenue", "£287K", "£312K", "£300K", "On Track"],
      ["New Customers", "542", "589", "560", "Ahead"],
      ["MQL to SQL", "34%", "37%", "35%", "On Track"],
      ["CAC", "£82", "£78", "£85", "Ahead"],
    ],
  },
  "Revenue Intelligence": {
    kpis: [
      { label: "Monthly Revenue", value: "£287,450", change: "+14% MoM", up: true },
      { label: "Revenue per Customer", value: "£624", change: "+8% MoM", up: true },
      { label: "Recurring Revenue", value: "£198K", change: "+21% MoM", up: true },
      { label: "Revenue at Risk", value: "£12.4K", change: "-£3.1K vs last month", up: true },
    ],
    chartLabel: "Monthly Revenue",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 180000 + i * 11000 + (i % 3 === 0 ? 8000 : -2000) })),
    chartPrimaryKey: "Revenue",
    insights: [
      { type: "good", text: "SaaS tier upgrades drove £28K incremental revenue in Jul" },
      { type: "good", text: "Churn impact reduced by £3.1K after win-back campaign" },
      { type: "info", text: "Revenue on track to hit £3.2M annual target (currently at 68%)" },
    ],
    tableHeaders: ["Revenue Stream", "This Month", "Last Month", "Growth"],
    tableRows: [
      ["New Business", "£98K", "£84K", "+16.7%"],
      ["Expansion Revenue", "£71K", "£65K", "+9.2%"],
      ["Renewal Revenue", "£105K", "£98K", "+7.1%"],
      ["One-off Services", "£14K", "£19K", "-26.3%"],
    ],
  },
  "ROI": {
    kpis: [
      { label: "Blended ROI", value: "4.2×", change: "+0.3× vs last month", up: true },
      { label: "Total Ad Spend", value: "£68,400", change: "+12% MoM", up: null },
      { label: "Revenue Generated", value: "£287K", change: "+18% MoM", up: true },
      { label: "Profit Margin", value: "38%", change: "+2% MoM", up: true },
    ],
    chartLabel: "ROI by Channel",
    chartData: [
      { name: "Google Ads", primary: 5.8, secondary: 4.2 },
      { name: "Meta Ads", primary: 3.4, secondary: 4.2 },
      { name: "TikTok", primary: 2.9, secondary: 4.2 },
      { name: "LinkedIn", primary: 6.1, secondary: 4.2 },
      { name: "Email", primary: 8.2, secondary: 4.2 },
      { name: "SEO", primary: 11.4, secondary: 4.2 },
      { name: "Affiliate", primary: 4.7, secondary: 4.2 },
    ],
    chartPrimaryKey: "ROI",
    chartSecondaryKey: "Average",
    insights: [
      { type: "good", text: "SEO delivering 11.4× ROI — highest performing channel this month" },
      { type: "good", text: "Email ROI improved 1.2× after segmentation update" },
      { type: "warn", text: "TikTok ROI below average (2.9×) — consider creative refresh" },
    ],
    tableHeaders: ["Channel", "Spend", "Revenue", "ROI", "vs Target"],
    tableRows: [
      ["Google Ads", "£22K", "£127.6K", "5.8×", "↑ Above"],
      ["Meta Ads", "£18K", "£61.2K", "3.4×", "↓ Below"],
      ["TikTok", "£8K", "£23.2K", "2.9×", "↓ Below"],
      ["LinkedIn", "£12K", "£73.2K", "6.1×", "↑ Above"],
      ["Email", "£3.2K", "£26.2K", "8.2×", "↑ Above"],
    ],
  },
  "Attribution": {
    kpis: [
      { label: "First Touch (Google)", value: "34%", change: "+2% vs last month", up: true },
      { label: "Last Touch (Email)", value: "28%", change: "+4% vs last month", up: true },
      { label: "Multi-touch Credit", value: "61%", change: "Channels sharing", up: null },
      { label: "Avg Touchpoints", value: "4.2", change: "+0.3 vs last month", up: null },
    ],
    chartLabel: "Attribution by Model",
    chartData: [
      { name: "Google Ads", primary: 34, secondary: 29 },
      { name: "Email", primary: 28, secondary: 31 },
      { name: "SEO", primary: 18, secondary: 20 },
      { name: "Meta", primary: 12, secondary: 11 },
      { name: "Direct", primary: 8, secondary: 9 },
    ],
    chartPrimaryKey: "First Touch",
    chartSecondaryKey: "Last Touch",
    insights: [
      { type: "info", text: "Google Ads initiates 34% of journeys — strong awareness driver" },
      { type: "good", text: "Email closes 28% of sales despite only 5% of budget" },
      { type: "warn", text: "Dark social (untracked referral) estimated at 12% — add UTMs" },
    ],
    tableHeaders: ["Channel", "First Touch", "Last Touch", "Linear", "Budget Share"],
    tableRows: [
      ["Google Ads", "34%", "12%", "23%", "32%"],
      ["Email", "8%", "28%", "19%", "5%"],
      ["SEO / Organic", "18%", "22%", "20%", "8%"],
      ["Meta Ads", "12%", "18%", "15%", "26%"],
      ["Direct", "9%", "11%", "10%", "0%"],
    ],
  },
  "Goals & OKRs": {
    kpis: [
      { label: "OKRs On Track", value: "7 / 10", change: "70% completion", up: null },
      { label: "Revenue Goal", value: "68%", change: "£2.04M of £3M", up: null },
      { label: "Lead Goal", value: "82%", change: "4,920 of 6,000", up: true },
      { label: "NPS Score", value: "54", change: "+6 vs Q2", up: true },
    ],
    chartLabel: "OKR Progress",
    chartData: [
      { name: "Revenue", primary: 68 },
      { name: "Leads", primary: 82 },
      { name: "CAC Reduction", primary: 91 },
      { name: "NPS", primary: 75 },
      { name: "Brand Reach", primary: 55 },
      { name: "Retention", primary: 88 },
    ],
    chartPrimaryKey: "Progress %",
    insights: [
      { type: "good", text: "Lead generation 82% complete — Q4 stretch target now in reach" },
      { type: "good", text: "CAC reduction goal 91% achieved after channel rebalancing" },
      { type: "warn", text: "Revenue goal at 68% — needs £960K in Q4 to close gap" },
    ],
    tableHeaders: ["Objective", "Key Result", "Progress", "Owner", "Status"],
    tableRows: [
      ["Grow Revenue", "Hit £3M ARR", "68%", "Marketing", "At Risk"],
      ["Generate Demand", "6,000 MQLs", "82%", "Growth", "On Track"],
      ["Reduce CAC", "CAC under £80", "91%", "Paid Media", "On Track"],
      ["Improve NPS", "NPS 60+", "75%", "CX", "On Track"],
      ["Brand Awareness", "2M impressions", "55%", "Brand", "At Risk"],
    ],
  },
  "Marketing Overview": {
    kpis: [
      { label: "Total Spend", value: "£68,400", change: "+12% MoM", up: null },
      { label: "Total Leads", value: "4,920", change: "+18% MoM", up: true },
      { label: "CAC (avg)", value: "£82", change: "-14% MoM", up: true },
      { label: "Pipeline Generated", value: "£1.4M", change: "+23% MoM", up: true },
    ],
    chartLabel: "Leads & Spend Trend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 280 + i * 38 + (i % 3 === 0 ? 20 : -5), secondary: 42000 + i * 2200 })),
    chartPrimaryKey: "Leads",
    chartSecondaryKey: "Spend (£)",
    insights: [
      { type: "good", text: "Leads up 18% while spend only increased 12% — efficiency improving" },
      { type: "good", text: "Pipeline velocity up 23% — deals closing faster than Q2" },
      { type: "info", text: "Best performing day: Tuesday — 31% of weekly conversions" },
    ],
    tableHeaders: ["Channel", "Spend", "Leads", "CAC", "Conversion"],
    tableRows: [
      ["Google Ads", "£22K", "1,840", "£12", "4.2%"],
      ["Meta Ads", "£18K", "1,120", "£16", "3.1%"],
      ["LinkedIn", "£12K", "380", "£32", "5.8%"],
      ["SEO", "£5K", "960", "£5", "8.2%"],
      ["Email", "£3.2K", "620", "£5", "12.4%"],
    ],
  },
  "Campaign Intelligence": {
    kpis: [
      { label: "Active Campaigns", value: "24", change: "+3 this month", up: null },
      { label: "Best Campaign ROAS", value: "8.4×", change: "Summer Sale '24", up: true },
      { label: "Total Impressions", value: "14.2M", change: "+31% MoM", up: true },
      { label: "Avg CTR", value: "3.8%", change: "+0.6% MoM", up: true },
    ],
    chartLabel: "Campaign Performance",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 800000 + i * 110000 + (i % 2 === 0 ? 80000 : -20000), secondary: 28000 + i * 1800 })),
    chartPrimaryKey: "Impressions",
    chartSecondaryKey: "Clicks",
    insights: [
      { type: "good", text: "Summer Sale campaign delivered 8.4× ROAS — best of the year" },
      { type: "warn", text: "3 campaigns with CTR below 1% — creative fatigue likely" },
      { type: "info", text: "Video campaigns drive 2.3× higher engagement than static" },
    ],
    tableHeaders: ["Campaign", "Platform", "Spend", "ROAS", "CTR"],
    tableRows: [
      ["Summer Sale 2024", "Google", "£12K", "8.4×", "5.2%"],
      ["Brand Awareness Q3", "Meta", "£8K", "3.1×", "2.8%"],
      ["Retargeting - All", "Multi", "£5K", "6.2×", "4.1%"],
      ["B2B Lead Gen", "LinkedIn", "£9K", "4.8×", "1.9%"],
      ["Product Launch", "TikTok", "£6K", "2.9×", "3.7%"],
    ],
  },
  "Channel Performance": {
    kpis: [
      { label: "Top Channel", value: "Google Ads", change: "5.8× ROI this month", up: true },
      { label: "Fastest Growing", value: "TikTok", change: "+84% reach MoM", up: true },
      { label: "Most Efficient", value: "SEO", change: "£5 CAC average", up: true },
      { label: "Channels Active", value: "12", change: "Across all platforms", up: null },
    ],
    chartLabel: "Channel Revenue Contribution",
    chartData: [
      { name: "Google Ads", primary: 127600 },
      { name: "SEO", primary: 98400 },
      { name: "Email", primary: 74200 },
      { name: "LinkedIn", primary: 61800 },
      { name: "Meta Ads", primary: 54400 },
      { name: "TikTok", primary: 28900 },
      { name: "Affiliate", primary: 22400 },
    ],
    chartPrimaryKey: "Revenue (£)",
    insights: [
      { type: "good", text: "Google Ads continues as top revenue driver at £127K this month" },
      { type: "good", text: "TikTok reach up 84% — audience growing rapidly in 18–34 segment" },
      { type: "warn", text: "Meta CPM rising 18% — monitor budget allocation next month" },
    ],
    tableHeaders: ["Channel", "Spend", "Revenue", "ROAS", "Leads", "CAC"],
    tableRows: [
      ["Google Ads", "£22K", "£127.6K", "5.8×", "1,840", "£12"],
      ["SEO / Organic", "£5K", "£98.4K", "19.7×", "960", "£5"],
      ["Email", "£3.2K", "£74.2K", "23.2×", "620", "£5"],
      ["LinkedIn", "£12K", "£61.8K", "5.2×", "380", "£32"],
      ["Meta Ads", "£18K", "£54.4K", "3.0×", "1,120", "£16"],
    ],
  },
  "Audience Performance": {
    kpis: [
      { label: "Total Audience", value: "284K", change: "+12% this month", up: true },
      { label: "Engaged Users", value: "48,200", change: "+8% this month", up: true },
      { label: "Top Segment", value: "25–34 Female", change: "34% of conversions", up: null },
      { label: "Lookalike Match", value: "87%", change: "High quality", up: true },
    ],
    chartLabel: "Audience Growth",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 180000 + i * 9500 + (i % 4 === 0 ? 5000 : 1000) })),
    chartPrimaryKey: "Audience Size",
    insights: [
      { type: "good", text: "25–34 female segment converting at 2.1× average — scale spend" },
      { type: "info", text: "Mobile users grew to 68% of audience — prioritise mobile creative" },
      { type: "warn", text: "45+ segment underrepresented — potential untapped market" },
    ],
    tableHeaders: ["Segment", "Size", "CVR", "Revenue", "vs Last Month"],
    tableRows: [
      ["25–34 Female", "84K", "5.2%", "£82K", "+18%"],
      ["35–44 Male", "62K", "4.1%", "£61K", "+11%"],
      ["18–24 (All)", "48K", "2.8%", "£29K", "+32%"],
      ["45–54 (All)", "41K", "3.9%", "£44K", "+4%"],
      ["55+ (All)", "28K", "4.8%", "£38K", "+7%"],
    ],
  },
  "Content Performance": {
    kpis: [
      { label: "Content Published", value: "148", change: "This quarter", up: null },
      { label: "Total Content Views", value: "2.4M", change: "+28% QoQ", up: true },
      { label: "Avg Time on Page", value: "3m 42s", change: "+18s vs Q2", up: true },
      { label: "Content-Led Revenue", value: "£94K", change: "+32% QoQ", up: true },
    ],
    chartLabel: "Content Views by Type",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 140000 + i * 18000 + (i % 3 === 0 ? 20000 : -5000), secondary: 40000 + i * 6000 })),
    chartPrimaryKey: "Blog Views",
    chartSecondaryKey: "Video Views",
    insights: [
      { type: "good", text: "Top blog post drove 84K organic visits this quarter — refresh it" },
      { type: "good", text: "Video content has 2.8× longer session duration vs blog posts" },
      { type: "warn", text: "Case studies converting at 8.2% but only 4 published — create more" },
    ],
    tableHeaders: ["Content", "Type", "Views", "Leads", "CVR"],
    tableRows: [
      ["Ultimate Marketing Guide", "Blog", "84K", "420", "0.50%"],
      ["Product Demo Video", "Video", "62K", "890", "1.44%"],
      ["Case Study: 3× ROI", "Case Study", "18K", "148", "0.82%"],
      ["Pricing Comparison", "Landing Page", "24K", "312", "1.30%"],
      ["ROI Calculator", "Tool", "14K", "564", "4.03%"],
    ],
  },
  "Creative Performance": {
    kpis: [
      { label: "Active Creatives", value: "84", change: "Across all channels", up: null },
      { label: "Top Creative CTR", value: "6.8%", change: "2× above average", up: true },
      { label: "Creative Fatigue", value: "12 creatives", change: "Need refresh", up: false },
      { label: "A/B Tests Running", value: "8", change: "4 with winners", up: null },
    ],
    chartLabel: "Creative CTR Trend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 2.8 + i * 0.25 + (i % 3 === 0 ? 0.3 : -0.1), secondary: 3.8 })),
    chartPrimaryKey: "CTR %",
    chartSecondaryKey: "Target",
    insights: [
      { type: "good", text: "Video-first creatives outperforming static by 2.3× on TikTok" },
      { type: "warn", text: "12 creatives showing frequency >8 — audience fatigue risk" },
      { type: "good", text: "A/B test on CTA copy lifted CTR 22% — roll out the winner" },
    ],
    tableHeaders: ["Creative", "Channel", "CTR", "Conv Rate", "Status"],
    tableRows: [
      ["Summer Sale Video 30s", "TikTok", "6.8%", "4.2%", "Active"],
      ["Product Demo Carousel", "Meta", "4.1%", "3.8%", "Active"],
      ["Brand Story Video", "YouTube", "3.9%", "2.1%", "Active"],
      ["Offer Banner v2", "Google", "5.2%", "6.1%", "Active"],
      ["Retargeting Static", "Meta", "2.1%", "5.8%", "Fatigue"],
    ],
  },
  "SEO Intelligence": {
    kpis: [
      { label: "Organic Traffic", value: "84,200", change: "+24% MoM", up: true },
      { label: "Ranking Keywords", value: "3,480", change: "+312 MoM", up: true },
      { label: "Top 3 Keywords", value: "142", change: "+28 MoM", up: true },
      { label: "Domain Authority", value: "54", change: "+2 vs last month", up: true },
    ],
    chartLabel: "Organic Traffic Trend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 42000 + i * 3800 + (i % 4 === 0 ? 4000 : -800) })),
    chartPrimaryKey: "Sessions",
    insights: [
      { type: "good", text: "24 new page-1 rankings this month — content cluster strategy working" },
      { type: "good", text: "Core Web Vitals passing — site speed improvements paying off" },
      { type: "warn", text: "2 high-value keywords dropped from positions 3→8 — act fast" },
    ],
    tableHeaders: ["Keyword", "Position", "Volume", "Traffic", "Change"],
    tableRows: [
      ["marketing analytics software", "2", "8,100/mo", "3,240", "↑ +1"],
      ["marketing dashboard tool", "1", "5,400/mo", "2,916", "→"],
      ["marketing attribution tool", "4", "4,400/mo", "880", "↑ +2"],
      ["best marketing analytics", "3", "3,600/mo", "1,080", "↑ +3"],
      ["marketing roi calculator", "8", "2,900/mo", "232", "↓ -5"],
    ],
  },
  "Email Marketing": {
    kpis: [
      { label: "Email Subscribers", value: "48,200", change: "+2,400 this month", up: true },
      { label: "Avg Open Rate", value: "28.4%", change: "+3.2% MoM", up: true },
      { label: "Avg CTR", value: "4.8%", change: "+0.6% MoM", up: true },
      { label: "Revenue from Email", value: "£74K", change: "+18% MoM", up: true },
    ],
    chartLabel: "Email Performance",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 22 + i * 0.6 + (i % 3 === 0 ? 1 : -0.2), secondary: 3.2 + i * 0.14 })),
    chartPrimaryKey: "Open Rate %",
    chartSecondaryKey: "CTR %",
    insights: [
      { type: "good", text: "Personalised subject lines boosted open rate 6.4% — keep A/B testing" },
      { type: "good", text: "Win-back campaign recovered £8.2K in at-risk revenue" },
      { type: "warn", text: "4pm send time underperforming — test Tuesday 10am for better results" },
    ],
    tableHeaders: ["Campaign", "Sent", "Open Rate", "CTR", "Revenue"],
    tableRows: [
      ["July Newsletter", "48,200", "31.2%", "5.8%", "£18.4K"],
      ["Win-Back Campaign", "8,400", "42.1%", "9.2%", "£8.2K"],
      ["Product Update", "48,200", "24.8%", "3.1%", "£11.2K"],
      ["Flash Sale Alert", "32,100", "38.4%", "12.4%", "£24.8K"],
      ["Onboarding Week 1", "2,400", "68.2%", "22.1%", "£4.1K"],
    ],
  },
  "Video Intelligence": {
    kpis: [
      { label: "Total Video Views", value: "4.8M", change: "+62% QoQ", up: true },
      { label: "Avg Watch Time", value: "68%", change: "+8% vs last quarter", up: true },
      { label: "Video-Led Conversions", value: "1,240", change: "+44% QoQ", up: true },
      { label: "Best Performing", value: "Product Demo", change: "2.1M views", up: null },
    ],
    chartLabel: "Video Views Trend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 220000 + i * 42000 + (i % 2 === 0 ? 30000 : -10000) })),
    chartPrimaryKey: "Views",
    insights: [
      { type: "good", text: "Product demo video at 68% completion rate — industry benchmark is 45%" },
      { type: "good", text: "TikTok short-form driving 3.2× more engagement than YouTube" },
      { type: "info", text: "First 3 seconds retention at 84% — strong hook in new creatives" },
    ],
    tableHeaders: ["Video", "Platform", "Views", "Watch %", "Conversions"],
    tableRows: [
      ["Product Demo 2024", "YouTube", "2.1M", "68%", "420"],
      ["Customer Story: ACME", "YouTube", "840K", "72%", "210"],
      ["30s Brand TikTok", "TikTok", "1.2M", "84%", "390"],
      ["Feature Tutorial", "LinkedIn", "280K", "51%", "84"],
      ["CEO Brand Message", "All", "180K", "62%", "136"],
    ],
  },
  "Revenue": {
    kpis: [
      { label: "Monthly Revenue", value: "£287,450", change: "+14% MoM", up: true },
      { label: "Annual Run Rate", value: "£3.45M", change: "+14% vs last year", up: true },
      { label: "Gross Margin", value: "72%", change: "+2% MoM", up: true },
      { label: "Revenue per Lead", value: "£58.4", change: "+9% MoM", up: true },
    ],
    chartLabel: "Revenue Trend",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 180000 + i * 11000 + (i % 3 === 0 ? 8000 : -2000) })),
    chartPrimaryKey: "Revenue (£)",
    insights: [
      { type: "good", text: "Q3 MRR growth rate at 14% — on track for £3.45M ARR" },
      { type: "good", text: "Gross margin improved to 72% after pricing tier restructure" },
      { type: "info", text: "Enterprise segment growing fastest — now 38% of total revenue" },
    ],
    tableHeaders: ["Month", "Revenue", "MoM Growth", "New Biz", "Expansion"],
    tableRows: [
      ["July 2024", "£287.4K", "+14%", "£98K", "£71K"],
      ["June 2024", "£252.1K", "+8%", "£84K", "£65K"],
      ["May 2024", "£233.4K", "+11%", "£79K", "£58K"],
      ["Apr 2024", "£210.2K", "+6%", "£71K", "£52K"],
      ["Mar 2024", "£198.3K", "+9%", "£68K", "£48K"],
    ],
  },
  "Recommendations": {
    kpis: [
      { label: "Open Recommendations", value: "18", change: "6 high priority", up: null },
      { label: "Revenue Opportunity", value: "£84K", change: "If all actioned", up: true },
      { label: "Quick Wins", value: "7", change: "Can action today", up: null },
      { label: "Implemented (30d)", value: "12", change: "+£42K revenue", up: true },
    ],
    chartLabel: "Recommendations by Category",
    chartData: [
      { name: "Paid Media", primary: 6 },
      { name: "SEO", primary: 4 },
      { name: "Email", primary: 3 },
      { name: "Creative", primary: 3 },
      { name: "Budget", primary: 2 },
    ],
    chartPrimaryKey: "Count",
    insights: [
      { type: "good", text: "Actioning Q2 recommendations generated £42K in incremental revenue" },
      { type: "warn", text: "6 high-priority items open for 14+ days — assign owners today" },
      { type: "info", text: "AI confidence score on top recommendation: 94%" },
    ],
    tableHeaders: ["Recommendation", "Impact", "Effort", "Revenue Upside", "Priority"],
    tableRows: [
      ["Increase Google Ads bid on branded", "High", "Low", "+£18K/mo", "Critical"],
      ["Pause 12 fatigued creatives on Meta", "Medium", "Low", "+£8K/mo", "High"],
      ["Add retargeting for cart abandoners", "High", "Medium", "+£24K/mo", "High"],
      ["Fix 3 broken UTM campaigns", "Medium", "Low", "+£6K/mo", "Medium"],
      ["Launch email win-back sequence", "High", "Medium", "+£12K/mo", "High"],
    ],
  },
  "Risks": {
    kpis: [
      { label: "Open Risks", value: "9", change: "3 critical", up: null },
      { label: "Revenue at Risk", value: "£38.4K", change: "Next 30 days", up: false },
      { label: "Mitigated (30d)", value: "5", change: "Saved £21K", up: true },
      { label: "Risk Score", value: "34 / 100", change: "Medium risk level", up: null },
    ],
    chartLabel: "Risk by Category",
    chartData: [
      { name: "Budget", primary: 3 },
      { name: "Creative", primary: 2 },
      { name: "Platform", primary: 2 },
      { name: "Audience", primary: 1 },
      { name: "Compliance", primary: 1 },
    ],
    chartPrimaryKey: "Risks",
    insights: [
      { type: "warn", text: "Google Ads auction competition up 23% — bids need urgent review" },
      { type: "warn", text: "Meta ad account at 84% budget cap — campaigns may pause early" },
      { type: "info", text: "GDPR consent rate dropped 4% — review cookie banner wording" },
    ],
    tableHeaders: ["Risk", "Severity", "Probability", "Revenue Impact", "Action"],
    tableRows: [
      ["Google auction competition spike", "Critical", "High", "-£18K/mo", "Raise bids"],
      ["Meta budget cap hit", "High", "Very High", "-£12K/mo", "Increase budget"],
      ["Creative fatigue on Meta", "High", "High", "-£8K/mo", "New creative"],
      ["Email deliverability drop", "Medium", "Medium", "-£4K/mo", "Clean list"],
      ["Competitor price drop", "Medium", "Low", "-£6K/mo", "Monitor"],
    ],
  },
  "Predictions": {
    kpis: [
      { label: "Predicted Revenue (Aug)", value: "£312K", change: "+8.5% vs July", up: true },
      { label: "Lead Forecast (Aug)", value: "5,280", change: "+7.3% vs July", up: true },
      { label: "Confidence Score", value: "87%", change: "High confidence", up: null },
      { label: "Model Accuracy (90d)", value: "93%", change: "vs actual", up: true },
    ],
    chartLabel: "Revenue Prediction vs Actual",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: i < 7 ? 180000 + i * 11000 : 0,
      secondary: 178000 + i * 11200 + (i % 3 === 0 ? 5000 : -2000),
    })),
    chartPrimaryKey: "Actual",
    chartSecondaryKey: "Predicted",
    insights: [
      { type: "good", text: "Prediction model hit 93% accuracy over last 90 days" },
      { type: "good", text: "August revenue predicted at £312K (+8.5%) driven by paid search" },
      { type: "info", text: "Q4 seasonality uplift expected — plan budget increase for Oct–Dec" },
    ],
    tableHeaders: ["Metric", "Jul Actual", "Aug Predicted", "Confidence", "Trend"],
    tableRows: [
      ["Revenue", "£287.4K", "£312K", "89%", "↑ Up"],
      ["Leads", "4,920", "5,280", "84%", "↑ Up"],
      ["CAC", "£82", "£78", "81%", "↓ Better"],
      ["ROAS (blended)", "4.2×", "4.6×", "78%", "↑ Up"],
      ["Organic Traffic", "84.2K", "91.8K", "92%", "↑ Up"],
    ],
  },
  "Root Cause Analysis": {
    kpis: [
      { label: "Analyses Run (30d)", value: "8", change: "3 automated", up: null },
      { label: "Issues Identified", value: "14", change: "6 root causes found", up: null },
      { label: "Revenue Recovered", value: "£28K", change: "After fixes applied", up: true },
      { label: "Avg Resolution Time", value: "2.4 days", change: "-1.2 days vs Q2", up: true },
    ],
    chartLabel: "Issue Categories",
    chartData: [
      { name: "Tracking", primary: 4 },
      { name: "Creative", primary: 3 },
      { name: "Targeting", primary: 3 },
      { name: "Budget", primary: 2 },
      { name: "Landing Page", primary: 2 },
    ],
    chartPrimaryKey: "Issues Found",
    insights: [
      { type: "good", text: "UTM tracking fix recovered £12K in previously unattributed revenue" },
      { type: "good", text: "Landing page speed fix lifted conversion rate 18%" },
      { type: "warn", text: "Google Ads audience mismatch causing 24% of budget on wrong segment" },
    ],
    tableHeaders: ["Issue", "Root Cause", "Revenue Impact", "Status", "Fix Applied"],
    tableRows: [
      ["Conversion drop - Jun 14", "UTM params broken", "£12K", "Fixed", "Jun 16"],
      ["CPC spike - Jul 2", "Bid strategy reset", "£8K", "Fixed", "Jul 3"],
      ["Email CTR drop - Jun 28", "Broken CTA link", "£4K", "Fixed", "Jun 29"],
      ["ROAS drop Meta", "Audience overlap 68%", "£6K", "Fixing", "In Progress"],
      ["Landing page conv drop", "Page speed 8.2s", "£5K", "Fixed", "Jul 8"],
    ],
  },
  "Budget Optimizer": {
    kpis: [
      { label: "Monthly Budget", value: "£68,400", change: "Across all channels", up: null },
      { label: "Optimised Allocation", value: "+£42K revenue", change: "vs current allocation", up: true },
      { label: "Underperforming", value: "£12K", change: "Should be reallocated", up: null },
      { label: "Budget Efficiency", value: "78%", change: "+6% vs Q2", up: true },
    ],
    chartLabel: "Current vs Recommended Budget",
    chartData: [
      { name: "Google Ads", primary: 22000, secondary: 26000 },
      { name: "Meta Ads", primary: 18000, secondary: 14000 },
      { name: "LinkedIn", primary: 12000, secondary: 14000 },
      { name: "TikTok", primary: 8000, secondary: 6000 },
      { name: "Email", primary: 3200, secondary: 4200 },
      { name: "SEO", primary: 5200, secondary: 4200 },
    ],
    chartPrimaryKey: "Current (£)",
    chartSecondaryKey: "Recommended (£)",
    insights: [
      { type: "good", text: "Moving £4K from TikTok to Google Ads could add £18K revenue" },
      { type: "good", text: "Email budget increase of £1K projected to add £8.2K revenue" },
      { type: "warn", text: "Meta budget above optimal point — diminishing returns above £14K" },
    ],
    tableHeaders: ["Channel", "Current", "Recommended", "Change", "Revenue Impact"],
    tableRows: [
      ["Google Ads", "£22K", "£26K", "+£4K", "+£18K"],
      ["Meta Ads", "£18K", "£14K", "-£4K", "-£2K (efficiency)"],
      ["LinkedIn", "£12K", "£14K", "+£2K", "+£9K"],
      ["TikTok", "£8K", "£6K", "-£2K", "-£1K (efficiency)"],
      ["Email", "£3.2K", "£4.2K", "+£1K", "+£8.2K"],
    ],
  },
  "SEO Optimizer": {
    kpis: [
      { label: "Keyword Opportunities", value: "284", change: "High-volume, low competition", up: null },
      { label: "Traffic Upside", value: "+42K visits/mo", change: "If opportunities actioned", up: true },
      { label: "Revenue Potential", value: "+£28K/mo", change: "From SEO improvements", up: true },
      { label: "Quick Wins", value: "18", change: "Pages needing optimisation", up: null },
    ],
    chartLabel: "Opportunity by Category",
    chartData: [
      { name: "Content Gaps", primary: 84 },
      { name: "Technical SEO", primary: 42 },
      { name: "Backlinks", primary: 68 },
      { name: "On-Page", primary: 56 },
      { name: "Local SEO", primary: 34 },
    ],
    chartPrimaryKey: "Opportunities",
    insights: [
      { type: "good", text: "18 existing pages can reach page 1 with minor optimisation" },
      { type: "good", text: "84 content gap keywords with 1,000+ monthly search volume" },
      { type: "info", text: "Competitor DA 62 vs your DA 54 — 8 points to close with links" },
    ],
    tableHeaders: ["Opportunity", "Type", "Effort", "Traffic Upside", "Priority"],
    tableRows: [
      ["Optimise pricing page", "On-Page", "Low", "+4.2K/mo", "Critical"],
      ["Target 'best X tool' keywords", "Content", "Medium", "+8.1K/mo", "High"],
      ["Fix 42 crawl errors", "Technical", "Medium", "+2.8K/mo", "High"],
      ["Build 10 quality backlinks", "Off-Page", "High", "+6.4K/mo", "High"],
      ["Add FAQ schema markup", "Technical", "Low", "+1.2K/mo", "Medium"],
    ],
  },
  "Creative Optimizer": {
    kpis: [
      { label: "Creatives Analysed", value: "84", change: "This month", up: null },
      { label: "Winning Variants", value: "24", change: "29% success rate", up: null },
      { label: "CTR Improvement", value: "+1.4%", change: "From A/B winners", up: true },
      { label: "Revenue Uplift", value: "+£18K", change: "From creative changes", up: true },
    ],
    chartLabel: "Creative Performance Distribution",
    chartData: [
      { name: "Excellent (>5%)", primary: 18 },
      { name: "Good (3-5%)", primary: 24 },
      { name: "Average (1-3%)", primary: 30 },
      { name: "Poor (<1%)", primary: 12 },
    ],
    chartPrimaryKey: "Creatives",
    insights: [
      { type: "good", text: "Video creatives outperforming static by 2.3× CTR on average" },
      { type: "good", text: "CTA 'Start Free Trial' beats 'Get Started' by 28% — roll out everywhere" },
      { type: "warn", text: "12 creatives in fatigue territory — frequency >8, CTR declining" },
    ],
    tableHeaders: ["Creative", "CTR", "Conv Rate", "Status", "Recommendation"],
    tableRows: [
      ["Video Demo 30s", "6.8%", "4.2%", "Excellent", "Scale spend"],
      ["Product Carousel", "4.1%", "3.8%", "Good", "Keep running"],
      ["Static Banner A", "2.2%", "2.1%", "Average", "Test new variant"],
      ["Retargeting Static", "0.8%", "5.2%", "Poor CTR", "Refresh creative"],
      ["Story Ad v3", "5.4%", "3.1%", "Good", "Increase frequency"],
    ],
  },
  "Audience Optimizer": {
    kpis: [
      { label: "Audiences Analysed", value: "42", change: "Across all platforms", up: null },
      { label: "Top Audience ROAS", value: "7.8×", change: "25–34 female interest", up: true },
      { label: "Audience Overlap", value: "34%", change: "Reduce for efficiency", up: false },
      { label: "Revenue Upside", value: "+£24K/mo", change: "From audience optimisation", up: true },
    ],
    chartLabel: "Audience Performance by Segment",
    chartData: [
      { name: "25-34 F", primary: 7.8 },
      { name: "35-44 M", primary: 5.2 },
      { name: "25-34 M", primary: 4.9 },
      { name: "18-24", primary: 3.1 },
      { name: "45-54", primary: 4.4 },
      { name: "Retarget", primary: 6.8 },
    ],
    chartPrimaryKey: "ROAS",
    insights: [
      { type: "good", text: "25–34 female audience delivering 7.8× ROAS — increase budget here" },
      { type: "warn", text: "34% audience overlap between campaigns — causing internal bid competition" },
      { type: "good", text: "Retargeting audience at 6.8× ROAS — expand lookalike from this seed" },
    ],
    tableHeaders: ["Audience", "Size", "ROAS", "CVR", "Recommendation"],
    tableRows: [
      ["25–34 Female (interest)", "2.4M", "7.8×", "4.8%", "Scale budget +40%"],
      ["Retargeting Pool", "84K", "6.8×", "8.2%", "Expand lookalike"],
      ["35–44 Male (demo)", "3.1M", "5.2×", "3.1%", "Test new creative"],
      ["18–24 All", "4.2M", "3.1×", "2.2%", "Reduce spend 20%"],
      ["45–54 All", "2.8M", "4.4×", "3.6%", "Keep current"],
    ],
  },
  "Revenue Forecast": {
    kpis: [
      { label: "Aug Forecast", value: "£312K", change: "+8.5% vs July", up: true },
      { label: "Q4 Projection", value: "£1.04M", change: "On track for target", up: true },
      { label: "Annual Forecast", value: "£3.45M", change: "15% above target", up: true },
      { label: "Forecast Accuracy", value: "93%", change: "Last 90 days", up: null },
    ],
    chartLabel: "Revenue Forecast",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: i < 7 ? 180000 + i * 11000 : 0,
      secondary: 180000 + i * 11500 + (i % 3 === 0 ? 8000 : 2000),
    })),
    chartPrimaryKey: "Actual",
    chartSecondaryKey: "Forecast",
    insights: [
      { type: "good", text: "Annual forecast upgraded to £3.45M — 15% above original target" },
      { type: "good", text: "Q4 expected to benefit from seasonality uplift — plan budget now" },
      { type: "info", text: "Model confidence: 87% — based on 18 months of historical data" },
    ],
    tableHeaders: ["Period", "Forecast", "Best Case", "Worst Case", "Confidence"],
    tableRows: [
      ["August 2024", "£312K", "£338K", "£284K", "89%"],
      ["September 2024", "£328K", "£365K", "£291K", "84%"],
      ["October 2024", "£358K", "£401K", "£315K", "78%"],
      ["November 2024", "£412K", "£468K", "£356K", "72%"],
      ["December 2024", "£478K", "£542K", "£414K", "68%"],
    ],
  },
  "Lead Forecast": {
    kpis: [
      { label: "Aug Lead Forecast", value: "5,280", change: "+7.3% vs July", up: true },
      { label: "MQL Forecast", value: "1,848", change: "+8.1% vs July", up: true },
      { label: "SQL Forecast", value: "684", change: "+9.4% vs July", up: true },
      { label: "Pipeline Forecast", value: "£1.62M", change: "+11% vs July", up: true },
    ],
    chartLabel: "Lead Forecast",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: i < 7 ? 280 + i * 38 : 0,
      secondary: 290 + i * 40 + (i % 3 === 0 ? 15 : -5),
    })),
    chartPrimaryKey: "Actual Leads",
    chartSecondaryKey: "Forecast",
    insights: [
      { type: "good", text: "Lead forecast confidence at 84% — high signal from pipeline data" },
      { type: "good", text: "MQL-to-SQL rate trending up — better qualification in place" },
      { type: "info", text: "Seasonality model predicts Oct as peak month — plan campaigns now" },
    ],
    tableHeaders: ["Source", "Jul Actual", "Aug Forecast", "MQL Rate", "SQL Rate"],
    tableRows: [
      ["Google Ads", "1,840", "1,980", "42%", "18%"],
      ["SEO / Organic", "960", "1,040", "38%", "15%"],
      ["LinkedIn", "380", "420", "62%", "28%"],
      ["Meta Ads", "1,120", "1,200", "28%", "10%"],
      ["Email", "620", "640", "54%", "22%"],
    ],
  },
  "Budget Forecast": {
    kpis: [
      { label: "Aug Budget Plan", value: "£72,400", change: "+5.9% vs July", up: null },
      { label: "Forecasted ROI", value: "4.6×", change: "+0.4× vs July", up: true },
      { label: "Projected Revenue", value: "£333K", change: "At planned spend", up: true },
      { label: "Budget Variance", value: "2.1%", change: "Historical accuracy", up: null },
    ],
    chartLabel: "Budget vs Projected Revenue",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: i < 7 ? 42000 + i * 2200 : 44000 + i * 2600,
      secondary: i < 7 ? 180000 + i * 11000 : 195000 + i * 13000,
    })),
    chartPrimaryKey: "Budget (£)",
    chartSecondaryKey: "Revenue (£)",
    insights: [
      { type: "good", text: "Planned budget increase of £4K in Q4 projected to yield £52K revenue" },
      { type: "info", text: "Historical budget variance at 2.1% — model is highly calibrated" },
      { type: "warn", text: "Nov/Dec budget should increase 20% to capture festive demand" },
    ],
    tableHeaders: ["Month", "Budget", "Forecast Revenue", "ROI", "Confidence"],
    tableRows: [
      ["August 2024", "£72.4K", "£333K", "4.6×", "87%"],
      ["September 2024", "£72.4K", "£351K", "4.9×", "82%"],
      ["October 2024", "£78K", "£396K", "5.1×", "76%"],
      ["November 2024", "£86K", "£458K", "5.3×", "71%"],
      ["December 2024", "£92K", "£524K", "5.7×", "66%"],
    ],
  },
  "Sales Forecast": {
    kpis: [
      { label: "Aug Sales Forecast", value: "£312K", change: "+8.5% vs July", up: true },
      { label: "Deals Closing", value: "84", change: "In August pipeline", up: null },
      { label: "Win Rate Forecast", value: "38%", change: "+3% vs Q2 avg", up: true },
      { label: "Forecast Accuracy", value: "91%", change: "Last 6 months", up: null },
    ],
    chartLabel: "Sales Pipeline Forecast",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: i < 7 ? 180000 + i * 11000 : 0,
      secondary: 185000 + i * 12000 + (i % 2 === 0 ? 5000 : -2000),
    })),
    chartPrimaryKey: "Actual",
    chartSecondaryKey: "Forecast",
    insights: [
      { type: "good", text: "Pipeline coverage at 3.2× — healthy buffer for hitting August target" },
      { type: "good", text: "Win rate trending up after updated sales playbook rollout" },
      { type: "warn", text: "4 enterprise deals at risk — need exec involvement to close" },
    ],
    tableHeaders: ["Stage", "Deals", "Value", "Win Rate", "Forecast Value"],
    tableRows: [
      ["Proposal Sent", "18", "£284K", "48%", "£136K"],
      ["Demo Booked", "24", "£312K", "32%", "£100K"],
      ["Negotiation", "8", "£148K", "72%", "£107K"],
      ["Trial Active", "34", "£224K", "28%", "£63K"],
    ],
  },
  "Demand Forecast": {
    kpis: [
      { label: "Projected Demand (Q4)", value: "+24%", change: "vs Q3 2024", up: true },
      { label: "Peak Month", value: "November", change: "Seasonal uplift +38%", up: null },
      { label: "Demand Confidence", value: "84%", change: "Model accuracy", up: null },
      { label: "Category Growth", value: "+18%", change: "Market expanding", up: true },
    ],
    chartLabel: "Demand Forecast",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: i < 7 ? 4200 + i * 180 : 0,
      secondary: 4100 + i * 210 + (i > 8 ? (i - 8) * 120 : 0),
    })),
    chartPrimaryKey: "Actual Demand",
    chartSecondaryKey: "Forecast",
    insights: [
      { type: "good", text: "Q4 demand forecast +24% — start scaling supply and budget now" },
      { type: "info", text: "November expected to be peak month — 38% above seasonal average" },
      { type: "warn", text: "Supply constraint risk in Dec — coordinate with operations team" },
    ],
    tableHeaders: ["Month", "Demand Forecast", "vs Last Year", "Confidence", "Action"],
    tableRows: [
      ["August", "+7%", "+18%", "87%", "Maintain"],
      ["September", "+9%", "+21%", "82%", "Increase budget 10%"],
      ["October", "+18%", "+28%", "76%", "Increase budget 20%"],
      ["November", "+38%", "+44%", "71%", "Peak prep"],
      ["December", "+29%", "+33%", "66%", "Scale down post-peak"],
    ],
  },
  "Seasonality": {
    kpis: [
      { label: "Peak Season", value: "Oct–Dec", change: "Q4 +38% vs avg", up: null },
      { label: "Strongest Month", value: "November", change: "2.1× average revenue", up: null },
      { label: "Seasonal Uplift", value: "+£92K", change: "Q4 vs Q2 average", up: true },
      { label: "YoY Trend", value: "+14%", change: "Seasonal peaks growing", up: true },
    ],
    chartLabel: "Seasonal Revenue Pattern",
    chartData: MONTHS.map((m, i) => ({
      name: m,
      primary: [0.78, 0.72, 0.85, 0.88, 0.92, 0.95, 1.0, 1.04, 1.08, 1.24, 1.84, 1.52][i],
      secondary: [0.72, 0.68, 0.79, 0.82, 0.88, 0.90, 0.95, 0.98, 1.02, 1.18, 1.72, 1.42][i],
    })),
    chartPrimaryKey: "2024 Index",
    chartSecondaryKey: "2023 Index",
    insights: [
      { type: "info", text: "November seasonal index at 1.84× — highest of the year by far" },
      { type: "good", text: "Seasonal peaks growing 14% YoY — strong brand momentum" },
      { type: "warn", text: "January dip expected at 0.72× — plan retention campaigns now" },
    ],
    tableHeaders: ["Month", "Revenue Index", "vs Prior Year", "Budget Multiplier"],
    tableRows: [
      ["October", "1.24×", "+0.06", "1.2×"],
      ["November", "1.84×", "+0.12", "1.8×"],
      ["December", "1.52×", "+0.10", "1.5×"],
      ["January", "0.72×", "+0.04", "0.7×"],
      ["February", "0.78×", "+0.06", "0.8×"],
    ],
  },
  "Predictive Trends": {
    kpis: [
      { label: "Trends Detected", value: "14", change: "This month", up: null },
      { label: "Emerging Channels", value: "3", change: "TikTok, CTV, Podcast", up: null },
      { label: "Market Growth Rate", value: "+18%", change: "Your category YoY", up: true },
      { label: "Competitor Moves", value: "6", change: "Detected this month", up: null },
    ],
    chartLabel: "Trend Signals",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 42 + i * 4.8 + (i % 3 === 0 ? 3 : -1) })),
    chartPrimaryKey: "Trend Score",
    insights: [
      { type: "good", text: "AI-generated content trend accelerating — 3 competitors investing" },
      { type: "info", text: "CTV advertising growing 84% YoY in your category — early mover advantage available" },
      { type: "warn", text: "Privacy regulations tightening — 3rd party cookie reliance is a risk" },
    ],
    tableHeaders: ["Trend", "Signal Strength", "Timeline", "Impact", "Opportunity"],
    tableRows: [
      ["AI Content Generation", "Strong", "Now", "High", "Adopt tools"],
      ["CTV Advertising", "Growing", "6 months", "High", "Early test"],
      ["Podcast Advertising", "Emerging", "12 months", "Medium", "Monitor"],
      ["Privacy-First Marketing", "Critical", "Now", "High", "Act now"],
      ["Short-form Video", "Established", "Ongoing", "High", "Scale"],
    ],
  },
  "Campaign Planner": {
    kpis: [
      { label: "Campaigns Planned", value: "8", change: "Next 90 days", up: null },
      { label: "Total Budget Planned", value: "£124K", change: "Q4 campaign budget", up: null },
      { label: "Expected Leads", value: "14,200", change: "From planned campaigns", up: null },
      { label: "Expected Revenue", value: "£842K", change: "Projected pipeline", up: null },
    ],
    chartLabel: "Campaign Budget Timeline",
    chartData: [
      { name: "Aug", primary: 24000 },
      { name: "Sep", primary: 28000 },
      { name: "Oct", primary: 32000 },
      { name: "Nov", primary: 42000 },
      { name: "Dec", primary: 38000 },
    ],
    chartPrimaryKey: "Budget (£)",
    insights: [
      { type: "good", text: "Q4 campaign plan projects £842K pipeline — 2.4× budget invested" },
      { type: "info", text: "Black Friday campaign planned for Nov 25 — biggest spend day" },
      { type: "warn", text: "2 campaigns need creative assets by Aug 15 — flag to design team" },
    ],
    tableHeaders: ["Campaign", "Start Date", "Budget", "Expected Leads", "Status"],
    tableRows: [
      ["September Push", "Sep 1", "£28K", "3,400", "Planning"],
      ["Q4 Brand Awareness", "Oct 1", "£32K", "4,200", "Draft"],
      ["Black Friday 2024", "Nov 20", "£18K", "2,800", "Planning"],
      ["Year-End Sale", "Dec 1", "£24K", "3,600", "Concept"],
      ["Retargeting Always-On", "Ongoing", "£12K", "2,400", "Active"],
    ],
  },
  "Marketing Calendar": {
    kpis: [
      { label: "Events This Month", value: "12", change: "Campaigns + launches", up: null },
      { label: "Upcoming Launches", value: "3", change: "Next 30 days", up: null },
      { label: "Campaigns Live", value: "8", change: "Across all channels", up: null },
      { label: "Budget Committed", value: "£84K", change: "For this quarter", up: null },
    ],
    chartLabel: "Monthly Activity",
    chartData: [
      { name: "Week 1", primary: 3, secondary: 2 },
      { name: "Week 2", primary: 4, secondary: 1 },
      { name: "Week 3", primary: 2, secondary: 3 },
      { name: "Week 4", primary: 5, secondary: 2 },
    ],
    chartPrimaryKey: "Campaigns",
    chartSecondaryKey: "Launches",
    insights: [
      { type: "info", text: "Week 4 is busiest — 5 campaigns live + 2 product launches" },
      { type: "warn", text: "Content assets for Sep 1 campaign need to be ready by Aug 18" },
      { type: "good", text: "All Q3 campaigns delivered on schedule — strong execution" },
    ],
    tableHeaders: ["Event", "Date", "Type", "Budget", "Status"],
    tableRows: [
      ["SEO Content Sprint", "Aug 5–12", "Content", "£4K", "In Progress"],
      ["Meta Campaign Launch", "Aug 8", "Paid Media", "£8K", "Scheduled"],
      ["Email Newsletter", "Aug 12", "Email", "£200", "Draft"],
      ["Product Feature Launch", "Aug 15", "Launch", "£12K", "Planning"],
      ["Google Shopping Update", "Aug 20", "Paid Media", "£6K", "Planned"],
    ],
  },
  "Launch Planner": {
    kpis: [
      { label: "Active Launches", value: "2", change: "In preparation", up: null },
      { label: "Upcoming Launches", value: "3", change: "Next 90 days", up: null },
      { label: "Avg Launch Revenue (90d)", value: "£84K", change: "Per launch", up: null },
      { label: "Launch Readiness", value: "78%", change: "Current launch score", up: null },
    ],
    chartLabel: "Launch Performance History",
    chartData: [
      { name: "Launch 1", primary: 64000, secondary: 70000 },
      { name: "Launch 2", primary: 82000, secondary: 75000 },
      { name: "Launch 3", primary: 94000, secondary: 90000 },
      { name: "Launch 4 (plan)", primary: 0, secondary: 110000 },
    ],
    chartPrimaryKey: "Actual Revenue",
    chartSecondaryKey: "Target",
    insights: [
      { type: "good", text: "Last 3 launches averaged £80K revenue — strong execution playbook" },
      { type: "warn", text: "Launch 4 readiness at 78% — email sequence not yet built" },
      { type: "info", text: "Pre-launch waitlist strategy drove 42% day-1 conversion last time" },
    ],
    tableHeaders: ["Launch", "Date", "Status", "Readiness", "Revenue Target"],
    tableRows: [
      ["Feature v2.4", "Aug 15", "In Prep", "78%", "£110K"],
      ["Enterprise Plan", "Sep 1", "Planning", "42%", "£180K"],
      ["Mobile App", "Oct 15", "Concept", "18%", "£240K"],
    ],
  },
  "Quarter Planning": {
    kpis: [
      { label: "Q4 Revenue Target", value: "£1.04M", change: "+14% vs Q3", up: null },
      { label: "Total Q4 Budget", value: "£186K", change: "Across all channels", up: null },
      { label: "Planned Campaigns", value: "18", change: "Oct–Dec", up: null },
      { label: "Headcount Planned", value: "12 FTE", change: "No changes needed", up: null },
    ],
    chartLabel: "Q4 Budget Distribution",
    chartData: [
      { name: "Google Ads", primary: 48000 },
      { name: "Meta Ads", primary: 36000 },
      { name: "LinkedIn", primary: 28000 },
      { name: "Content", primary: 24000 },
      { name: "Email", primary: 18000 },
      { name: "SEO", primary: 16000 },
      { name: "Events", primary: 16000 },
    ],
    chartPrimaryKey: "Budget (£)",
    insights: [
      { type: "good", text: "Q4 plan projects £1.04M revenue — £124K above Q3 actuals" },
      { type: "info", text: "Black Friday allocated £28K budget — highest single campaign" },
      { type: "warn", text: "Agency contracts need renewal before Oct 1 — action required" },
    ],
    tableHeaders: ["Initiative", "Budget", "Owner", "Revenue Target", "Priority"],
    tableRows: [
      ["Paid Search Scale-up", "£48K", "Paid Team", "£280K", "Critical"],
      ["Black Friday Campaign", "£28K", "Growth", "£168K", "Critical"],
      ["Content SEO Push", "£24K", "Content", "£96K", "High"],
      ["LinkedIn Enterprise", "£28K", "B2B Team", "£140K", "High"],
      ["Email Nurture", "£18K", "Email", "£144K", "High"],
    ],
  },
  "Scenario Planning": {
    kpis: [
      { label: "Scenarios Modelled", value: "4", change: "Base, Bull, Bear, Stretch", up: null },
      { label: "Revenue Range", value: "£840K–£1.42M", change: "Q4 scenario spread", up: null },
      { label: "Confidence (Base)", value: "84%", change: "Most likely outcome", up: null },
      { label: "Upside Potential", value: "+£380K", change: "vs base scenario", up: true },
    ],
    chartLabel: "Scenario Revenue Projections",
    chartData: [
      { name: "Bear", primary: 840000 },
      { name: "Base", primary: 1040000 },
      { name: "Bull", primary: 1220000 },
      { name: "Stretch", primary: 1420000 },
    ],
    chartPrimaryKey: "Q4 Revenue (£)",
    insights: [
      { type: "info", text: "Base scenario (£1.04M) requires 14% MoM growth — achievable" },
      { type: "good", text: "Bull scenario (£1.22M) achievable if TikTok scales 3× planned" },
      { type: "warn", text: "Bear scenario risk: Google algorithm update reducing organic by 30%" },
    ],
    tableHeaders: ["Scenario", "Revenue", "Growth", "Assumptions", "Probability"],
    tableRows: [
      ["Bear Case", "£840K", "+0%", "Channels flat, no seasonality", "12%"],
      ["Base Case", "£1.04M", "+24%", "Current trajectory continues", "62%"],
      ["Bull Case", "£1.22M", "+45%", "TikTok 3× + organic uplift", "18%"],
      ["Stretch", "£1.42M", "+69%", "All channels outperform", "8%"],
    ],
  },
  "Competitors": {
    kpis: [
      { label: "Tracked Competitors", value: "8", change: "Direct + indirect", up: null },
      { label: "Share of Voice", value: "18%", change: "+3% this quarter", up: true },
      { label: "Keyword Overlap", value: "62%", change: "With top 3 competitors", up: null },
      { label: "Price Position", value: "Mid-market", change: "3rd lowest of 8", up: null },
    ],
    chartLabel: "Market Share of Voice",
    chartData: [
      { name: "Your Brand", primary: 18 },
      { name: "Competitor A", primary: 28 },
      { name: "Competitor B", primary: 22 },
      { name: "Competitor C", primary: 14 },
      { name: "Others", primary: 18 },
    ],
    chartPrimaryKey: "Share of Voice %",
    insights: [
      { type: "good", text: "Share of voice grew 3% this quarter — closing gap with Competitor B" },
      { type: "warn", text: "Competitor A increased ad spend 40% last month — monitor closely" },
      { type: "info", text: "62% keyword overlap with top 3 — strong differentiation opportunity" },
    ],
    tableHeaders: ["Competitor", "Est. Traffic", "DA", "Ad Spend Est.", "SoV"],
    tableRows: [
      ["Competitor A", "840K/mo", "68", "£180K/mo", "28%"],
      ["Competitor B", "620K/mo", "61", "£120K/mo", "22%"],
      ["Your Brand", "380K/mo", "54", "£68K/mo", "18%"],
      ["Competitor C", "280K/mo", "48", "£52K/mo", "14%"],
      ["Competitor D", "210K/mo", "44", "£38K/mo", "10%"],
    ],
  },
  "Opportunities": {
    kpis: [
      { label: "Open Opportunities", value: "22", change: "8 high value", up: null },
      { label: "Total Revenue Potential", value: "£184K/mo", change: "If all actioned", up: true },
      { label: "Quick Wins", value: "9", change: "Low effort, high impact", up: null },
      { label: "Actioned (30d)", value: "8", change: "+£42K revenue", up: true },
    ],
    chartLabel: "Opportunities by Revenue Impact",
    chartData: [
      { name: ">£20K", primary: 4 },
      { name: "£10–20K", primary: 6 },
      { name: "£5–10K", primary: 8 },
      { name: "<£5K", primary: 4 },
    ],
    chartPrimaryKey: "Opportunities",
    insights: [
      { type: "good", text: "4 opportunities with £20K+ monthly revenue potential identified" },
      { type: "good", text: "9 quick wins available — all low effort and under £5K implementation cost" },
      { type: "info", text: "AI confidence on top opportunity: 92%" },
    ],
    tableHeaders: ["Opportunity", "Monthly Upside", "Effort", "Confidence", "Priority"],
    tableRows: [
      ["Scale Google branded search", "+£28K/mo", "Low", "94%", "Critical"],
      ["Launch cart abandonment email", "+£24K/mo", "Medium", "88%", "High"],
      ["Expand to TikTok shopping", "+£18K/mo", "Medium", "81%", "High"],
      ["Upsell to annual billing", "+£16K/mo", "Low", "86%", "High"],
      ["Retarget blog visitors", "+£12K/mo", "Low", "91%", "High"],
    ],
  },
  "Customer Journey": {
    kpis: [
      { label: "Avg Journey Length", value: "4.2 touches", change: "+0.3 vs last month", up: null },
      { label: "Avg Time to Convert", value: "12 days", change: "-2 days vs Q2", up: true },
      { label: "Top Entry Point", value: "Google Ads", change: "34% of journeys", up: null },
      { label: "Top Exit (lost)", value: "Pricing Page", change: "18% drop-off", up: false },
    ],
    chartLabel: "Journey Stage Conversion",
    chartData: [
      { name: "Awareness", primary: 100 },
      { name: "Consideration", primary: 42 },
      { name: "Intent", primary: 24 },
      { name: "Evaluation", primary: 14 },
      { name: "Purchase", primary: 8 },
      { name: "Loyalty", primary: 6 },
    ],
    chartPrimaryKey: "% of Users",
    insights: [
      { type: "warn", text: "Biggest drop-off at Consideration → Intent (42% to 24%) — content gap" },
      { type: "good", text: "Average time to convert reduced by 2 days after new onboarding" },
      { type: "info", text: "Multi-touch paths with 5+ touches convert at 2.4× single-touch" },
    ],
    tableHeaders: ["Stage", "Users", "Conversion Rate", "Avg Time", "Drop-off"],
    tableRows: [
      ["Awareness", "100K", "42%", "0 days", "58%"],
      ["Consideration", "42K", "57%", "3 days", "43%"],
      ["Intent", "24K", "58%", "7 days", "42%"],
      ["Evaluation", "14K", "57%", "10 days", "43%"],
      ["Purchase", "8K", "75%", "12 days", "25%"],
    ],
  },
  "Retention": {
    kpis: [
      { label: "Customer Retention", value: "87%", change: "+2% vs last month", up: true },
      { label: "Net Revenue Retention", value: "112%", change: "+4% vs last month", up: true },
      { label: "Churn Rate", value: "2.1%", change: "-0.4% vs last month", up: true },
      { label: "LTV (avg)", value: "£2,840", change: "+£180 vs Q2", up: true },
    ],
    chartLabel: "Retention Cohort Performance",
    chartData: MONTHS.map((m, i) => ({ name: m, primary: 94 - i * 0.8 + (i % 4 === 0 ? 1.2 : 0) })),
    chartPrimaryKey: "Month 1 Retention %",
    insights: [
      { type: "good", text: "NRR at 112% — existing customers expanding faster than churn" },
      { type: "good", text: "Win-back campaign recovered 28% of churned accounts last month" },
      { type: "warn", text: "Accounts in risk tier: 42 — engage before 30-day mark" },
    ],
    tableHeaders: ["Cohort", "Month 1", "Month 3", "Month 6", "Month 12"],
    tableRows: [
      ["Jan 2024", "96%", "89%", "84%", "—"],
      ["Feb 2024", "94%", "87%", "82%", "—"],
      ["Mar 2024", "95%", "88%", "—", "—"],
      ["Apr 2024", "93%", "86%", "—", "—"],
      ["May 2024", "94%", "—", "—", "—"],
    ],
  },
};

// Fallback config generator by section
function getFallbackConfig(title: string, section: string): PageConfig {
  const s = seed(title);
  const base = 1000 + (s % 8000);
  const trend = makeTrend(base, 0.12, true);
  return {
    kpis: [
      { label: "Total Volume", value: (base * 12).toLocaleString(), change: `+${8 + (s % 18)}% this month`, up: true },
      { label: "Growth Rate", value: `+${10 + (s % 24)}%`, change: "Month over month", up: true },
      { label: "Performance Score", value: `${62 + (s % 32)} / 100`, change: `+${3 + (s % 8)} pts`, up: true },
      { label: "Efficiency", value: `${72 + (s % 20)}%`, change: `+${2 + (s % 6)}%`, up: true },
    ],
    chartLabel: `${title} Trend`,
    chartData: MONTHS.map((m, i) => ({ name: m, primary: trend[i] })),
    chartPrimaryKey: "Volume",
    insights: [
      { type: "good", text: `${title} performance improving — up ${10 + (s % 18)}% this month` },
      { type: "info", text: `AI analysis identifies 3 optimisation opportunities for ${section}` },
      { type: "warn", text: `Monitor performance closely — market conditions shifting in Q4` },
    ],
    tableHeaders: ["Metric", "This Month", "Last Month", "Change", "Status"],
    tableRows: [
      ["Primary KPI", `${(base * 1.14).toFixed(0)}`, `${base}`, "+14%", "On Track"],
      ["Secondary KPI", `${(base * 0.48).toFixed(0)}`, `${(base * 0.44).toFixed(0)}`, "+9%", "On Track"],
      ["Efficiency Score", `${72 + (s % 20)}%`, `${69 + (s % 20)}%`, "+3%", "Good"],
      ["Quality Index", `${78 + (s % 16)}`, `${74 + (s % 16)}`, "+4", "Improving"],
    ],
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ kpi }: { kpi: KPI }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
      <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
      <div className="flex items-center gap-1">
        {kpi.up === true && <TrendingUp className="h-3 w-3 text-emerald-500" />}
        {kpi.up === false && <TrendingDown className="h-3 w-3 text-red-500" />}
        {kpi.up === null && <Minus className="h-3 w-3 text-muted-foreground" />}
        <span className={cn(
          "text-[11px] font-medium",
          kpi.up === true && "text-emerald-600 dark:text-emerald-400",
          kpi.up === false && "text-red-600 dark:text-red-400",
          kpi.up === null && "text-muted-foreground",
        )}>{kpi.change}</span>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-lg border p-3 text-sm",
      insight.type === "good" && "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
      insight.type === "warn" && "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
      insight.type === "info" && "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30",
    )}>
      {insight.type === "good" && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
      {insight.type === "warn" && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
      {insight.type === "info" && <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
      <p className={cn(
        "font-medium",
        insight.type === "good" && "text-emerald-800 dark:text-emerald-300",
        insight.type === "warn" && "text-amber-800 dark:text-amber-300",
        insight.type === "info" && "text-blue-800 dark:text-blue-300",
      )}>{insight.text}</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface DemoPageTemplateProps {
  title: string;
  section: string;
  chartType?: "area" | "bar";
}

export function DemoPageTemplate({ title, section, chartType }: DemoPageTemplateProps) {
  const cfg: PageConfig = PAGE_CONFIGS[title] ?? getFallbackConfig(title, section);
  const useBar = chartType === "bar" || (!cfg.chartSecondaryKey && cfg.chartData.length <= 8 && cfg.chartData[0].name.length > 3 && !MONTHS.includes(cfg.chartData[0].name));

  return (
    <>
      <PageHeader title={title} />
      <PageContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cfg.kpis.map((k) => <StatCard key={k.label} kpi={k} />)}
        </div>

        {/* Chart + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold mb-4 text-foreground">{cfg.chartLabel}</p>
            <ResponsiveContainer width="100%" height={240}>
              {useBar ? (
                <BarChart data={cfg.chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  {cfg.chartSecondaryKey && <Legend wrapperStyle={{ fontSize: 11 }} />}
                  <Bar dataKey="primary" name={cfg.chartPrimaryKey} fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                  {cfg.chartSecondaryKey && <Bar dataKey="secondary" name={cfg.chartSecondaryKey} fill="hsl(262 83% 58% / 0.3)" radius={[4, 4, 0, 0]} />}
                </BarChart>
              ) : (
                <AreaChart data={cfg.chartData}>
                  <defs>
                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={`grad2-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220 83% 58%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(220 83% 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  {cfg.chartSecondaryKey && <Legend wrapperStyle={{ fontSize: 11 }} />}
                  <Area type="monotone" dataKey="primary" name={cfg.chartPrimaryKey} stroke="hsl(262 83% 58%)" strokeWidth={2} fill={`url(#grad-${title})`} dot={false} />
                  {cfg.chartSecondaryKey && <Area type="monotone" dataKey="secondary" name={cfg.chartSecondaryKey} stroke="hsl(220 83% 58%)" strokeWidth={2} fill={`url(#grad2-${title})`} dot={false} strokeDasharray="4 2" />}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">AI Insights</p>
            </div>
            {cfg.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {cfg.tableHeaders.map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cfg.tableRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className={cn(
                        "px-4 py-2.5",
                        ci === 0 ? "font-medium text-foreground" : "text-muted-foreground",
                        (cell.startsWith("+") || cell.startsWith("↑") || cell.includes("Ahead") || cell.includes("Excellent") || cell.includes("On Track") || cell.includes("Active") || cell.includes("Fixed") || cell.includes("Good")) && ci > 0 && "text-emerald-600 dark:text-emerald-400 font-medium",
                        (cell.startsWith("-") || cell.startsWith("↓") || cell.includes("At Risk") || cell.includes("Poor") || cell.includes("Fatigue") || cell.includes("Risk")) && ci > 0 && "text-red-600 dark:text-red-400 font-medium",
                        (cell.includes("Needs Work") || cell.includes("Fixing") || cell.includes("Warning") || cell.includes("Critical")) && ci > 0 && "text-amber-600 dark:text-amber-400 font-medium",
                      )}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContent>
    </>
  );
}
