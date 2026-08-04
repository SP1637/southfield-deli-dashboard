"use client";

import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title: string;
  section: string;
  description?: string;
}

export function ComingSoon({ title, section, description }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30">
        <Construction className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{section}</p>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          {description ?? "This module is in development and will be available soon."}
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Coming Soon
      </span>
      <Link
        href="/home"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>
    </div>
  );
}
