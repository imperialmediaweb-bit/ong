import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  subscriptionRenewedEmail,
  paymentFailedEmail,
  subscriptionExpiredEmail,
} from "@/lib/subscription-emails";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://ngohub.ro";

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
            include: { users: { where: { role: "NGO_ADMIN" }, select: { email: true } } },
          });

          if (ngo) {
            const newPeriodEnd = new Date(invoice.lines?.data?.[0]?.period?.end * 1000);
            await prisma.ngo.update({
              where: { id: ngo.id },
              data: {
                subscriptionStatus: "active",
                currentPeriodEnd: newPeriodEnd,
                subscriptionExpiresAt: newPeriodEnd,
                lastExpirationNotice: null,
              },
            });

            await prisma.notification.create({
              data: {
                ngoId: ngo.id,
                type: "SUBSCRIPTION_RENEWED",
                title: "Abonament reinnoit",
                message: "Plata recurenta a fost procesata cu succes.",
              },
            });

            // Send email
            for (const admin of ngo.users) {
              const emailData = subscriptionRenewedEmail({
                ngoName: ngo.name,
                plan: ngo.subscriptionPlan,
                nextExpiresAt: newPeriodEnd,
                dashboardUrl: `${APP_URL}/dashboard`,
              });
              await sendEmail({
                to: admin.email,
                subject: emailData.subject,
                html: emailData.html,
                from: "noreply@ngohub.ro",
                fromName: "NGO HUB",
              }).catch(console.error);
            }
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
            include: { users: { where: { role: "NGO_ADMIN" }, select: { email: true } } },
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

            // Send payment failed email
            for (const admin of ngo.users) {
              const emailData = paymentFailedEmail({
                ngoName: ngo.name,
                plan: ngo.subscriptionPlan,
                dashboardUrl: `${APP_URL}/dashboard/settings`,
              });
              await sendEmail({
                to: admin.email,
                subject: emailData.subject,
                html: emailData.html,
                from: "noreply@ngohub.ro",
                fromName: "NGO HUB",
              }).catch(console.error);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        const ngo = await prisma.ngo.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          include: { users: { where: { role: "NGO_ADMIN" }, select: { email: true } } },
        });

        if (ngo) {
          const previousPlan = ngo.subscriptionPlan;
          await prisma.ngo.update({
            where: { id: ngo.id },
            data: {
              subscriptionPlan: "BASIC",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
              subscriptionExpiresAt: null,
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

          // Send expiration email
          for (const admin of ngo.users) {
            const emailData = subscriptionExpiredEmail({
              ngoName: ngo.name,
              previousPlan,
              dashboardUrl: `${APP_URL}/dashboard/settings`,
            });
            await sendEmail({
              to: admin.email,
              subject: emailData.subject,
              html: emailData.html,
              from: "noreply@ngohub.ro",
              fromName: "NGO HUB",
            }).catch(console.error);
          }
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
