/**
 * GET  /api/alerts  — list all alerts for the authenticated user
 * POST /api/alerts  — create or update an alert
 * DELETE /api/alerts?id=  — delete an alert
 *
 * Storage: in-memory Map keyed by user email (dev/staging).
 * In production, replace with Vercel KV or your DB of choice.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface Alert {
  id: string;
  name: string;
  metric: string;
  condition: "above" | "below" | "change_pct";
  threshold: number;
  period: string;
  channels: ("email" | "in_app")[];
  active: boolean;
  lastTriggered?: string;
  createdAt: string;
}

// In-memory store: email → Alert[]
const store = new Map<string, Alert[]>();

function getUserAlerts(email: string): Alert[] {
  return store.get(email) ?? [];
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const alerts = getUserAlerts(session.user.email);
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = session.user.email;
  const existing = getUserAlerts(email);

  // Update if id provided, else create new
  if (body.id) {
    const updated = existing.map((a) =>
      a.id === body.id ? { ...a, ...body } : a
    );
    store.set(email, updated);
    return NextResponse.json({ alert: updated.find((a) => a.id === body.id) });
  }

  const alert: Alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: body.name ?? "Unnamed Alert",
    metric: body.metric ?? "sessions",
    condition: body.condition ?? "below",
    threshold: Number(body.threshold) || 0,
    period: body.period ?? "daily",
    channels: body.channels ?? ["in_app"],
    active: true,
    createdAt: new Date().toISOString(),
  };

  store.set(email, [...existing, alert]);

  // If email notification requested, send via Resend (best-effort)
  if (alert.channels.includes("email") && process.env.RESEND_API_KEY) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nexoryx One Alerts <alerts@marketing-intelligence.co>",
        to: [email],
        subject: `✅ Alert created: ${alert.name}`,
        html: `<p>Your alert "<strong>${alert.name}</strong>" has been set up.</p>
               <p>You'll be notified when <strong>${alert.metric}</strong> goes ${alert.condition.replace("_", " ")} <strong>${alert.threshold}</strong> (${alert.period}).</p>
               <p style="color:#888;font-size:12px;">Nexoryx One Analytics</p>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ alert }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const email = session.user.email;
  const existing = getUserAlerts(email);
  store.set(email, existing.filter((a) => a.id !== id));

  return NextResponse.json({ deleted: true });
}
