import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildEmailHtml } from "@/lib/email-report";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: "RESEND_API_KEY is not configured. Add it in Vercel → Environment Variables." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { startDate, endDate, kpis } = body as {
    startDate: string;
    endDate: string;
    kpis: { revenue: number; users: number; purchases: number; roas: number };
  };

  const html = buildEmailHtml({
    userName: session.user.name ?? "there",
    userEmail: session.user.email,
    startDate,
    endDate,
    kpis,
    dashboardUrl:
      process.env.NEXTAUTH_URL ?? "https://marketing-analytics-self.vercel.app",
  });

  // Dynamically import Resend so the build doesn't fail when key is absent
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    // Use Resend's sandbox "from" — works without domain verification
    from: "Marketing Analytics <onboarding@resend.dev>",
    to: session.user.email,
    subject: `Your Marketing Report · ${startDate} → ${endDate}`,
    html,
  });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json({ success: true, id: data?.id });
}
