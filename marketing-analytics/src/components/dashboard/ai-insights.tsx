"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AiInsightsProps {
  kpis: {
    revenue?: number;
    revenueDelta?: number;
    roas?: number;
    users?: number;
    usersDelta?: number;
    purchases?: number;
    conversionRate?: number;
    topChannel?: string;
  };
  loading?: boolean;
}

export function AiInsights({ kpis, loading = false }: AiInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function fetchInsights() {
    setFetching(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpis }),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
        setGeneratedAt(data.generatedAt);
      }
    } catch {
      setInsights(["Unable to generate insights — please try again."]);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!loading) fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Insights
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchInsights}
              disabled={fetching || loading}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              title="Refresh insights"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", fetching && "animate-spin")} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {fetching || loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 rounded-md bg-muted animate-pulse" style={{ width: `${70 + i * 10}%` }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90 border-l-2 border-primary/30 pl-3">
                  {insight}
                </p>
              ))}
              {generatedAt && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Generated {new Date(generatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
