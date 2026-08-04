"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Send, CheckCircle2, Clock, User, Brain,
  TrendingDown, TrendingUp, DollarSign, Zap, Target,
  AlertTriangle, ChevronRight, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// ── Data sources shown during "analysis" ──────────────────────────────────────
const DATA_SOURCES = ["GA4", "Meta", "Google Ads", "Shopify", "Search Console"];

// ── Pre-built AI responses ────────────────────────────────────────────────────
interface AiResponse {
  analysing: string[];
  issue: { heading: string; bullets: string[] };
  recommendations: { action: string; impact?: string }[];
  expectedImprovement?: string;
}

const RESPONSES: Record<string, AiResponse> = {
  "Why did revenue decrease?": {
    analysing: ["GA4", "Meta", "Google Ads", "Shopify", "Search Console"],
    issue: {
      heading: "The biggest issue is:",
      bullets: [
        "Google CPC increased 22%.",
        "Landing page conversion fell 14%.",
        "Mobile bounce rate increased.",
      ],
    },
    recommendations: [
      { action: "Pause Campaign A." },
      { action: "Scale Campaign C." },
      { action: "Fix landing page speed." },
    ],
    expectedImprovement: "+11%",
  },
  "Where should I spend another £5,000?": {
    analysing: ["GA4", "Meta", "Google Ads", "Shopify"],
    issue: {
      heading: "Based on current ROAS by channel:",
      bullets: [
        "TikTok ROAS is 4.8× — best performer, under-funded.",
        "Email has highest LTV-to-spend ratio at 9.2×.",
        "Meta is saturating — frequency >7, returns diminishing.",
      ],
    },
    recommendations: [
      { action: "Allocate £2,800 to TikTok Advantage+.", impact: "ROAS +18%" },
      { action: "Allocate £1,400 to email flows.", impact: "+£12k LTV" },
      { action: "Hold remaining £800 for A/B test budget.", impact: "—" },
    ],
    expectedImprovement: "+14% blended ROAS",
  },
  "Which campaign should I pause?": {
    analysing: ["Google Ads", "Meta", "GA4"],
    issue: {
      heading: "3 campaigns are underperforming:",
      bullets: [
        "Campaign A: ROAS 1.2× — below break-even of 2.4×.",
        "Campaign B: CTR dropped 38% in 7 days (creative fatigue).",
        "Google Brand campaign: CPC up 41% — competitor bidding on your terms.",
      ],
    },
    recommendations: [
      { action: "Pause Campaign A immediately.", impact: "Save £3.2k/week" },
      { action: "Refresh creatives on Campaign B.", impact: "CTR +25% est." },
      { action: "Raise brand bid cap by 15%.", impact: "Recover lost impressions" },
    ],
    expectedImprovement: "+8% overall ROAS",
  },
  "Which audience has the highest LTV?": {
    analysing: ["Shopify", "GA4", "Meta"],
    issue: {
      heading: "LTV breakdown by segment:",
      bullets: [
        "Women 35–44 via organic search: LTV £312 (highest).",
        "Retargeted cart abandoners: LTV £284, 3.2× faster conversion.",
        "Cold Meta audience: LTV £98 — lowest, but scale potential.",
      ],
    },
    recommendations: [
      { action: "Build lookalike from Women 35–44 segment.", impact: "Projected LTV £280+" },
      { action: "Increase retargeting budget by 20%.", impact: "+£18k revenue/month" },
      { action: "Exclude low-LTV segments from top-of-funnel.", impact: "CAC –15%" },
    ],
    expectedImprovement: "+19% average LTV",
  },
  "What should our marketing team focus on Monday?": {
    analysing: ["GA4", "Meta", "Google Ads", "Shopify", "Search Console"],
    issue: {
      heading: "3 things need attention this week:",
      bullets: [
        "Checkout conversion dropped 12% — mobile payment page load is 3.8s.",
        "Q3 OKR: email subscribers at 78% — need 1,240 more this month.",
        "TikTok campaign budget will run out by Wednesday.",
      ],
    },
    recommendations: [
      { action: "Fix mobile checkout speed (dev ticket).", impact: "+£8k/week recovered" },
      { action: "Launch lead magnet for email growth.", impact: "+900 subscribers est." },
      { action: "Increase TikTok daily budget by £400.", impact: "No interruption to ROAS" },
    ],
    expectedImprovement: "+9% weekly revenue",
  },
};

const SUGGESTED = Object.keys(RESPONSES);

// ── Types ─────────────────────────────────────────────────────────────────────
type MsgRole = "user" | "ai";
interface Message {
  role: MsgRole;
  text?: string;
  response?: AiResponse;
  analysing?: boolean;
  analysed?: boolean;
}

// ── Analysing animation component ────────────────────────────────────────────
function AnalysingBlock({ sources, done }: { sources: string[]; done: boolean }) {
  const [revealed, setRevealed] = useState<number>(0);

  useEffect(() => {
    if (revealed >= sources.length) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), 320);
    return () => clearTimeout(t);
  }, [revealed, sources.length]);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-muted-foreground">
        {done ? "I analysed:" : "Analysing…"}
      </p>
      {sources.slice(0, revealed).map((s) => (
        <div key={s} className="flex items-center gap-2 text-sm text-emerald-500 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {s}
        </div>
      ))}
      {!done && revealed < sources.length && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
          <Clock className="h-3.5 w-3.5 shrink-0 animate-spin" />
          {sources[revealed]}
        </div>
      )}
    </div>
  );
}

// ── AI response card ──────────────────────────────────────────────────────────
function AiResponseCard({ response }: { response: AiResponse }) {
  return (
    <div className="space-y-4 pt-3 border-t border-border/40">
      {/* Issue */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{response.issue.heading}</p>
        {response.issue.bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            {b}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">Recommendation:</p>
        {response.recommendations.map((r, i) => (
          <div key={i} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 text-sm">
              <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <span>{r.action}</span>
            </div>
            {r.impact && (
              <span className="text-xs font-semibold text-emerald-500 shrink-0">{r.impact}</span>
            )}
          </div>
        ))}
      </div>

      {/* Expected improvement */}
      {response.expectedImprovement && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-sm font-semibold text-emerald-500">
            Expected improvement {response.expectedImprovement}.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendQuestion(q: string) {
    if (busy || !q.trim()) return;
    const question = q.trim();
    setInput("");
    setBusy(true);

    const response = RESPONSES[question] ?? {
      analysing: DATA_SOURCES,
      issue: {
        heading: "Here's what I found:",
        bullets: ["Revenue is tracking -4% vs last period.", "Top channel ROAS is stable.", "One underperforming campaign detected."],
      },
      recommendations: [
        { action: "Review underperforming campaigns.", impact: "ROAS +8%" },
        { action: "Increase budget on top channel.", impact: "+£6k revenue" },
      ],
      expectedImprovement: "+7%",
    };

    // Add user message + thinking state
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "ai", analysing: true, analysed: false, response },
    ]);

    // Reveal data sources, then show response
    const totalDelay = response.analysing.length * 320 + 400;
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, analysed: true } : m
        )
      );
      setBusy(false);
    }, totalDelay);
  }

  function reset() {
    setMessages([]);
    setInput("");
    setBusy(false);
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      <PageHeader
        title="AI Copilot"
        actions={
          hasMessages ? (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New conversation
            </button>
          ) : undefined
        }
      />

      <PageContent>

        {/* ── Empty state / hero ── */}
        {!hasMessages && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6 space-y-3 text-center">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20">
                  <Brain className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">This shouldn't be just chat.</h2>
                <p className="text-xl font-bold text-primary mt-0.5">It should become an employee.</p>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask anything. The AI analyses GA4, Meta, Google Ads, Shopify, and Search Console —
                then gives you a specific answer with recommendations and expected impact.
              </p>

              {/* Data source badges */}
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {DATA_SOURCES.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested questions */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Try asking</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendQuestion(q)}
                    className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className="h-1.5 w-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                    <span className="text-sm font-medium flex-1">{q}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Conversation ── */}
        {hasMessages && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>

                {/* AI avatar */}
                {msg.role === "ai" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                )}

                {/* Bubble */}
                <div className={cn(
                  "max-w-[84%] rounded-2xl px-4 py-3 space-y-3",
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm border bg-card"
                )}>
                  {msg.role === "user" && (
                    <p className="text-sm font-medium">{msg.text}</p>
                  )}

                  {msg.role === "ai" && msg.response && (
                    <>
                      <AnalysingBlock
                        sources={msg.response.analysing}
                        done={!!msg.analysed}
                      />
                      {msg.analysed && (
                        <AiResponseCard response={msg.response} />
                      )}
                    </>
                  )}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />

            {/* Suggested follow-ups */}
            {!busy && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Follow-up questions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.filter((q) => !messages.some((m) => m.text === q)).slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuestion(q)}
                      className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Input ── */}
        <div className="sticky bottom-4 mt-4">
          <div className="rounded-2xl border bg-card shadow-lg p-2 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuestion(input); } }}
              placeholder="Ask anything about your marketing performance…"
              rows={1}
              disabled={busy}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 max-h-32 leading-relaxed disabled:opacity-50"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendQuestion(input)}
              disabled={busy || !input.trim()}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                input.trim() && !busy
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-1.5">
            AI analyses real connected data — GA4, Meta, Google Ads, Shopify, Search Console
          </p>
        </div>

      </PageContent>
    </>
  );
}
