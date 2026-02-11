import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Retrieve payment settings (Stripe Connect status + bank/Revolut info)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "ONG-ul nu este asociat" }, { status: 403 });
    }

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: {
        stripeConnectId: true,
        stripeConnectStatus: true,
        stripeConnectOnboarded: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        stripeRequirementsJson: true,
        stripeLastSyncAt: true,
        paypalClientId: true,
        paypalClientSecret: true,
        paypalMerchantId: true,
        paypalEnabled: true,
        bankName: true,
        ibanRon: true,
        ibanEur: true,
        revolutTag: true,
        revolutPhone: true,
        revolutLink: true,
        subscriptionPlan: true,
        donationFeePercent: true,
        donationFeeFixedAmount: true,
        donationFeeMinAmount: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    return NextResponse.json(ngo);
  } catch (error: any) {
    console.error("Payment settings GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update bank transfer / Revolut settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const role = (session.user as any).role;

    if (!ngoId || (role !== "NGO_ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Doar administratorul poate modifica setarile de plata" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bankName, ibanRon, ibanEur, revolutTag, revolutPhone, revolutLink, paypalClientId, paypalClientSecret, paypalMerchantId, paypalEnabled } = body;

    // Basic IBAN validation (Romanian IBANs start with RO and are 24 chars)
    if (ibanRon && typeof ibanRon === "string") {
      const cleaned = ibanRon.replace(/\s/g, "").toUpperCase();
      if (cleaned.length > 0 && (!cleaned.startsWith("RO") || cleaned.length !== 24)) {
        return NextResponse.json(
          { error: "IBAN-ul RON trebuie sa inceapa cu RO si sa aiba 24 caractere" },
          { status: 400 }
        );
      }
    }

    if (ibanEur && typeof ibanEur === "string") {
      const cleaned = ibanEur.replace(/\s/g, "").toUpperCase();
      if (cleaned.length > 0 && cleaned.length < 15) {
        return NextResponse.json(
          { error: "IBAN-ul EUR nu este valid" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {
      bankName: bankName || null,
      ibanRon: ibanRon ? ibanRon.replace(/\s/g, "").toUpperCase() : null,
      ibanEur: ibanEur ? ibanEur.replace(/\s/g, "").toUpperCase() : null,
      revolutTag: revolutTag || null,
      revolutPhone: revolutPhone || null,
      revolutLink: revolutLink || null,
    };

    // PayPal fields
    if (paypalClientId !== undefined) updateData.paypalClientId = paypalClientId || null;
    if (paypalClientSecret !== undefined) updateData.paypalClientSecret = paypalClientSecret || null;
    if (paypalMerchantId !== undefined) updateData.paypalMerchantId = paypalMerchantId || null;
    if (paypalEnabled !== undefined) updateData.paypalEnabled = !!paypalEnabled;

    await prisma.ngo.update({
      where: { id: ngoId },
      data: updateData,
    });

    return NextResponse.json({ message: "Setarile de plata au fost salvate cu succes" });
  } catch (error: any) {
    console.error("Payment settings PUT error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
