import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const ngoId = (session.user as any).ngoId;
  if (!ngoId) return NextResponse.json({ error: "NGO negasit" }, { status: 400 });

  const forms = await prisma.formularAnaf.findMany({
    where: { ngoId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const ngoId = (session.user as any).ngoId;
  if (!ngoId) return NextResponse.json({ error: "NGO negasit" }, { status: 400 });

  const body = await req.json();

  const ngo = await prisma.ngo.findUnique({
    where: { id: ngoId },
    include: { verification: true },
  });
  if (!ngo) return NextResponse.json({ error: "NGO negasit" }, { status: 404 });

  const form = await prisma.formularAnaf.create({
    data: {
      ngoId,
      firstName: body.firstName,
      lastName: body.lastName,
      cnp: body.cnp || null,
      street: body.street || null,
      number: body.number || null,
      block: body.block || null,
      staircase: body.staircase || null,
      floor: body.floor || null,
      apartment: body.apartment || null,
      city: body.city,
      county: body.county,
      postalCode: body.postalCode || null,
      phone: body.phone || null,
      email: body.email || null,
      ngoName: ngo.name,
      ngoCui: ngo.verification?.fiscalCode || ngo.verification?.registrationNumber || "",
      ngoIban: body.ngoIban || null,
      ngoContractNr: body.ngoContractNr || null,
      taxYear: body.taxYear || new Date().getFullYear(),
      percentage: 3.5,
    },
  });

  return NextResponse.json({ form });
}
