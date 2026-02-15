import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateDonationFee } from "@/lib/donation-fee";

// POST - Creeaza o sesiune de plata Stripe pentru donatie (endpoint public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ngoSlug, amount, currency, donorEmail, donorName, message, returnUrl } = body;

    // Validari
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

    // Cautam ONG-ul dupa slug
    const ngo = await prisma.ngo.findUnique({
      where: { slug: ngoSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        subscriptionPlan: true,
        stripeConnectId: true,
        stripeConnectStatus: true,
        stripeConnectOnboarded: true,
        stripeChargesEnabled: true,
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

    // Verificam daca Stripe Connect este configurat si activ
    if (!ngo.stripeConnectId || ngo.stripeConnectStatus !== "active" || !ngo.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "Acest ONG nu accepta plati online inca" },
        { status: 400 }
      );
    }

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://www.binevo.ro";
    const donationCurrency = currency || "RON";

    // Calculate plan-based fee
    const feeResult = calculateDonationFee(amount, ngo.subscriptionPlan, {
      donationFeePercent: ngo.donationFeePercent,
      donationFeeFixedAmount: ngo.donationFeeFixedAmount,
      donationFeeMinAmount: ngo.donationFeeMinAmount,
    });

    // Suma in bani (Stripe lucreaza in cea mai mica unitate monetara)
    const amountInSmallestUnit = Math.round(amount * 100);

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
        source: "stripe_connect",
        paymentProvider: "stripe",
        applicationFeeAmount: feeResult.feeAmount,
        metadata: {
          donorEmail: donorEmail || null,
          donorName: donorName || null,
          message: message || null,
          stripeConnectId: ngo.stripeConnectId,
          plan: ngo.subscriptionPlan,
          feePercent: feeResult.feeAmount > 0 ? `${((feeResult.feeAmount / amount) * 100).toFixed(2)}%` : "0%",
        } as any,
      },
    });

    // Cream sesiunea Stripe Checkout
    const { createDonationCheckout } = await import("@/lib/stripe-connect");

    const successUrl = returnUrl
      ? `${returnUrl}?donation=success&donation_id=${donation.id}`
      : `${appUrl}/donate/${ngo.slug}?donation=success&donation_id=${donation.id}`;
    const cancelUrl = returnUrl
      ? `${returnUrl}?donation=cancelled`
      : `${appUrl}/s/${ngo.slug}?donation=cancelled`;

    const checkoutSession = await createDonationCheckout({
      ngoName: ngo.name,
      amount: amountInSmallestUnit,
      currency: donationCurrency,
      connectedAccountId: ngo.stripeConnectId,
      successUrl,
      cancelUrl,
      donorEmail: donorEmail || undefined,
      applicationFeeAmount: feeResult.feeAmountCents > 0 ? feeResult.feeAmountCents : undefined,
      metadata: {
        donationId: donation.id,
        ngoId: ngo.id,
        ngoSlug: ngo.slug,
        donorId: donorId || "",
        donorEmail: donorEmail || "",
        donorName: donorName || "",
        message: message || "",
      },
    });

    // Salvam ID-ul sesiunii Stripe
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
        metadata: {
          donorEmail: donorEmail || null,
          donorName: donorName || null,
          message: message || null,
          stripeConnectId: ngo.stripeConnectId,
          stripeCheckoutSessionId: checkoutSession.id,
          plan: ngo.subscriptionPlan,
        } as any,
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      donationId: donation.id,
      message: "Sesiune de plata creata cu succes",
    });
  } catch (error: any) {
    console.error("Donate error:", error.message);
    return NextResponse.json(
      { error: "Eroare la crearea sesiunii de plata: " + error.message },
      { status: 500 }
    );
  }
}
