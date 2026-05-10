/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events after a successful payment.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY       — your Stripe secret key
 *   STRIPE_WEBHOOK_SECRET   — from Stripe Dashboard → Webhooks → signing secret
 *
 * In Stripe Dashboard, add webhook endpoint:
 *   https://your-domain.vercel.app/api/stripe/webhook
 *   Events to listen for: checkout.session.completed
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userEmail = session.metadata?.userEmail;
        const plan = session.metadata?.plan;

        // TODO: persist subscription status in your DB / Vercel KV
        // Example with Vercel KV:
        //   await kv.set(`plan:${userEmail}`, plan);
        //   await kv.set(`subscription:${userEmail}`, session.subscription);

        console.log(`[Stripe] ✅ ${userEmail} subscribed to ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        console.log(`[Stripe] ❌ Subscription cancelled: ${sub.id}`);
        // TODO: remove plan from DB / KV
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook]", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
