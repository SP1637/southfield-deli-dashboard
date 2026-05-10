"use client";

import { useEffect } from "react";
import { LayoutDashboard, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry)
    console.error("[Marketing Intelligence Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg mb-6">
        <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
        An unexpected error occurred. This has been logged and we&apos;ll look into it.
        {error.digest && (
          <span className="block mt-1 font-mono text-xs text-muted-foreground/60">
            Reference: {error.digest}
          </span>
        )}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button className="gap-2" onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/overview"}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <p className="mt-10 text-xs text-muted-foreground/50">Marketing Intelligence Analytics</p>
    </div>
  );
}
