import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Webhook-uri Stripe Connect pentru evenimente legate de conturi si plati
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe Connect nu este configurat" },
      { status: 400 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Semnatura lipsa" }, { status: 400 });
  }

  try {
    const { constructConnectWebhookEvent } = await import("@/lib/stripe-connect");
    const event = constructConnectWebhookEvent(body, signature);

    switch (event.type) {
      // ─── Cont Actualizat ────────────────────────────────────
      case "account.updated": {
        const account = event.data.object as any;
        const accountId = account.id;

        // Cautam ONG-ul cu acest cont Connect
        const ngo = await prisma.ngo.findFirst({
          where: { stripeConnectId: accountId },
        });

        if (ngo) {
          let newStatus = "pending";
          let onboarded = false;

          if (account.charges_enabled && account.payouts_enabled) {
            newStatus = "active";
            onboarded = true;
          } else if (account.details_submitted && !account.charges_enabled) {
            newStatus = "restricted";
          }

          await prisma.ngo.update({
            where: { id: ngo.id },
            data: {
              stripeConnectStatus: newStatus,
              stripeConnectOnboarded: onboarded,
            },
          });

          // Notificam ONG-ul despre schimbarea statusului
          if (newStatus === "active" && ngo.stripeConnectStatus !== "active") {
            await prisma.notification.create({
              data: {
                ngoId: ngo.id,
                type: "SYSTEM",
                title: "Contul Stripe Connect este activ!",
                message: "Contul dvs. Stripe a fost verificat si acum puteti primi donatii online.",
                actionUrl: "/dashboard/settings",
              },
            });
          } else if (newStatus === "restricted") {
            await prisma.notification.create({
              data: {
                ngoId: ngo.id,
                type: "SYSTEM",
                title: "Actiune necesara pentru contul Stripe",
                message: "Contul dvs. Stripe necesita informatii suplimentare. Va rugam sa completati verificarea.",
                actionUrl: "/dashboard/settings",
              },
            });
          }
        }
        break;
      }

      // ─── Plata Reusita ──────────────────────────────────────
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        const donationId = paymentIntent.metadata?.donationId;

        if (donationId) {
          const donation = await prisma.donation.findUnique({
            where: { id: donationId },
          });

          if (donation && donation.status !== "COMPLETED") {
            // Actualizam donatia
            await prisma.donation.update({
              where: { id: donationId },
              data: {
                status: "COMPLETED",
                metadata: {
                  ...(donation.metadata as any || {}),
                  stripePaymentIntentId: paymentIntent.id,
                  completedAt: new Date().toISOString(),
                } as any,
              },
            });

            // Actualizam statisticile ONG-ului
            await prisma.ngo.update({
              where: { id: donation.ngoId },
              data: {
                totalRaised: { increment: donation.amount },
                donorCountPublic: { increment: 1 },
              },
            });

            // Actualizam statisticile donatorului
            if (donation.donorId) {
              await prisma.donor.update({
                where: { id: donation.donorId },
                data: {
                  totalDonated: { increment: donation.amount },
                  donationCount: { increment: 1 },
                  lastDonationAt: new Date(),
                },
              });
            }

            // Notificam ONG-ul
            const donorName = paymentIntent.metadata?.donorName || paymentIntent.metadata?.donorEmail || "Anonim";
            await prisma.notification.create({
              data: {
                ngoId: donation.ngoId,
                type: "DONATION_RECEIVED",
                title: "Donatie noua primita!",
                message: `${donorName} a donat ${donation.amount} ${donation.currency} prin platforma.`,
                actionUrl: "/dashboard/donations",
                metadata: {
                  donationId: donation.id,
                  amount: donation.amount,
                  currency: donation.currency,
                  donorName,
                } as any,
              },
            });
          }
        }
        break;
      }

      // ─── Plata Esuata ───────────────────────────────────────
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        const donationId = paymentIntent.metadata?.donationId;

        if (donationId) {
          const donation = await prisma.donation.findUnique({
            where: { id: donationId },
          });

          if (donation && donation.status === "PENDING") {
            await prisma.donation.update({
              where: { id: donationId },
              data: {
                status: "FAILED",
                metadata: {
                  ...(donation.metadata as any || {}),
                  stripePaymentIntentId: paymentIntent.id,
                  failureMessage: paymentIntent.last_payment_error?.message || "Plata a esuat",
                  failedAt: new Date().toISOString(),
                } as any,
              },
            });

            // Notificam ONG-ul despre plata esuata
            await prisma.notification.create({
              data: {
                ngoId: donation.ngoId,
                type: "PAYMENT_FAILED",
                title: "Plata pentru donatie a esuat",
                message: `O tentativa de donatie de ${donation.amount} ${donation.currency} a esuat.`,
                actionUrl: "/dashboard/donations",
                metadata: {
                  donationId: donation.id,
                  amount: donation.amount,
                  reason: paymentIntent.last_payment_error?.message || "Necunoscut",
                } as any,
              },
            });
          }
        }
        break;
      }

      default:
        // Eveniment netratat - nu facem nimic
        console.log(`Stripe Connect webhook netratat: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Connect webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
