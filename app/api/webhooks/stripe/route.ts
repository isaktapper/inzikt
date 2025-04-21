import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Måste använda service role
);

const relevantEvents = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook Error:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    const data = event.data.object as any;

    switch (event.type) {
      case "checkout.session.completed": {
        const customerId = data.customer;
        const subscriptionId = data.subscription;
        const email = data.customer_details?.email;

        if (email) {
          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_active: true,
            })
            .eq("email", email);
        }
        break;
      }

      case "customer.subscription.updated":
      case "invoice.paid": {
        const customerId = data.customer;
        const priceId = data.items.data[0].price.id;

        const plan = mapPriceIdToPlan(priceId);

        await supabase
          .from("profiles")
          .update({
            current_plan: plan.name,
            plan_interval: plan.interval,
            plan_seats_limit: plan.limit,
            plan_active: true,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const customerId = data.customer;

        await supabase
          .from("profiles")
          .update({
            current_plan: null,
            plan_interval: null,
            plan_seats_limit: 0,
            plan_active: false,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }
  }

  return NextResponse.json({ received: true });
}

// Map Stripe price IDs to plan details
function mapPriceIdToPlan(priceId: string) {
  switch (priceId) {
    case "price_1RDuOHGgRGIBAOxtdXc6lEDn":
      return { name: "professional", interval: "monthly", limit: 5000 };
    case "price_1RDuOrGgRGIBAOxtuvq0vp5i":
      return { name: "professional", interval: "yearly", limit: 5000 };
    case "price_1RDuNUGgRGIBAOxtOO3TnDNJ":
      return { name: "growth", interval: "monthly", limit: 1000 };
    case "price_1RDuNUGgRGIBAOxtgDtKGSD3":
      return { name: "growth", interval: "yearly", limit: 1000 };
    default:
      return { name: "unknown", interval: "unknown", limit: 0 };
  }
}
