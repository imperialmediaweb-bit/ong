import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateDonationFee } from "@/lib/donation-fee";

// POST - Creeaza o comanda PayPal pentru donatie (endpoint public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ngoSlug, amount, currency, donorEmail, donorName, message, returnUrl } = body;

    if (!ngoSlug) {
      return NextResponse.json(
        { error: "Slug-ul ONG-ului este obligatoriu" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json(
        { error: "Suma donata trebuie sa fie cel putin 1 RON" },
        { status: 400 }
      );
    }

    if (amount > 50000) {
      return NextResponse.json(
        { error: "Suma maxima pentru donatie este 50.000 RON" },
        { status: 400 }
      );
    }

    const ngo = await prisma.ngo.findUnique({
      where: { slug: ngoSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        subscriptionPlan: true,
        paypalClientId: true,
        paypalClientSecret: true,
        paypalEnabled: true,
        donationFeePercent: true,
        donationFeeFixedAmount: true,
        donationFeeMinAmount: true,
      },
    });

    if (!ngo || !ngo.isActive) {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit sau nu este activ" },
        { status: 404 }
      );
    }

    if (!ngo.paypalEnabled || !ngo.paypalClientId || !ngo.paypalClientSecret) {
      return NextResponse.json(
        { error: "Acest ONG nu accepta plati PayPal" },
        { status: 400 }
      );
    }

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const donationCurrency = currency || "RON";

    const feeResult = calculateDonationFee(amount, ngo.subscriptionPlan, {
      donationFeePercent: ngo.donationFeePercent,
      donationFeeFixedAmount: ngo.donationFeeFixedAmount,
      donationFeeMinAmount: ngo.donationFeeMinAmount,
    });

    // Cautam sau cream donatorul
    let donorId: string | null = null;

    if (donorEmail) {
      let donor = await prisma.donor.findFirst({
        where: { ngoId: ngo.id, email: donorEmail },
      });

      if (!donor) {
        donor = await prisma.donor.create({
          data: {
            ngoId: ngo.id,
            email: donorEmail,
            name: donorName || null,
            privacyConsent: true,
          },
        });
      } else if (donorName && !donor.name) {
        donor = await prisma.donor.update({
          where: { id: donor.id },
          data: { name: donorName },
        });
      }

      donorId = donor.id;
    }

    // Cream donatia in baza de date cu status PENDING
    const donation = await prisma.donation.create({
      data: {
        ngoId: ngo.id,
        donorId,
        amount,
        currency: donationCurrency,
        status: "PENDING",
        source: "paypal",
        paymentProvider: "paypal",
        applicationFeeAmount: feeResult.feeAmount,
        metadata: {
          donorEmail: donorEmail || null,
          donorName: donorName || null,
          message: message || null,
          plan: ngo.subscriptionPlan,
          feePercent: feeResult.feeAmount > 0 ? `${((feeResult.feeAmount / amount) * 100).toFixed(2)}%` : "0%",
        } as any,
      },
    });

    const successUrl = returnUrl
      ? `${returnUrl}?donation=success&donation_id=${donation.id}`
      : `${appUrl}/api/donate/paypal/capture?donation_id=${donation.id}`;
    const cancelUrl = returnUrl
      ? `${returnUrl}?donation=cancelled`
      : `${appUrl}/s/${ngo.slug}?donation=cancelled`;

    // Cream comanda PayPal
    const { createPayPalOrder } = await import("@/lib/paypal");

    const paypalOrder = await createPayPalOrder({
      clientId: ngo.paypalClientId,
      clientSecret: ngo.paypalClientSecret,
      amount,
      currency: donationCurrency,
      ngoName: ngo.name,
      donationId: donation.id,
      returnUrl: successUrl,
      cancelUrl,
    });

    // Salvam PayPal order ID
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        paypalOrderId: paypalOrder.orderId,
        metadata: {
          donorEmail: donorEmail || null,
          donorName: donorName || null,
          message: message || null,
          paypalOrderId: paypalOrder.orderId,
          plan: ngo.subscriptionPlan,
        } as any,
      },
    });

    return NextResponse.json({
      approveUrl: paypalOrder.approveUrl,
      orderId: paypalOrder.orderId,
      donationId: donation.id,
      message: "Comanda PayPal creata cu succes",
    });
  } catch (error: any) {
    console.error("PayPal donate error:", error.message);
    return NextResponse.json(
      { error: "Eroare la crearea comenzii PayPal: " + error.message },
      { status: 500 }
    );
  }
}
