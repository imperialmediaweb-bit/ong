import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug },
      include: { verification: true, miniSiteConfig: true },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO negasit" }, { status: 404 });
    }

    const config = ngo.miniSiteConfig;

    const body = await req.json();

    // Validate required fields
    if (!body.companyName || !body.companyCui || !body.companyRep) {
      return NextResponse.json(
        { error: "Campuri obligatorii lipsa: denumire firma, CUI, reprezentant" },
        { status: 400 }
      );
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Suma trebuie sa fie un numar pozitiv" },
        { status: 400 }
      );
    }

    // Generate contract number: CS-YEAR-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.sponsorshipContract.count({
      where: { ngoId: ngo.id },
    });
    const contractNumber = `CS-${year}-${String(count + 1).padStart(4, "0")}`;

    const contract = await prisma.sponsorshipContract.create({
      data: {
        ngoId: ngo.id,
        companyName: body.companyName,
        companyCui: body.companyCui,
        companyAddress: body.companyAddress || "",
        companyCounty: body.companyCounty || null,
        companyCity: body.companyCity || null,
        companyRep: body.companyRep,
        companyRepRole: body.companyRepRole || "Administrator",
        companyEmail: body.companyEmail || null,
        companyPhone: body.companyPhone || null,
        companyIban: body.companyIban || null,
        ngoName: ngo.name,
        ngoCui:
          config?.cui ||
          ngo.verification?.fiscalCode ||
          ngo.verification?.registrationNumber ||
          "",
        ngoAddress: config?.contactAddress || ngo.verification?.address || null,
        ngoRep: config?.legalRepresentative || ngo.verification?.representativeName || null,
        ngoRepRole:
          config?.legalRepresentativeRole || ngo.verification?.representativeRole || "Presedinte",
        ngoIban: config?.bankAccount || null,
        contractNumber,
        amount,
        currency: "RON",
        purpose: body.purpose || null,
        duration: body.duration || "12 luni",
        paymentTerms:
          body.paymentTerms || "30 de zile de la semnarea contractului",
        status: "DRAFT",
      },
    });

    return NextResponse.json(
      { id: contract.id, contractNumber },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Contract sponsorizare POST error:", error);
    return NextResponse.json(
      { error: error.message || "Eroare interna" },
      { status: 500 }
    );
  }
}
