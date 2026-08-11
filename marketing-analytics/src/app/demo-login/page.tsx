"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, TrendingUp, Zap, BarChart3, Shield,
  CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";

const DEMO_FEATURES = [
  { icon: Brain,      label: "AI Decision Center",      desc: "See how AI analyses your marketing and gives causal recommendations" },
  { icon: TrendingUp, label: "Revenue Intelligence",     desc: "Full revenue, profit, ROAS, CAC and LTV dashboards" },
  { icon: Zap,        label: "Autonomous AI Brief",      desc: "Monday morning executive brief with health score and findings" },
  { icon: BarChart3,  label: "Forecast Intelligence",    desc: "Revenue forecasts with confidence bands and seasonality" },
  { icon: Sparkles,   label: "AI Copilot",               desc: "Ask 'Why did revenue decrease?' and get a structured answer" },
  { icon: Shield,     label: "Marketing Data Hub",       desc: "19 categories, 150+ platform integrations" },
];

export default function DemoLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function enterDemo() {
    setLoading(true);
    // Set demo cookie — 24 hour session
    document.cookie = "nexoryx_demo=1; path=/; max-age=86400; SameSite=Lax";
    setTimeout(() => router.push("/home"), 400);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(220_14%_4%)] px-4 py-12">

      {/* Card */}
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Nexoryx One</span>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center space-y-4 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Interactive Demo</span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight">
            See Nexoryx One<br />in action
          </h1>
          <p className="text-base text-white/60 max-w-md mx-auto">
            Explore the full platform with sample data — AI insights, revenue dashboards, forecasts, and more.
            No credit card, no account needed.
          </p>

          <button
            onClick={enterDemo}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-wait shadow-lg shadow-primary/25"
          >
            {loading ? "Loading demo…" : "Enter Demo Dashboard"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>

          <p className="text-xs text-white/30">Demo session lasts 24 hours · Sample data only</p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {DEMO_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-xl border border-white/8 bg-white/4 p-4 flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Real login CTA */}
        <div className="text-center space-y-3">
          <p className="text-sm text-white/50">Already have an account?</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Sign in with Google
          </a>
        </div>

        <p className="text-center text-xs text-white/20 mt-8">
          Nexoryx One · Marketing Intelligence Platform · nexoryxone.com
        </p>
      </div>
    </div>
  );
}
