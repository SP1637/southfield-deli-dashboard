/**
 * POST /api/reports/schedule
 * Saves the user's scheduled report preference (frequency + recipient).
 * Stored in a simple env-var-backed in-memory map (or localStorage on client).
 *
 * In production, store in a DB / Vercel KV and trigger via a cron job.
 * The cron endpoint can call /api/reports/email on the configured schedule.
 *
 * Body: { frequency: "weekly" | "monthly", email: string, enabled: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

// In-memory store (resets on cold start — swap for DB/KV in production)
const scheduleStore = new Map<string, { frequency: string; email: string; enabled: boolean }>();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { frequency = "weekly", email = session?.user?.email, enabled = true } = body;

  if (!["weekly", "monthly"].includes(frequency)) {
    return NextResponse.json({ error: "frequency must be weekly or monthly" }, { status: 400 });
  }

  const userEmail = session?.user?.email ?? "demo-user";
  scheduleStore.set(userEmail, { frequency, email, enabled });

  // Send a confirmation email if Resend is configured
  if (enabled && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Nexoryx One Reports <onboarding@resend.dev>",
        to: email,
        subject: "✅ Scheduled reports activated — Nexoryx One",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <div style="margin-bottom:24px">
              <span style="background:#6366f1;color:white;padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600">Nexoryx One</span>
            </div>
            <h2 style="font-size:22px;font-weight:700;margin:0 0 8px">Scheduled reports confirmed ✅</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px">
              Your <strong>${frequency}</strong> marketing report is now active. We'll send it to <strong>${email}</strong> every ${frequency === "weekly" ? "Monday morning" : "1st of the month"}.
            </p>
            <p style="color:#64748b;font-size:14px">Reports include: Revenue, ROAS, Users, Purchases and top channel performance.</p>
            <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0">
              <a href="${process.env.NEXTAUTH_URL ?? "https://marketing-analytics-self.vercel.app"}/overview"
                 style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                Open Dashboard →
              </a>
            </div>
          </div>
        `,
      });
    } catch (e) {
      // Non-fatal — schedule was saved, just couldn't send confirmation
      console.error("[Schedule confirm email]", e);
    }
  }

  return NextResponse.json({
    saved: true,
    frequency,
    email,
    enabled,
    nextReport: frequency === "weekly" ? "Next Monday" : "1st of next month",
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isDemoMode  = cookieStore.has("nexoryx_demo");
  if (!session && !isDemoMode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = session?.user?.email ?? "demo-user";
  const prefs = scheduleStore.get(userEmail) ?? null;
  return NextResponse.json({ prefs });
}
