import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Public endpoint: get available donation methods for an NGO
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        stripeConnectOnboarded: true,
        stripeConnectStatus: true,
        stripeChargesEnabled: true,
        bankName: true,
        ibanRon: true,
        ibanEur: true,
        revolutTag: true,
        revolutPhone: true,
        revolutLink: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    const methods = [];

    // Card (Stripe)
    if (ngo.stripeConnectOnboarded && ngo.stripeConnectStatus === "active") {
      methods.push({
        id: "card",
        label: "Card bancar",
        description: "Plateste securizat cu cardul prin Stripe",
        available: true,
      });
    }

    // Bank transfer
    if (ngo.ibanRon || ngo.ibanEur) {
      methods.push({
        id: "bank_transfer",
        label: "Transfer bancar",
        description: "Transfera direct in contul ONG-ului",
        available: true,
        details: {
          bankName: ngo.bankName,
          ibanRon: ngo.ibanRon,
          ibanEur: ngo.ibanEur,
          beneficiary: ngo.name,
        },
      });
    }

    // Revolut
    if (ngo.revolutTag || ngo.revolutLink) {
      methods.push({
        id: "revolut",
        label: "Revolut",
        description: "Trimite rapid prin Revolut",
        available: true,
        details: {
          tag: ngo.revolutTag,
          phone: ngo.revolutPhone,
          link: ngo.revolutLink,
        },
      });
    }

    return NextResponse.json({
      ngoName: ngo.name,
      ngoSlug: ngo.slug,
      methods,
      hasAnyMethod: methods.length > 0,
    });
  } catch (error: any) {
    console.error("Donate methods error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
