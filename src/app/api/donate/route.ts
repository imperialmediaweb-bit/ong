import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Creeaza o sesiune de plata pentru donatie (endpoint public, fara autentificare)
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

    // Cautam ONG-ul dupa slug
    const ngo = await prisma.ngo.findUnique({
      where: { slug: ngoSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        stripeConnectId: true,
        stripeConnectStatus: true,
        stripeConnectOnboarded: true,
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

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const donationCurrency = currency || "RON";

    // Suma in bani (Stripe lucreaza in cea mai mica unitate monetara)
    // 1 RON = 100 bani
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
        metadata: {
          donorEmail: donorEmail || null,
          donorName: donorName || null,
          message: message || null,
          stripeConnectId: ngo.stripeConnectId,
        } as any,
      },
    });

    // Cream sesiunea Stripe Checkout
    const { createDonationCheckout } = await import("@/lib/stripe-connect");

    const successUrl = returnUrl
      ? `${returnUrl}?donation=success&donation_id=${donation.id}`
      : `${appUrl}/api/donate/success?session_id={CHECKOUT_SESSION_ID}&donation_id=${donation.id}`;
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
      applicationFeePercent: 2.5, // Platforma ia 2.5% comision
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

    // Salvam ID-ul sesiunii Stripe in metadata donatiei
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        metadata: {
          donorEmail: donorEmail || null,
          donorName: donorName || null,
          message: message || null,
          stripeConnectId: ngo.stripeConnectId,
          stripeCheckoutSessionId: checkoutSession.id,
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
