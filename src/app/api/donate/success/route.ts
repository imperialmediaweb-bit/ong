import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Callback dupa plata reusita - verifica plata si actualizeaza donatia
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const donationId = searchParams.get("donation_id");

    if (!sessionId || !donationId) {
      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}?error=parametri_lipsa`);
    }

    // Gasim donatia
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        ngo: {
          select: { id: true, slug: true, name: true, stripeConnectId: true },
        },
        donor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!donation) {
      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}?error=donatie_negasita`);
    }

    // Verificam plata cu Stripe
    const { retrieveCheckoutSession } = await import("@/lib/stripe-connect");
    const checkoutSession = await retrieveCheckoutSession(sessionId);

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (checkoutSession.payment_status !== "paid") {
      // Plata nu a fost finalizata
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "FAILED" },
      });

      return NextResponse.redirect(
        `${appUrl}/s/${donation.ngo.slug}?donation=failed`
      );
    }

    // Plata reusita - actualizam donatia
    if (donation.status !== "COMPLETED") {
      await prisma.donation.update({
        where: { id: donationId },
        data: {
          status: "COMPLETED",
          metadata: {
            ...(donation.metadata as any || {}),
            stripePaymentIntentId: (checkoutSession.payment_intent as any)?.id || checkoutSession.payment_intent,
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

      // Cream notificare pentru ONG
      const donorInfo = donation.donor?.name || donation.donor?.email || "Anonim";
      await prisma.notification.create({
        data: {
          ngoId: donation.ngoId,
          type: "DONATION_RECEIVED",
          title: "Donatie noua primita!",
          message: `${donorInfo} a donat ${donation.amount} ${donation.currency} prin platforma.`,
          actionUrl: "/dashboard/donations",
          metadata: {
            donationId: donation.id,
            amount: donation.amount,
            currency: donation.currency,
            donorName: donorInfo,
          } as any,
        },
      });
    }

    // Redirectionam catre pagina de multumire
    return NextResponse.redirect(
      `${appUrl}/s/${donation.ngo.slug}?donation=success&amount=${donation.amount}&currency=${donation.currency}`
    );
  } catch (error: any) {
    console.error("Donate success callback error:", error.message);
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}?error=eroare_verificare_plata`);
  }
}
