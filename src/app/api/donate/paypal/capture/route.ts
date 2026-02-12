import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { notifyDonationReceived } from "@/lib/platform-notifications";

// GET - Callback dupa aprobarea PayPal - captureaza plata si actualizeaza donatia
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get("donation_id");
    const token = searchParams.get("token"); // PayPal order ID from redirect

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!donationId) {
      return NextResponse.redirect(`${appUrl}?error=parametri_lipsa`);
    }

    // Gasim donatia
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        ngo: {
          select: {
            id: true,
            slug: true,
            name: true,
            paypalClientId: true,
            paypalClientSecret: true,
          },
        },
        donor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!donation) {
      return NextResponse.redirect(`${appUrl}?error=donatie_negasita`);
    }

    if (!donation.ngo.paypalClientId || !donation.ngo.paypalClientSecret) {
      return NextResponse.redirect(`${appUrl}?error=paypal_neconfigurat`);
    }

    const orderId = token || donation.paypalOrderId;
    if (!orderId) {
      return NextResponse.redirect(`${appUrl}?error=paypal_order_lipsa`);
    }

    // Capturam plata PayPal
    const { capturePayPalOrder } = await import("@/lib/paypal");

    const captureResult = await capturePayPalOrder({
      clientId: donation.ngo.paypalClientId,
      clientSecret: donation.ngo.paypalClientSecret,
      orderId,
    });

    if (captureResult.status !== "COMPLETED") {
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "FAILED" },
      });

      return NextResponse.redirect(
        `${appUrl}/s/${donation.ngo.slug}?donation=failed`
      );
    }

    // Plata reusita
    if (donation.status !== "COMPLETED") {
      const captureId = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      await prisma.donation.update({
        where: { id: donationId },
        data: {
          status: "COMPLETED",
          metadata: {
            ...((donation.metadata as any) || {}),
            paypalCaptureId: captureId || null,
            paypalPayerEmail: captureResult.payer?.email_address || null,
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

      // Cream notificare in-app pentru ONG
      const donorInfo = donation.donor?.name || donation.donor?.email || captureResult.payer?.email_address || "Anonim";
      await prisma.notification.create({
        data: {
          ngoId: donation.ngoId,
          type: "DONATION_RECEIVED",
          title: "Donatie noua prin PayPal!",
          message: `${donorInfo} a donat ${donation.amount} ${donation.currency} prin PayPal.`,
          actionUrl: "/dashboard/donations",
          metadata: {
            donationId: donation.id,
            amount: donation.amount,
            currency: donation.currency,
            donorName: donorInfo,
            provider: "paypal",
          } as any,
        },
      });

      // Send email notifications (non-blocking)
      notifyDonationReceived({
        donorName: donorInfo,
        donorEmail: donation.donor?.email || captureResult.payer?.email_address || undefined,
        ngoName: donation.ngo.name,
        ngoId: donation.ngoId,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: "PayPal",
      }).catch(() => {});
    }

    return NextResponse.redirect(
      `${appUrl}/s/${donation.ngo.slug}?donation=success&amount=${donation.amount}&currency=${donation.currency}`
    );
  } catch (error: any) {
    console.error("PayPal capture error:", error.message);
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}?error=eroare_paypal`);
  }
}
