/**
 * Realistic multi-platform campaign demo data.
 * Designed to show the AI making meaningful platform comparisons —
 * especially Instagram (high ROAS) vs Facebook (declining).
 */

export type CampaignHealth = "scale" | "monitor" | "pause" | "test";

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  placement: string;       // Instagram Feed, Facebook Feed, etc.
  type: string;            // "Search" | "Shopping" | "PMax" | "Video" | "Display" | "Story" etc.
  status: "active" | "paused";
  spend: number;           // Monthly $
  revenue: number;         // Attributed revenue $
  roas: number;
  cpa: number;
  ctr: number;             // 0–1
  impressions: number;
  clicks: number;
  conversions: number;
  weeklyTrend: number[];   // last 4 weeks ROAS
  health: CampaignHealth;
  aiNote: string;          // one-line AI observation
}

export interface PlatformSummary {
  platform: string;
  label: string;
  logo: string;
  color: string;
  bgColor: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  campaigns: number;
  health: CampaignHealth;
  healthReason: string;
  recommendation: string;
  budgetMove?: { action: "increase" | "decrease" | "pause"; amount: number; reason: string };
}

// ─── Campaign data ─────────────────────────────────────────────────────────────

export const CAMPAIGNS: Campaign[] = [
  // ── Google Ads ──────────────────────────────────────────────────────────────
  {
    id: "g1",
    name: "Google Shopping — All Products",
    platform: "google_ads",
    placement: "Google Shopping",
    type: "Shopping",
    status: "active",
    spend: 3200,
    revenue: 19840,
    roas: 6.20,
    cpa: 8.90,
    ctr: 0.042,
    impressions: 142000,
    clicks: 5964,
    conversions: 359,
    weeklyTrend: [5.8, 6.0, 6.1, 6.2],
    health: "scale",
    aiNote: "Your most efficient campaign — ROAS trending up for 4 weeks straight.",
  },
  {
    id: "g2",
    name: "Google PMax — Core Audience",
    platform: "google_ads",
    placement: "Performance Max",
    type: "PMax",
    status: "active",
    spend: 2800,
    revenue: 15680,
    roas: 5.60,
    cpa: 11.20,
    ctr: 0.038,
    impressions: 198000,
    clicks: 7524,
    conversions: 250,
    weeklyTrend: [5.1, 5.3, 5.5, 5.6],
    health: "scale",
    aiNote: "PMax is improving week-on-week. Safe to increase budget by 20%.",
  },
  {
    id: "g3",
    name: "Google Search — Brand Keywords",
    platform: "google_ads",
    placement: "Google Search",
    type: "Search",
    status: "active",
    spend: 1400,
    revenue: 5880,
    roas: 4.20,
    cpa: 14.00,
    ctr: 0.071,
    impressions: 52000,
    clicks: 3692,
    conversions: 100,
    weeklyTrend: [4.0, 4.1, 4.2, 4.2],
    health: "monitor",
    aiNote: "Stable brand defence. Maintain current budget.",
  },
  {
    id: "g4",
    name: "Google Display — Retargeting",
    platform: "google_ads",
    placement: "Display Network",
    type: "Display",
    status: "active",
    spend: 680,
    revenue: 952,
    roas: 1.40,
    cpa: 38.00,
    ctr: 0.004,
    impressions: 380000,
    clicks: 1520,
    conversions: 17,
    weeklyTrend: [1.9, 1.7, 1.5, 1.4],
    health: "pause",
    aiNote: "Below break-even ROAS and worsening — pause and reallocate to Shopping.",
  },
  {
    id: "g5",
    name: "Google Search — Competitor Terms",
    platform: "google_ads",
    placement: "Google Search",
    type: "Search",
    status: "active",
    spend: 920,
    revenue: 2484,
    roas: 2.70,
    cpa: 22.00,
    ctr: 0.055,
    impressions: 41000,
    clicks: 2255,
    conversions: 41,
    weeklyTrend: [2.5, 2.6, 2.7, 2.7],
    health: "monitor",
    aiNote: "Marginally profitable. A/B test new ad copy before scaling.",
  },

  // ── Meta — Instagram ────────────────────────────────────────────────────────
  {
    id: "m1",
    name: "Instagram Feed — Bestsellers",
    platform: "meta_ads",
    placement: "Instagram Feed",
    type: "Image/Video",
    status: "active",
    spend: 2400,
    revenue: 12480,
    roas: 5.20,
    cpa: 12.00,
    ctr: 0.032,
    impressions: 210000,
    clicks: 6720,
    conversions: 200,
    weeklyTrend: [4.4, 4.7, 5.0, 5.2],
    health: "scale",
    aiNote: "Instagram is accelerating — ROAS up 18% in 4 weeks. Top priority to scale.",
  },
  {
    id: "m2",
    name: "Instagram Stories — Promo",
    platform: "meta_ads",
    placement: "Instagram Stories",
    type: "Story",
    status: "active",
    spend: 1100,
    revenue: 4730,
    roas: 4.30,
    cpa: 14.30,
    ctr: 0.028,
    impressions: 165000,
    clicks: 4620,
    conversions: 76,
    weeklyTrend: [3.8, 4.0, 4.2, 4.3],
    health: "scale",
    aiNote: "Stories converting well with younger audience. Test Reels format next.",
  },
  {
    id: "m3",
    name: "Instagram Reels — UGC Content",
    platform: "meta_ads",
    placement: "Instagram Reels",
    type: "Video",
    status: "active",
    spend: 800,
    revenue: 2640,
    roas: 3.30,
    cpa: 18.20,
    ctr: 0.041,
    impressions: 289000,
    clicks: 11849,
    conversions: 43,
    weeklyTrend: [2.4, 2.8, 3.1, 3.3],
    health: "monitor",
    aiNote: "Reels showing strong growth trend — give it 2 more weeks before scaling.",
  },

  // ── Meta — Facebook ─────────────────────────────────────────────────────────
  {
    id: "m4",
    name: "Facebook Feed — Awareness",
    platform: "meta_ads",
    placement: "Facebook Feed",
    type: "Image",
    status: "active",
    spend: 1800,
    revenue: 3240,
    roas: 1.80,
    cpa: 42.00,
    ctr: 0.009,
    impressions: 290000,
    clicks: 2610,
    conversions: 43,
    weeklyTrend: [2.4, 2.2, 2.0, 1.8],
    health: "pause",
    aiNote: "Facebook Feed ROAS declining 4 weeks in a row. Audience fatigued — pause now.",
  },
  {
    id: "m5",
    name: "Facebook Carousel — Products",
    platform: "meta_ads",
    placement: "Facebook Feed",
    type: "Carousel",
    status: "active",
    spend: 1200,
    revenue: 1680,
    roas: 1.40,
    cpa: 54.00,
    ctr: 0.007,
    impressions: 224000,
    clicks: 1568,
    conversions: 22,
    weeklyTrend: [2.1, 1.9, 1.6, 1.4],
    health: "pause",
    aiNote: "Second Facebook campaign also declining — clear platform saturation signal.",
  },
  {
    id: "m6",
    name: "Facebook Retargeting — Abandoned Cart",
    platform: "meta_ads",
    placement: "Facebook Feed",
    type: "Retargeting",
    status: "active",
    spend: 540,
    revenue: 2916,
    roas: 5.40,
    cpa: 9.80,
    ctr: 0.052,
    impressions: 38000,
    clicks: 1976,
    conversions: 55,
    weeklyTrend: [5.1, 5.2, 5.3, 5.4],
    health: "scale",
    aiNote: "Retargeting always wins. This is an exception — keep it and increase budget.",
  },

  // ── TikTok ──────────────────────────────────────────────────────────────────
  {
    id: "t1",
    name: "TikTok In-Feed — Trending Sound",
    platform: "tiktok_ads",
    placement: "TikTok In-Feed",
    type: "Video",
    status: "active",
    spend: 1600,
    revenue: 5760,
    roas: 3.60,
    cpa: 19.00,
    ctr: 0.068,
    impressions: 312000,
    clicks: 21216,
    conversions: 84,
    weeklyTrend: [2.8, 3.1, 3.4, 3.6],
    health: "monitor",
    aiNote: "TikTok growing fast with young audience. Strong creative momentum — test $500 budget uplift.",
  },
  {
    id: "t2",
    name: "TikTok TopView — Launch Campaign",
    platform: "tiktok_ads",
    placement: "TikTok TopView",
    type: "Video",
    status: "active",
    spend: 2200,
    revenue: 4400,
    roas: 2.00,
    cpa: 31.00,
    ctr: 0.052,
    impressions: 580000,
    clicks: 30160,
    conversions: 71,
    weeklyTrend: [2.2, 2.1, 2.0, 2.0],
    health: "monitor",
    aiNote: "Brand awareness play. ROAS is low but reach is enormous — review if brand-building is the goal.",
  },

  // ── LinkedIn ─────────────────────────────────────────────────────────────────
  {
    id: "l1",
    name: "LinkedIn Sponsored Content — B2B",
    platform: "linkedin_ads",
    placement: "LinkedIn Feed",
    type: "Sponsored Content",
    status: "active",
    spend: 1800,
    revenue: 9000,
    roas: 5.00,
    cpa: 45.00,
    ctr: 0.008,
    impressions: 92000,
    clicks: 736,
    conversions: 40,
    weeklyTrend: [4.6, 4.8, 4.9, 5.0],
    health: "scale",
    aiNote: "B2B leads have high CPA ($45) but high LTV. ROAS 5× is exceptional for LinkedIn.",
  },
  {
    id: "l2",
    name: "LinkedIn InMail — Decision Makers",
    platform: "linkedin_ads",
    placement: "LinkedIn InMail",
    type: "Message Ad",
    status: "active",
    spend: 900,
    revenue: 4500,
    roas: 5.00,
    cpa: 50.00,
    ctr: 0.022,
    impressions: 18000,
    clicks: 396,
    conversions: 18,
    weeklyTrend: [4.4, 4.7, 4.9, 5.0],
    health: "scale",
    aiNote: "InMail outperforming Sponsored Content — shift more LinkedIn budget here.",
  },

  // ── Snapchat ─────────────────────────────────────────────────────────────────
  {
    id: "s1",
    name: "Snapchat Story Ads — Gen Z",
    platform: "snapchat_ads",
    placement: "Snapchat Stories",
    type: "Story",
    status: "active",
    spend: 700,
    revenue: 840,
    roas: 1.20,
    cpa: 58.00,
    ctr: 0.011,
    impressions: 195000,
    clicks: 2145,
    conversions: 12,
    weeklyTrend: [1.5, 1.4, 1.3, 1.2],
    health: "pause",
    aiNote: "Snapchat underperforming across all metrics. Audience overlap with TikTok but worse results.",
  },
];

// ─── Platform summaries ────────────────────────────────────────────────────────

export function buildPlatformSummaries(): PlatformSummary[] {
  const platforms: Record<string, { label: string; logo: string; color: string; bgColor: string }> = {
    google_ads:   { label: "Google Ads",   logo: "🔵", color: "#4285F4", bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40" },
    meta_ads:     { label: "Meta Ads",     logo: "📘", color: "#0866FF", bgColor: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40" },
    tiktok_ads:   { label: "TikTok Ads",   logo: "🎵", color: "#010101", bgColor: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700" },
    linkedin_ads: { label: "LinkedIn Ads", logo: "💼", color: "#0A66C2", bgColor: "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40" },
    snapchat_ads: { label: "Snapchat Ads", logo: "👻", color: "#FFFC00", bgColor: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/40" },
  };

  const summaries: PlatformSummary[] = [];

  for (const [platformId, meta] of Object.entries(platforms)) {
    const cams = CAMPAIGNS.filter((c) => c.platform === platformId);
    if (cams.length === 0) continue;

    const spend   = cams.reduce((s, c) => s + c.spend, 0);
    const revenue = cams.reduce((s, c) => s + c.revenue, 0);
    const convs   = cams.reduce((s, c) => s + c.conversions, 0);
    const roas    = spend > 0 ? revenue / spend : 0;
    const cpa     = convs > 0 ? spend / convs : 0;

    // Health = weighted by spend
    const pauseSpend = cams.filter(c => c.health === "pause").reduce((s, c) => s + c.spend, 0);
    const scaleSpend = cams.filter(c => c.health === "scale").reduce((s, c) => s + c.spend, 0);
    const health: CampaignHealth = roas >= 4.0 ? "scale" : roas >= 2.5 ? "monitor" : "pause";

    // Platform-specific insight
    let healthReason = "";
    let recommendation = "";
    let budgetMove: PlatformSummary["budgetMove"] | undefined;

    if (platformId === "google_ads") {
      healthReason = "Shopping & PMax dominating with 5.6–6.2× ROAS";
      recommendation = "Increase Shopping budget by £800/month. Pause Display retargeting.";
      budgetMove = { action: "increase", amount: 800, reason: "Shopping ROAS 6.2× — your top performer" };
    } else if (platformId === "meta_ads") {
      healthReason = "Instagram strong (4.3–5.4× ROAS) but Facebook Feed declining";
      recommendation = "Move £3,000/month from Facebook Feed to Instagram Feed & Stories.";
      budgetMove = { action: "increase", amount: 3000, reason: "Instagram ROAS 5.2× vs Facebook 1.4–1.8×" };
    } else if (platformId === "tiktok_ads") {
      healthReason = "In-Feed growing fast, TopView ROAS low but brand awareness is high";
      recommendation = "Shift £600/month from TopView to In-Feed — better conversion rate.";
      budgetMove = { action: "increase", amount: 600, reason: "In-Feed growing 28% in 4 weeks" };
    } else if (platformId === "linkedin_ads") {
      healthReason = "InMail outperforming Sponsored Content for B2B leads";
      recommendation = "Increase InMail budget by £400/month. This is your best B2B channel.";
      budgetMove = { action: "increase", amount: 400, reason: "5× ROAS on B2B audience" };
    } else if (platformId === "snapchat_ads") {
      healthReason = "All campaigns declining — 1.2× ROAS, CPA £58, audience overlap with TikTok";
      recommendation = "Pause all Snapchat campaigns. Reallocate £700/month to Instagram.";
      budgetMove = { action: "pause", amount: 700, reason: "Underperforming vs TikTok for same Gen Z audience" };
    }

    summaries.push({
      platform: platformId,
      ...meta,
      spend,
      revenue,
      roas,
      cpa,
      campaigns: cams.length,
      health,
      healthReason,
      recommendation,
      budgetMove,
    });
  }

  // Sort: scale first, then monitor, then pause
  const order = { scale: 0, monitor: 1, test: 2, pause: 3 };
  return summaries.sort((a, b) => order[a.health] - order[b.health]);
}

// ─── AI strategic brief ────────────────────────────────────────────────────────

export interface AiStrategicBrief {
  headline: string;
  summary: string;
  priority1: { title: string; detail: string; impact: string; action: string };
  priority2: { title: string; detail: string; impact: string; action: string };
  priority3: { title: string; detail: string; impact: string; action: string };
  weeklyPlan: string[];
  totalMonthlySpend: number;
  estimatedMonthlyRevenue: number;
  blendedRoas: number;
  campaignsToScale: string[];
  campaignsToPause: string[];
}

export function buildAiStrategicBrief(): AiStrategicBrief {
  const totalSpend   = CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const blendedRoas  = totalRevenue / totalSpend;

  const scale = CAMPAIGNS.filter(c => c.health === "scale").map(c => c.name);
  const pause = CAMPAIGNS.filter(c => c.health === "pause").map(c => c.name);

  return {
    headline: `You have ${CAMPAIGNS.length} active campaigns across 5 platforms. Here's where to focus:`,
    summary: `Blended ROAS is ${blendedRoas.toFixed(2)}× on £${(totalSpend / 1000).toFixed(1)}k monthly spend. Instagram is your fastest-growing channel while Facebook Feed is declining — this is your biggest opportunity. Pausing underperformers and reallocating to Instagram + Google Shopping could add ~£8,200 in monthly revenue without increasing total budget.`,
    priority1: {
      title: "🚀 Scale Instagram — your fastest-growing channel",
      detail: `Instagram Feed is at 5.2× ROAS and improving every week. Facebook Feed is at 1.4–1.8× ROAS and declining. These are the same Meta budget but completely different returns. Move £3,000/month from Facebook Feed campaigns to Instagram Feed & Stories immediately.`,
      impact: "+£8,400 estimated additional monthly revenue",
      action: "Pause Facebook Feed (£3,000/month) → Increase Instagram Feed & Stories",
    },
    priority2: {
      title: "✅ Google Shopping & PMax — push harder",
      detail: `Your Google Shopping campaign is at 6.2× ROAS — your best performing campaign across all platforms. PMax is at 5.6× and improving. Combined they deliver £35,520 revenue on £6,000 spend. Increasing their budget by £1,600/month could yield an additional £9,600+ in revenue.`,
      impact: "+£9,600 estimated additional monthly revenue",
      action: "Increase Google Shopping by £800/month + PMax by £800/month",
    },
    priority3: {
      title: "🗑️ Cut the dead weight — 4 campaigns to pause",
      detail: `Google Display (1.4× ROAS), Facebook Feed (1.8×), Facebook Carousel (1.4×), and Snapchat Story Ads (1.2×) are all below the 2× minimum threshold. Combined they spend £4,380/month and return barely above break-even. Pausing these frees up budget for high-performers.`,
      impact: "£4,380/month freed up, reallocated to 5.2–6.2× ROAS channels",
      action: "Pause 4 underperforming campaigns immediately",
    },
    weeklyPlan: [
      "Day 1: Pause Facebook Feed Awareness + Facebook Carousel campaigns (save £3,000/month)",
      "Day 1: Pause Snapchat Story Ads + Google Display Retargeting (save £1,380/month)",
      "Day 2: Increase Instagram Feed budget from £2,400 → £3,800/month",
      "Day 2: Increase Instagram Stories budget from £1,100 → £1,700/month",
      "Day 3: Increase Google Shopping budget from £3,200 → £4,000/month",
      "Day 3: Increase Google PMax budget from £2,800 → £3,600/month",
      "Week 2: Test 2 new Instagram Reels creatives (UGC-style performing best)",
      "Week 2: Review TikTok In-Feed results — if CTR holds, increase budget by £400",
      "Week 3: Review LinkedIn InMail performance — increase by £400 if leads are qualified",
      "Week 4: Review all changes, report on blended ROAS improvement",
    ],
    totalMonthlySpend: totalSpend,
    estimatedMonthlyRevenue: totalRevenue,
    blendedRoas,
    campaignsToScale: scale,
    campaignsToPause: pause,
  };
}
