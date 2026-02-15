import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Webhook-uri Stripe Connect pentru evenimente legate de conturi si plati
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Semnatura lipsa" }, { status: 400 });
  }

  try {
    const { constructConnectWebhookEvent } = await import("@/lib/stripe-connect");
    const event = await constructConnectWebhookEvent(body, signature);

    switch (event.type) {
      // ─── Cont Actualizat ────────────────────────────────────
      case "account.updated": {
        const account = event.data.object as any;
        const accountId = account.id;

        const ngo = await prisma.ngo.findFirst({
          where: { stripeConnectId: accountId },
        });

        if (ngo) {
          let newStatus = "pending";
          let onboarded = false;
          const chargesEnabled = account.charges_enabled || false;
          const payoutsEnabled = account.payouts_enabled || false;

          if (chargesEnabled && payoutsEnabled) {
            newStatus = "active";
            onboarded = true;
          } else if (account.details_submitted && !chargesEnabled) {
            newStatus = "restricted";
          }

          await prisma.ngo.update({
            where: { id: ngo.id },
            data: {
              stripeConnectStatus: newStatus,
              stripeConnectOnboarded: onboarded,
              stripeChargesEnabled: chargesEnabled,
              stripePayoutsEnabled: payoutsEnabled,
              stripeRequirementsJson: {
                currentlyDue: account.requirements?.currently_due || [],
                eventuallyDue: account.requirements?.eventually_due || [],
                disabledReason: account.requirements?.disabled_reason || null,
              } as any,
              stripeLastSyncAt: new Date(),
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

      // ─── Checkout Session Completata ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const donationId = session.metadata?.donationId;

        if (donationId && session.payment_status === "paid") {
          const donation = await prisma.donation.findUnique({
            where: { id: donationId },
          });

          if (donation && donation.status === "PENDING") {
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

            await prisma.donation.update({
              where: { id: donationId },
              data: {
                status: "COMPLETED",
                stripePaymentIntentId: paymentIntentId || null,
                stripeCheckoutSessionId: session.id,
                metadata: {
                  ...(donation.metadata as any || {}),
                  stripePaymentIntentId: paymentIntentId,
                  completedAt: new Date().toISOString(),
                } as any,
              },
            });

            await prisma.ngo.update({
              where: { id: donation.ngoId },
              data: {
                totalRaised: { increment: donation.amount },
                donorCountPublic: { increment: 1 },
              },
            });

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

            const donorName = session.metadata?.donorName || session.customer_email || "Anonim";
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

      // ─── Plata Reusita ──────────────────────────────────────
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        const donationId = paymentIntent.metadata?.donationId;

        if (donationId) {
          const donation = await prisma.donation.findUnique({
            where: { id: donationId },
          });

          if (donation && donation.status !== "COMPLETED") {
            await prisma.donation.update({
              where: { id: donationId },
              data: {
                status: "COMPLETED",
                stripePaymentIntentId: paymentIntent.id,
                metadata: {
                  ...(donation.metadata as any || {}),
                  stripePaymentIntentId: paymentIntent.id,
                  completedAt: new Date().toISOString(),
                } as any,
              },
            });

            await prisma.ngo.update({
              where: { id: donation.ngoId },
              data: {
                totalRaised: { increment: donation.amount },
                donorCountPublic: { increment: 1 },
              },
            });

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
                stripePaymentIntentId: paymentIntent.id,
                metadata: {
                  ...(donation.metadata as any || {}),
                  stripePaymentIntentId: paymentIntent.id,
                  failureMessage: paymentIntent.last_payment_error?.message || "Plata a esuat",
                  failedAt: new Date().toISOString(),
                } as any,
              },
            });

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

      // ─── Refund ─────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          // Find donation by payment intent ID
          const donation = await prisma.donation.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (donation && donation.status === "COMPLETED") {
            await prisma.donation.update({
              where: { id: donation.id },
              data: {
                status: "REFUNDED",
                metadata: {
                  ...(donation.metadata as any || {}),
                  refundedAt: new Date().toISOString(),
                  refundAmount: charge.amount_refunded / 100,
                } as any,
              },
            });

            // Decrement NGO stats
            await prisma.ngo.update({
              where: { id: donation.ngoId },
              data: {
                totalRaised: { decrement: donation.amount },
              },
            });

            if (donation.donorId) {
              await prisma.donor.update({
                where: { id: donation.donorId },
                data: {
                  totalDonated: { decrement: donation.amount },
                  donationCount: { decrement: 1 },
                },
              });
            }

            await prisma.notification.create({
              data: {
                ngoId: donation.ngoId,
                type: "SYSTEM",
                title: "Donatie rambursata",
                message: `O donatie de ${donation.amount} ${donation.currency} a fost rambursata.`,
                actionUrl: "/dashboard/donations",
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`Stripe Connect webhook netratat: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Connect webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
