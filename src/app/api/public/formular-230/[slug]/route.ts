import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug },
      include: { verification: true },
    });
    if (!ngo) return NextResponse.json({ error: "Organizatia nu a fost gasita" }, { status: 404 });

    const body = await req.json();

    const form = await prisma.formularAnaf.create({
      data: {
        ngoId: ngo.id,
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        cnp: body.cnp || null,
        street: body.street || null,
        number: body.number || null,
        block: body.block || null,
        staircase: body.staircase || null,
        floor: body.floor || null,
        apartment: body.apartment || null,
        city: body.city || "",
        county: body.county || "",
        postalCode: body.postalCode || null,
        phone: body.phone || null,
        email: body.email || null,
        ngoName: ngo.name,
        ngoCui: ngo.verification?.fiscalCode || ngo.verification?.registrationNumber || "",
        ngoIban: null,
        taxYear: body.taxYear || new Date().getFullYear(),
        percentage: 3.5,
      },
    });

    return NextResponse.json({ id: form.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
