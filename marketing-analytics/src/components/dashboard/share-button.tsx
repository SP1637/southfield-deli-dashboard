"use client";

import { useState } from "react";
import { Share2, Copy, Check, X, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  propertyId?: string;
}

export function ShareButton({ propertyId = "" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, expiryDays }),
      });
      const data = await res.json();
      if (data.url) setShareUrl(data.url);
    } catch {
      setShareUrl(null);
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setShareUrl(null); }}
        className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors print:hidden"
        title="Share dashboard"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-9 z-50 w-80 rounded-xl border bg-card shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Share dashboard</p>
              <button onClick={() => setOpen(false)} className="rounded-md p-0.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate a read-only link. Anyone with the link can view this dashboard — no login required.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Link expires after</label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            {!shareUrl ? (
              <button
                onClick={generate}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {loading ? "Generating…" : "Generate link"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <p className="flex-1 text-[11px] font-mono text-foreground truncate">{shareUrl}</p>
                  <button
                    onClick={copyUrl}
                    className={cn("shrink-0 rounded p-1 transition-colors", copied ? "text-green-600" : "text-muted-foreground hover:text-foreground")}
                    title="Copy link"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {copied ? "✓ Copied to clipboard!" : "Click to copy the link"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
