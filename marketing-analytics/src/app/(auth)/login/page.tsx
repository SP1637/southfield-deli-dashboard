"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, BarChart3, Bell, FileText, Users, Layers, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Auth mode ────────────────────────────────────────────────────────────────
type AuthMode = "login" | "register";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mode, setMode]         = useState<AuthMode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const hasOnboarded = cookies.some((c) => c.startsWith("onboarded="));
    router.replace(hasOnboarded ? "/overview" : "/connect");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  function callbackUrl() {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const hasOnboarded = cookies.some((c) => c.startsWith("onboarded="));
    return hasOnboarded ? "/overview" : "/connect";
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "register" && !name.trim()) { setError("Please enter your name."); return; }

    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      name: mode === "register" ? name : undefined,
      mode,
      callbackUrl: callbackUrl(),
    });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else if (result?.ok) {
      router.replace(callbackUrl());
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-indigo-700 p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Marketing Intelligence</span>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Marketing analytics<br />that actually moves<br />the needle.
            </h2>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-sm">
              Connect 18+ data sources, get AI-written reports, set KPI alerts and share
              live dashboards with your team — all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: BarChart3, text: "GA4 funnels, attribution & revenue in one view" },
              { icon: Layers,    text: "Industry KPI templates — set up in 60 seconds" },
              { icon: FileText,  text: "AI-written narrative reports, ready to send" },
              { icon: Bell,      text: "Threshold alerts — catch drops before clients do" },
              { icon: Users,     text: "Admin / Editor / Viewer roles for your whole team" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-primary-foreground/85">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} Marketing Intelligence · Secure · No credit card required to start
        </p>
      </div>

      {/* Right — sign-in / register form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Marketing Intelligence</span>
          </div>

          {/* Title + mode toggle */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Sign in to your workspace" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "login"
                ? "Welcome back — pick how you'd like to sign in."
                : "Get started in seconds — no credit card required."}
            </p>
          </div>

          {/* Login / Register tab toggle */}
          <div className="flex rounded-xl border p-1 bg-muted/40 gap-1">
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === m
                    ? "bg-white dark:bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            {/* Social providers */}
            <div className="space-y-2.5">
              {/* Google */}
              <Button
                className="w-full gap-3"
                variant="outline"
                size="lg"
                onClick={() => signIn("google", { callbackUrl: callbackUrl() })}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              {/* Apple */}
              <Button
                className="w-full gap-3 bg-black hover:bg-black/90 text-white border-black"
                size="lg"
                onClick={() => signIn("apple", { callbackUrl: callbackUrl() })}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Continue with Apple
              </Button>

              {/* Microsoft */}
              <Button
                className="w-full gap-3"
                variant="outline"
                size="lg"
                onClick={() => signIn("azure-ad", { callbackUrl: callbackUrl() })}
              >
                <svg viewBox="0 0 23 23" className="h-5 w-5 shrink-0" aria-hidden>
                  <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Continue with Microsoft
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 border-t" />
              <span>or use email</span>
              <div className="flex-1 border-t" />
            </div>

            {/* Email + password form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === "register" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoComplete={mode === "login" ? "email" : "email"}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
                    className="w-full rounded-lg border px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait…</>
                  : mode === "login" ? "Sign In" : "Create Account"
                }
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              By signing in you agree to our{" "}
              <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>
              {" "}and{" "}
              <a href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</a>.
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? (
              <>New here?{" "}
                <button onClick={() => setMode("register")} className="underline underline-offset-2 hover:text-foreground font-medium">
                  Create a free account →
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="underline underline-offset-2 hover:text-foreground font-medium">
                  Sign in →
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
