import Link from "next/link";
import { LayoutDashboard, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Logo */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg mb-6">
        <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
      </div>

      {/* Number */}
      <p className="text-8xl font-black text-primary/15 select-none leading-none mb-2">404</p>

      <h1 className="text-2xl font-bold tracking-tight mt-2">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/overview"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      <p className="mt-10 text-xs text-muted-foreground/50">Marketing Intelligence Analytics</p>
    </div>
  );
}
