"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3, TrendingUp, Globe, Package, Zap, Shield, Mail,
  ArrowRight, Check, Star, ChevronDown, Menu, X, LayoutDashboard,
  LineChart, Bell, FileText, Share2, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BarChart3,
    color: "bg-indigo-500",
    title: "Sales Funnel Analytics",
    desc: "Track every step from page view to purchase. See exactly where customers drop off and fix it.",
  },
  {
    icon: TrendingUp,
    color: "bg-emerald-500",
    title: "Traffic & Acquisition",
    desc: "Daily, weekly and monthly traffic trends broken down by channel, device and campaign.",
  },
  {
    icon: Globe,
    color: "bg-blue-500",
    title: "Geo Performance",
    desc: "Revenue and conversion rates by country. Spot your best markets and double down on them.",
  },
  {
    icon: Package,
    color: "bg-amber-500",
    title: "Product-Level Insights",
    desc: "Which items get viewed but never bought? Item-level funnel: views → cart → checkout → purchase.",
  },
  {
    icon: Bell,
    color: "bg-red-500",
    title: "Smart Alerts",
    desc: "Automatic anomaly detection. Get notified when revenue drops, traffic spikes or conversion falls.",
  },
  {
    icon: Mail,
    color: "bg-violet-500",
    title: "Email Reports",
    desc: "Scheduled weekly and monthly PDF reports delivered straight to your inbox — or your client's.",
  },
  {
    icon: Target,
    color: "bg-pink-500",
    title: "Goal Tracking",
    desc: "Set revenue and user targets. Track progress in real time with visual gauges on your overview.",
  },
  {
    icon: Share2,
    color: "bg-cyan-500",
    title: "Shareable Dashboards",
    desc: "Generate a read-only link your team or clients can view — no login required.",
  },
  {
    icon: FileText,
    color: "bg-orange-500",
    title: "One-Click PDF Export",
    desc: "Export any dashboard page as a branded PDF report for presentations and client reviews.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for testing with demo data",
    highlight: false,
    features: [
      "Full dashboard with demo data",
      "1 GA4 property",
      "7-day data range",
      "Traffic & funnel views",
      "Community support",
    ],
    cta: "Get started free",
    href: "/login",
  },
  {
    name: "Pro",
    price: "£29",
    period: "/month",
    description: "For businesses serious about growth",
    highlight: true,
    badge: "Most popular",
    features: [
      "Everything in Starter",
      "Live GA4 data (your property)",
      "Unlimited date ranges",
      "Email & PDF reports",
      "Goal tracking & alerts",
      "Shareable dashboard links",
      "Priority email support",
    ],
    cta: "Start free trial",
    href: "/login",
  },
  {
    name: "Agency",
    price: "£99",
    period: "/month",
    description: "Manage multiple clients in one place",
    highlight: false,
    features: [
      "Everything in Pro",
      "Up to 10 GA4 properties",
      "White-label branding",
      "Client portal access",
      "Scheduled client reports",
      "Team member seats (5)",
      "Dedicated support",
    ],
    cta: "Contact us",
    href: "mailto:sub17h4@gmail.com",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Head of Growth, Bloom Skincare",
    quote: "Switched from Looker Studio. The funnel visualisation is 10× clearer and my whole team actually uses it now.",
    stars: 5,
    avatar: "SC",
    color: "bg-indigo-500",
  },
  {
    name: "Marcus O'Brien",
    role: "E-commerce Director, TrailGear Co.",
    quote: "The item-level funnel caught a broken checkout step that was costing us £40K/month. Paid for itself on day one.",
    stars: 5,
    avatar: "MO",
    color: "bg-emerald-500",
  },
  {
    name: "Priya Sharma",
    role: "Founder, NomadPacks",
    quote: "I send the automated weekly report to my investors every Monday. They love it — and I spend zero time on it.",
    stars: 5,
    avatar: "PS",
    color: "bg-violet-500",
  },
];

const STATS = [
  { value: "2,400+", label: "Active dashboards" },
  { value: "£180M+", label: "Revenue tracked monthly" },
  { value: "< 2 min", label: "Setup time" },
  { value: "99.9%", label: "Uptime SLA" },
];

const FAQS = [
  {
    q: "Do I need a developer to set this up?",
    a: "No. Setup takes under 2 minutes. Sign in with Google, add our service account email to your GA4 property, paste your Property ID — done.",
  },
  {
    q: "Will my clients see my data?",
    a: "Never. Each property is isolated. You can optionally generate a shareable read-only link for specific clients or team members.",
  },
  {
    q: "What data does it access?",
    a: "Only your Google Analytics 4 data via a service account you control. We never request access to your Google Ads, Drive or other Google services.",
  },
  {
    q: "Can I use it for multiple clients?",
    a: "Yes — the Agency plan lets you manage up to 10 GA4 properties from one login with white-label branding and client portal access.",
  },
  {
    q: "Is there a free trial?",
    a: "The Starter plan is free forever with demo data. Pro comes with a 14-day free trial — no card required.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Marketing Intelligence</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
          >
            Try free →
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden rounded-md p-2 text-slate-300 hover:text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-slate-950 px-6 py-4 space-y-4">
          <a href="#features" onClick={() => setOpen(false)} className="block text-sm text-slate-300 hover:text-white">Features</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="block text-sm text-slate-300 hover:text-white">Pricing</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-sm text-slate-300 hover:text-white">FAQ</a>
          <Link href="/login" className="block rounded-lg bg-indigo-500 px-4 py-2.5 text-center text-sm font-semibold text-white">
            Get started free →
          </Link>
        </div>
      )}
    </header>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-white hover:text-indigo-300 transition-colors"
      >
        {q}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <p className="pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-28 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[800px] rounded-full bg-indigo-600/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <Zap className="h-3 w-3" />
            Now with AI insights &amp; automated reports
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Your GA4 data,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              beautifully clear
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Turn your Google Analytics 4 data into actionable insights. Sales funnels, traffic, geo breakdowns, product performance — all in one beautiful dashboard. Setup in 2 minutes.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400 transition-all duration-200 hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/overview"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
            >
              <LineChart className="h-4 w-4" />
              View live demo
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">No credit card required · Free tier available · Setup in &lt; 2 minutes</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Preview</p>
            <h2 className="text-4xl font-extrabold tracking-tight">See what your data looks like</h2>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-slate-900 p-1 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <div className="mx-4 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-500">
                marketing-intelligence.vercel.app/overview
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { l: "Gross Revenue", v: "£25.6M", d: "+12%", c: "text-emerald-400" },
                  { l: "ROAS", v: "4.2x", d: "+3%", c: "text-emerald-400" },
                  { l: "Total Users", v: "1.39M", d: "+8%", c: "text-emerald-400" },
                  { l: "Purchases", v: "234K", d: "+21%", c: "text-emerald-400" },
                  { l: "Ad Spend", v: "£6.1M", d: "+2%", c: "text-amber-400" },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.l}</p>
                    <p className="mt-1 text-lg font-bold text-white">{k.v}</p>
                    <p className={cn("text-[11px] font-medium", k.c)}>{k.d}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-28 flex items-end gap-1 overflow-hidden">
                {[45,52,48,65,58,72,69,80,75,88,82,94,89,100,95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-indigo-500/60" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 h-16 flex items-center justify-center">
                  <p className="text-xs text-slate-500">Funnel Snapshot</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 h-16 flex items-center justify-center">
                  <p className="text-xs text-slate-500">AI Insights &amp; Alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-white/[0.02] border-y border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Features</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Everything you need to grow</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Built for e-commerce teams, marketers and agencies who want real answers — not just pretty charts.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:border-indigo-500/40 hover:bg-white/[0.06] hover:-translate-y-1"
                >
                  <div className={cn("mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl", f.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Setup</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Up and running in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { n: "1", title: "Sign in with Google", desc: "One click. No sensitive permissions. Any Google account works.", color: "bg-indigo-500" },
              { n: "2", title: "Add service account to GA4", desc: "Copy our service account email, add it as Viewer in GA4 Admin. 30 seconds.", color: "bg-violet-500" },
              { n: "3", title: "Paste your Property ID", desc: "Enter your GA4 Property ID in the dashboard. Data loads instantly.", color: "bg-pink-500" },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-extrabold text-white", s.color)}>{s.n}</div>
                <h3 className="mb-2 text-base font-bold">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 bg-white/[0.02] border-y border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Testimonials</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Teams that switched never looked back</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm text-slate-300 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white", t.color)}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Pricing</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Simple, honest pricing</h2>
            <p className="mt-4 text-slate-400">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col",
                  p.highlight ? "border-indigo-500 bg-indigo-950/40 shadow-xl shadow-indigo-500/20" : "border-white/10 bg-white/[0.03]"
                )}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-indigo-500 px-3 py-1 text-[11px] font-bold text-white">{p.badge}</span>
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{p.name}</p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">{p.price}</span>
                    {p.period && <span className="mb-1 text-sm text-slate-400">{p.period}</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{p.description}</p>
                </div>
                <ul className="flex-1 space-y-3 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={cn(
                    "block rounded-xl px-6 py-3 text-center text-sm font-bold transition-all duration-200",
                    p.highlight ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30" : "border border-white/20 text-white hover:bg-white/10"
                  )}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20 bg-white/[0.02] border-y border-white/10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">FAQ</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Common questions</h2>
          </div>
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight">Ready to see your real numbers?</h2>
          <p className="mb-8 text-slate-400">Join thousands of e-commerce teams making smarter decisions with their GA4 data.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-xs text-slate-600">No credit card · 2-minute setup · Cancel anytime</p>
          <p className="mt-3 text-xs text-slate-600">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-400 transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-slate-400 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
              <LayoutDashboard className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Marketing Intelligence</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="mailto:sub17h4@gmail.com" className="hover:text-white transition-colors">Contact</a>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-slate-600">© 2026 Marketing Intelligence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
