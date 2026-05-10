"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tv2, Play, Pause, ChevronLeft, ChevronRight, Settings,
  Maximize2, Clock, Zap, TrendingUp, BarChart3, Target,
  RefreshCw, Wifi, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ─── Slide definitions ────────────────────────────────────────────────────────
interface Slide {
  id: string;
  title: string;
  subtitle: string;
  color: string;       // Tailwind gradient
  component: React.FC<{ fullscreen: boolean }>;
}

// ── Slide 1: Blended KPIs ─────────────────────────────────────────────────────
const KPISlide: React.FC<{ fullscreen: boolean }> = ({ fullscreen }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
    <h2 className={cn("font-bold text-white/90 tracking-tight", fullscreen ? "text-4xl" : "text-2xl")}>
      Blended Performance · May 2026
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
      {[
        { label: "Blended ROAS",   value: "4.44×",   change: "+12.3%", good: true },
        { label: "Total Spend",    value: "$16.7k",   change: "+14.1%", good: null },
        { label: "Total Revenue",  value: "$74.1k",   change: "+28.4%", good: true },
        { label: "Blended CPA",    value: "$14.20",   change: "−8.4%",  good: true },
      ].map((k) => (
        <div key={k.label} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 text-center">
          <p className={cn("font-bold text-white", fullscreen ? "text-4xl" : "text-2xl")}>{k.value}</p>
          <p className="text-white/70 text-xs mt-1">{k.label}</p>
          <p className={cn("text-sm font-semibold mt-2", k.good === true ? "text-emerald-300" : k.good === false ? "text-red-300" : "text-white/60")}>
            {k.change}
          </p>
        </div>
      ))}
    </div>
    <div className="w-full max-w-4xl rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={[
          { month: "Jan", revenue: 28.5, spend: 9.2 },
          { month: "Feb", revenue: 41.1, spend: 11.4 },
          { month: "Mar", revenue: 51.2, spend: 13.1 },
          { month: "Apr", revenue: 63.0, spend: 15.0 },
          { month: "May", revenue: 74.1, spend: 16.7 },
        ]}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
          <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8 }} />
          <Area type="monotone" dataKey="revenue" stroke="#34d399" fill="rgba(52,211,153,0.2)" strokeWidth={2} />
          <Area type="monotone" dataKey="spend"   stroke="#60a5fa" fill="rgba(96,165,250,0.2)"  strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ── Slide 2: Platform ROAS comparison ─────────────────────────────────────────
const PlatformSlide: React.FC<{ fullscreen: boolean }> = ({ fullscreen }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
    <h2 className={cn("font-bold text-white/90 tracking-tight", fullscreen ? "text-4xl" : "text-2xl")}>
      ROAS by Platform
    </h2>
    <div className="w-full max-w-3xl rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={[
          { platform: "PMax",     roas: 6.37 },
          { platform: "Shopping", roas: 5.00 },
          { platform: "Search",   roas: 4.44 },
          { platform: "Meta",     roas: 3.21 },
          { platform: "TikTok",   roas: 2.88 },
          { platform: "Snapchat", roas: 1.52 },
        ]} margin={{ left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="platform" tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 13 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
          <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8 }} formatter={(v: number) => [`${v}×`, "ROAS"]} />
          <Bar dataKey="roas" radius={[6, 6, 0, 0]}
            fill="url(#roasGrad)"
            label={{ position: "top", formatter: (v: number) => `${v}×`, fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
          />
          <defs>
            <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
      {[
        { label: "Best Performer",  value: "PMax 6.37×",  icon: "🏆" },
        { label: "Most Growth",     value: "TikTok +22%", icon: "🚀" },
        { label: "Needs Attention", value: "Snapchat 1.5×",icon: "⚠️" },
      ].map((k) => (
        <div key={k.label} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 text-center">
          <p className="text-2xl mb-1">{k.icon}</p>
          <p className="text-white font-bold">{k.value}</p>
          <p className="text-white/60 text-xs">{k.label}</p>
        </div>
      ))}
    </div>
  </div>
);

// ── Slide 3: Goals Progress ────────────────────────────────────────────────────
const GoalsSlide: React.FC<{ fullscreen: boolean }> = ({ fullscreen }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
    <h2 className={cn("font-bold text-white/90 tracking-tight", fullscreen ? "text-4xl" : "text-2xl")}>
      Q2 Goals Progress
    </h2>
    <div className="w-full max-w-3xl space-y-4">
      {[
        { title: "Ad Revenue $250k", progress: 76, status: "On Track",  color: "#34d399" },
        { title: "CPA below $12",    progress: 58, status: "At Risk",   color: "#fbbf24" },
        { title: "120k Organic/mo",  progress: 38, status: "Behind",    color: "#f87171" },
        { title: "Blended ROAS 4×",  progress: 100, status: "Achieved", color: "#60a5fa" },
        { title: "1,000 LinkedIn Conv", progress: 62, status: "On Track", color: "#34d399" },
      ].map((g) => (
        <div key={g.title} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{g.title}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: g.color }}>{g.status}</span>
              <span className="text-white font-bold w-12 text-right">{g.progress}%</span>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Slide 4: AI Insights ───────────────────────────────────────────────────────
const AISlide: React.FC<{ fullscreen: boolean }> = ({ fullscreen }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center">
        <Zap className="h-5 w-5 text-violet-300" />
      </div>
      <h2 className={cn("font-bold text-white/90 tracking-tight", fullscreen ? "text-4xl" : "text-2xl")}>
        AI Action Items
      </h2>
    </div>
    <div className="w-full max-w-3xl space-y-4">
      {[
        { emoji: "🚀", priority: "High",   text: "Scale Google PMax by $800/month — estimated +$5.1k revenue at same ROAS." },
        { emoji: "⛔", priority: "High",   text: "Pause 8 Meta ad sets with CPA > $20 — saves $1,240/month instantly." },
        { emoji: "🔗", priority: "Medium", text: "Add internal links to 47 quick-win keywords in positions 5–12 — targets +18% organic clicks." },
        { emoji: "📱", priority: "Medium", text: "Mobile CTR is 55% below desktop. Audit landing page mobile UX this week." },
        { emoji: "💡", priority: "Low",    text: "TikTok burst campaign with $3.3k remaining May budget — estimated $9.5k extra revenue." },
      ].map((a, i) => (
        <div key={i} className="flex items-start gap-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4">
          <span className="text-2xl shrink-0">{a.emoji}</span>
          <div className="flex-1">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full mr-2", a.priority === "High" ? "bg-red-500/30 text-red-300" : a.priority === "Medium" ? "bg-amber-500/30 text-amber-300" : "bg-blue-500/30 text-blue-300")}>
              {a.priority}
            </span>
            <span className="text-white text-sm leading-relaxed">{a.text}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── All slides ───────────────────────────────────────────────────────────────
const SLIDES: Slide[] = [
  { id: "kpi",      title: "Blended KPIs",      subtitle: "All Platforms · May 2026",    color: "from-violet-900 via-purple-800 to-indigo-900",  component: KPISlide      },
  { id: "platform", title: "Platform ROAS",      subtitle: "Performance Comparison",      color: "from-blue-900 via-blue-800 to-cyan-900",        component: PlatformSlide  },
  { id: "goals",    title: "Q2 Goals",           subtitle: "OKR Progress Tracker",        color: "from-emerald-900 via-teal-800 to-green-900",    component: GoalsSlide     },
  { id: "ai",       title: "AI Action Items",    subtitle: "Smart Recommendations",       color: "from-rose-900 via-pink-800 to-fuchsia-900",     component: AISlide        },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TVPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [interval, setIntervalSec] = useState(10);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const next = useCallback(() => setCurrentIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = () => setCurrentIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  // Auto-advance
  useEffect(() => {
    if (!playing) { setElapsed(0); return; }
    const tick = setInterval(() => {
      setElapsed((e) => {
        if (e >= interval - 1) { next(); return 0; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [playing, interval, next]);

  // Reset elapsed when slide changes
  useEffect(() => setElapsed(0), [currentIndex]);

  const slide = SLIDES[currentIndex];
  const SlideComp = slide.component;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  return (
    <>
      <PageHeader title="TV Mode / Looped Boards" />
      <PageContent>
      {/* Settings panel */}
      {showSettings && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Slide duration:</span>
            {[5, 10, 15, 30, 60].map((s) => (
              <button
                key={s}
                onClick={() => setIntervalSec(s)}
                className={cn("px-3 py-1 text-sm rounded-full border transition-colors", interval === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50")}
              >
                {s}s
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Live data sync: every 5 min</span>
          </div>
        </div>
      )}

      {/* Slide selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
              i === currentIndex ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Main slide display */}
      <div className={cn("rounded-2xl overflow-hidden bg-gradient-to-br relative", slide.color)} style={{ minHeight: 520 }}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm z-10">
          <div>
            <p className="text-white font-bold text-lg">{slide.title}</p>
            <p className="text-white/60 text-xs">{slide.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 rounded-full px-3 py-1">
              <RefreshCw className="h-3 w-3" /> Live
            </span>
            <span className="text-xs text-white/70">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* Slide content */}
        <div className="pt-16 pb-16" style={{ minHeight: 520 }}>
          <SlideComp fullscreen={false} />
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)} className={cn("rounded-full transition-all", i === currentIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70")} />
            ))}
          </div>

          {/* Nav + play */}
          <div className="flex items-center gap-3">
            <button onClick={prev} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              className="flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 px-4 py-1.5 text-sm text-white font-medium transition-colors"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? `${interval - elapsed}s` : "Play"}
            </button>
            <button onClick={next} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Progress bar */}
          {playing && (
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
              <div
                className="h-full bg-white transition-none"
                style={{ width: `${(elapsed / interval) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Slide overview grid */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-3">All Slides in Rotation</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(i)}
              className={cn("rounded-xl overflow-hidden border-2 transition-all", i === currentIndex ? "border-primary" : "border-border hover:border-primary/40")}
            >
              <div className={cn("h-20 bg-gradient-to-br flex items-center justify-center", s.color)}>
                <span className="text-white/80 text-xs font-semibold">{s.title}</span>
              </div>
              <div className="bg-card px-3 py-2 text-left">
                <p className="text-xs font-medium text-foreground">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      </PageContent>
    </>
  );
}
