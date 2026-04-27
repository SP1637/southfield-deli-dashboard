"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's my best performing channel?",
  "Where are users dropping off?",
  "What's my blended ROAS?",
  "Any anomalies I should know about?",
  "Which country grows fastest?",
  "How can I improve conversions?",
];

// ── Smart response engine (references real demo data) ────────────────────────
function getAnswer(q: string): string {
  const t = q.toLowerCase();

  if ((t.includes("best") || t.includes("top")) && (t.includes("channel") || t.includes("source"))) {
    return "🏆 **YouTube / referral** leads all channels:\n- **343,400 users** — 20% of total traffic\n- **$5.0M revenue** — highest of any source\n- Conversion rate: **49.1%**\n\n✉️ Close second: **Email newsletters** ($2.6M revenue, 50.2% conversion). Consider increasing send frequency — it has your best ROI.";
  }
  if (t.includes("drop") || t.includes("abandon") || t.includes("funnel")) {
    return "📉 **Top 3 drop-off points in your funnel:**\n\n1. **Page Views → Cart** — 64.7% bounce. Add social proof and urgency near your CTA.\n2. **Checkout → Payment Info** — 27.5% drop. Offer more payment methods (BNPL, PayPal).\n3. **Payment → Purchase** — 29% drop. Check for form errors or slow page load.\n\nFixing just #2 could recover ~**$1.2M** in blocked revenue.";
  }
  if (t.includes("roas") || t.includes("return on ad") || t.includes("ad spend")) {
    return "💰 **ROAS breakdown:**\n\n| Channel | Est. Spend | Revenue | ROAS |\n|---------|-----------|---------|------|\n| Email | $120K | $2.6M | **21.7x** ⭐ |\n| YouTube | $980K | $5.0M | **5.1x** |\n| Paid Search | $760K | $2.9M | **3.8x** |\n| Bing | $340K | $1.0M | **2.9x** |\n\n**Blended ROAS: 4.2x.** Bing underperforms — reallocate to YouTube for +$180K estimated uplift.";
  }
  if (t.includes("anomal") || t.includes("alert") || t.includes("unusual") || t.includes("wrong")) {
    return "⚠️ **2 active anomalies detected:**\n\n**1. Payment step drop (high severity)**\nYesterday 11:00–14:00 UTC, payment completions were 27.5% below the 30-day baseline. Check your payment gateway status logs.\n\n**2. Mobile conversion gap (medium)**\nMobile traffic is up 34% but converts at 40% the rate of desktop. Your mobile checkout likely has friction — audit on a real device.";
  }
  if (t.includes("country") || t.includes("geo") || t.includes("region") || t.includes("location")) {
    return "🌍 **Revenue by country:**\n\n1. 🇩🇪 Germany — $1.3M (42,900 purchases)\n2. 🇦🇺 Australia — $1.3M (43,300 purchases)\n3. 🇺🇸 United States — $1.3M (42,500 purchases)\n4. 🇧🇷 Brazil — $1.3M (42,400 purchases)\n5. 🇸🇬 Singapore — $1.3M (41,600 purchases)\n\n🚀 **Fastest growing: Singapore** (+18% WoW). Consider a localised campaign for APAC to capitalise on momentum.";
  }
  if (t.includes("improve") || t.includes("optimis") || t.includes("optimiz") || t.includes("recommend")) {
    return "🎯 **Top 3 recommendations:**\n\n1. **Fix mobile checkout** — close the 40% conversion gap vs desktop. Estimate: +$3.8M annual revenue.\n\n2. **Expand email list** — email has 21.7x ROAS, far above paid channels. Every 10K new subscribers ≈ +$220K revenue.\n\n3. **Reduce Bing spend** — shift $170K to YouTube. Based on ROAS differential, this adds ~$180K in revenue.";
  }
  if (t.includes("revenue") || t.includes("sales") || t.includes("money")) {
    return "💵 **Revenue snapshot:**\n\n- Gross revenue: **$25.5M** (+3.7% vs prior)\n- Average order value: **$29.95**\n- Revenue per user: **$15.00**\n- Daily run rate: **$851K/day**\n\nTop 7 days averaged $903K (+6%) — the upward trend is consistent. You're on pace to hit **$26.3M** this period if growth holds.";
  }
  if (t.includes("traffic") || t.includes("user") || t.includes("visit") || t.includes("session")) {
    return "📊 **Traffic overview:**\n\n- Total users: **1.7M** (–1.6% users, but +3.8% purchases 📈)\n- Sessions: **6M** — healthy 3.5 pages/session\n- New vs returning: **51% returning** — strong loyalty\n- Organic growth: **+22% MoM** from search\n\nFewer users but more purchases = **better user quality**. Your targeting is improving.";
  }
  if (t.includes("item") || t.includes("product") || t.includes("sku")) {
    return "📦 **Product insights:**\n\n- Best revenue: **UltraMatrixX** — $1,600, 11.5% view-to-purchase\n- Most viewed: **SigmaBlendElite** (637 views) — only 10.8% conversion. Add a video demo.\n- Fastest checkout: **MaxPulseEdge** — 89.5% checkout-to-purchase rate\n\n💡 Your top 5 SKUs drive 58% of item revenue. Bundle them to increase AOV.";
  }

  return "📊 **Quick data summary:**\n\n- Revenue: **$25.5M** (+3.7%)\n- Users: **1.7M** | Sessions: **6M**\n- Funnel conversion: **16.85%**\n- Best channel: YouTube ($5M, 5.1x ROAS)\n- Best country: Germany/Australia/US (tied)\n\nTry asking:\n- *\"What's my ROAS?\"*\n- *\"Where are users dropping off?\"*\n- *\"Any anomalies?\"*";
}

// ── Simple bold/newline markdown renderer ─────────────────────────────────────
function MD({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((p, j) =>
              j % 2 === 1 ? <strong key={j}>{p}</strong> : p
            )}
            {i < arr.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "👋 Hi! I'm your **AI Analytics Assistant**. I can explain trends, highlight anomalies, calculate ROAS, and recommend actions — all from your connected data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;
      setMsgs((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
      setInput("");
      setTyping(true);
      const delay = 600 + Math.random() * 500;
      setTimeout(() => {
        setMsgs((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: getAnswer(trimmed) },
        ]);
        setTyping(false);
      }, delay);
    },
    [typing]
  );

  const reset = () => {
    setMsgs([
      {
        id: "init",
        role: "assistant",
        content:
          "👋 Hi! I'm your **AI Analytics Assistant**. I can explain trends, highlight anomalies, calculate ROAS, and recommend actions — all from your connected data.",
      },
    ]);
    setTyping(false);
  };

  const showSuggestions = msgs.length <= 1;

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-[72px] right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
          style={{ maxHeight: "min(72vh, 580px)" }}>
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">AI Analytics</p>
                <p className="text-[10px] text-white/60">Powered by your live data</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                title="Reset chat"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}>
                  <MD text={m.content} />
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {showSuggestions && (
            <div className="shrink-0 flex flex-wrap gap-1.5 px-4 pb-3">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask about your data…"
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-200",
          open
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:shadow-xl hover:scale-105 active:scale-95"
        )}
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <><Sparkles className="h-4 w-4" />Ask AI</>}
      </button>
    </>
  );
}
