/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for Pro or Agency subscription.
 * Requires STRIPE_SECRET_KEY in env vars.
 *
 * Body: { plan: "pro" | "agency" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PLANS = {
  pro: {
    name: "Marketing Intelligence Pro",
    amount: 2900, // £29.00 in pence
    currency: "gbp",
    interval: "month" as const,
  },
  agency: {
    name: "Marketing Intelligence Agency",
    amount: 9900, // £99.00 in pence
    currency: "gbp",
    interval: "month" as const,
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      {
        error: "Stripe not configured",
        message: "Add STRIPE_SECRET_KEY to your Vercel environment variables to enable payments.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const plan = body.plan as "pro" | "agency";

  if (!PLANS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: session.user?.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: PLANS[plan].currency,
            product_data: { name: PLANS[plan].name },
            unit_amount: PLANS[plan].amount,
            recurring: { interval: PLANS[plan].interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/overview?upgraded=1`,
      cancel_url: `${baseUrl}/overview`,
      metadata: {
        userEmail: session.user?.email ?? "",
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("[Stripe Checkout]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
