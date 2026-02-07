import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const ngo = await prisma.ngo.findUnique({ where: { id: params.id } });
    if (!ngo) {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      status,
      registrationNumber,
      legalForm,
      fiscalCode,
      address,
      county,
      city,
      representativeName,
      representativeRole,
      reviewNotes,
      rejectionReason,
    } = body;

    const verification = await prisma.ngoVerification.upsert({
      where: { ngoId: params.id },
      create: {
        ngoId: params.id,
        status: status || "PENDING",
        registrationNumber,
        legalForm,
        fiscalCode,
        address,
        county,
        city,
        representativeName,
        representativeRole,
        reviewNotes,
        rejectionReason,
        reviewedBy: (session.user as any).id,
        reviewedAt: status && status !== "PENDING" ? new Date() : null,
      },
      update: {
        status: status || undefined,
        registrationNumber,
        legalForm,
        fiscalCode,
        address,
        county,
        city,
        representativeName,
        representativeRole,
        reviewNotes,
        rejectionReason,
        reviewedBy: (session.user as any).id,
        reviewedAt: status && status !== "PENDING" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      verification,
      message: "Verificarea a fost salvata cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la salvarea verificarii:", error);
    return NextResponse.json(
      { error: "Eroare la salvarea verificarii" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const existing = await prisma.ngoVerification.findUnique({
      where: { ngoId: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Verificarea nu a fost gasita. Creati mai intai o verificare." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, reviewNotes, rejectionReason } = body;

    if (
      !status ||
      !["PENDING", "IN_REVIEW", "AI_CHECKED", "APPROVED", "REJECTED", "SUSPENDED"].includes(
        status
      )
    ) {
      return NextResponse.json(
        { error: "Status invalid. Statusuri permise: PENDING, IN_REVIEW, AI_CHECKED, APPROVED, REJECTED, SUSPENDED" },
        { status: 400 }
      );
    }

    const data: any = {
      status,
      reviewedBy: (session.user as any).id,
      reviewedAt: new Date(),
    };

    if (reviewNotes !== undefined) data.reviewNotes = reviewNotes;
    if (rejectionReason !== undefined) data.rejectionReason = rejectionReason;

    const verification = await prisma.ngoVerification.update({
      where: { ngoId: params.id },
      data,
    });

    return NextResponse.json({
      verification,
      message:
        status === "APPROVED"
          ? "ONG-ul a fost aprobat cu succes"
          : status === "REJECTED"
          ? "ONG-ul a fost respins"
          : "Statusul verificarii a fost actualizat",
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea verificarii:", error);
    return NextResponse.json(
      { error: "Eroare la actualizarea verificarii" },
      { status: 500 }
    );
  }
}
