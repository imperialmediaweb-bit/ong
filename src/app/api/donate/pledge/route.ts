import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Generate a unique reference code like ONG-XXXX
 */
function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ONG-${code}`;
}

// POST - Create a manual donation pledge (bank transfer / Revolut)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ngoSlug, amount, currency, paymentMethod, donorName, donorEmail, donorPhone } = body;

    if (!ngoSlug) {
      return NextResponse.json({ error: "Slug-ul ONG-ului este obligatoriu" }, { status: 400 });
    }

    if (!paymentMethod || !["bank_transfer", "revolut"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Metoda de plata invalida. Alege bank_transfer sau revolut." },
        { status: 400 }
      );
    }

    const ngo = await prisma.ngo.findUnique({
      where: { slug: ngoSlug },
      select: {
        id: true,
        name: true,
        isActive: true,
        ibanRon: true,
        ibanEur: true,
        bankName: true,
        revolutTag: true,
        revolutPhone: true,
        revolutLink: true,
      },
    });

    if (!ngo || !ngo.isActive) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    // Validate payment method is configured
    if (paymentMethod === "bank_transfer" && !ngo.ibanRon) {
      return NextResponse.json(
        { error: "Transferul bancar nu este configurat pentru acest ONG" },
        { status: 400 }
      );
    }

    if (paymentMethod === "revolut" && !ngo.revolutTag && !ngo.revolutLink) {
      return NextResponse.json(
        { error: "Revolut nu este configurat pentru acest ONG" },
        { status: 400 }
      );
    }

    // Generate unique reference code
    let referenceCode = generateReferenceCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.manualDonationPledge.findUnique({
        where: { referenceCode },
      });
      if (!existing) break;
      referenceCode = generateReferenceCode();
      attempts++;
    }

    const pledge = await prisma.manualDonationPledge.create({
      data: {
        ngoId: ngo.id,
        donorName: donorName || null,
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null,
        amount: amount ? Number(amount) : null,
        currency: currency || "RON",
        paymentMethod,
        referenceCode,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      pledgeId: pledge.id,
      referenceCode: pledge.referenceCode,
      paymentMethod,
      message: paymentMethod === "bank_transfer"
        ? `Foloseste referinta ${pledge.referenceCode} in descrierea transferului bancar.`
        : `Foloseste referinta ${pledge.referenceCode} in mesajul platii Revolut.`,
      bankDetails: paymentMethod === "bank_transfer" ? {
        bankName: ngo.bankName,
        ibanRon: ngo.ibanRon,
        ibanEur: ngo.ibanEur,
        beneficiary: ngo.name,
      } : undefined,
      revolutDetails: paymentMethod === "revolut" ? {
        tag: ngo.revolutTag,
        phone: ngo.revolutPhone,
        link: ngo.revolutLink,
      } : undefined,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Pledge creation error:", error.message);
    return NextResponse.json({ error: "Eroare la crearea pledgeului" }, { status: 500 });
  }
}
