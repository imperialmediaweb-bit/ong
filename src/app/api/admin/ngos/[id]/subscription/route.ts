import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { plan } = body;

    if (!plan || !["BASIC", "PRO", "ELITE"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan invalid. Planuri disponibile: BASIC, PRO, ELITE" },
        { status: 400 }
      );
    }

    const ngo = await prisma.ngo.findUnique({ where: { id: params.id } });
    if (!ngo) {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }

    const previousPlan = ngo.subscriptionPlan;

    const updatedNgo = await prisma.ngo.update({
      where: { id: params.id },
      data: { subscriptionPlan: plan },
    });

    // Inregistreaza schimbarea in audit log
    await prisma.auditLog.create({
      data: {
        ngoId: params.id,
        userId: (session.user as any).id,
        action: "SUBSCRIPTION_CHANGED",
        entityType: "Ngo",
        entityId: params.id,
        details: {
          previousPlan,
          newPlan: plan,
          changedBy: (session.user as any).email,
        } as any,
      },
    });

    return NextResponse.json({
      ngo: updatedNgo,
      message: `Planul a fost schimbat de la ${previousPlan} la ${plan}`,
    });
  } catch (error: any) {
    console.error("Eroare la schimbarea planului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la schimbarea planului de abonament" },
      { status: 500 }
    );
  }
}
