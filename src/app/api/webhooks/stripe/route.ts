import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe nu este configurat" }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Semnatura lipsa" }, { status: 400 });
  }

  try {
    const { constructWebhookEvent } = await import("@/lib/stripe");
    const event = constructWebhookEvent(body, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const { ngoId, plan } = session.metadata || {};

        if (ngoId && plan) {
          await prisma.ngo.update({
            where: { id: ngoId },
            data: {
              subscriptionPlan: plan,
              subscriptionStatus: "active",
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            },
          });

          await prisma.notification.create({
            data: {
              ngoId,
              type: "SUBSCRIPTION_UPGRADED",
              title: "Abonament activat",
              message: `Planul ${plan} a fost activat cu succes. Multumim!`,
              actionUrl: "/dashboard/settings",
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;

        if (subscription) {
          const ngo = await prisma.ngo.findFirst({
            where: { stripeSubscriptionId: subscription },
          });

          if (ngo) {
            await prisma.ngo.update({
              where: { id: ngo.id },
              data: {
                subscriptionStatus: "active",
                currentPeriodEnd: new Date(invoice.lines?.data?.[0]?.period?.end * 1000),
              },
            });

            await prisma.notification.create({
              data: {
                ngoId: ngo.id,
                type: "SUBSCRIPTION_RENEWED",
                title: "Abonament reinnoit",
                message: "Plata pentru abonament a fost procesata cu succes.",
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;

        if (subscription) {
          const ngo = await prisma.ngo.findFirst({
            where: { stripeSubscriptionId: subscription },
          });

          if (ngo) {
            await prisma.ngo.update({
              where: { id: ngo.id },
              data: { subscriptionStatus: "past_due" },
            });

            await prisma.notification.create({
              data: {
                ngoId: ngo.id,
                type: "PAYMENT_FAILED",
                title: "Plata esuata",
                message: "Plata pentru abonament a esuat. Va rugam sa actualizati metoda de plata.",
                actionUrl: "/dashboard/settings",
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        const ngo = await prisma.ngo.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (ngo) {
          await prisma.ngo.update({
            where: { id: ngo.id },
            data: {
              subscriptionPlan: "BASIC",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
            },
          });

          await prisma.notification.create({
            data: {
              ngoId: ngo.id,
              type: "SUBSCRIPTION_DOWNGRADED",
              title: "Abonament anulat",
              message: "Abonamentul a fost anulat. Contul a fost trecut pe planul BASIC.",
              actionUrl: "/dashboard/settings",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;

        const ngo = await prisma.ngo.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (ngo) {
          await prisma.ngo.update({
            where: { id: ngo.id },
            data: {
              subscriptionStatus: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
