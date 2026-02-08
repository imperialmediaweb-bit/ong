import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { assignSubscription, renewSubscription } from "@/lib/subscription-manager";

// PATCH - Assign or change subscription plan
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
    const { plan, durationMonths, notes, sendNotification } = body;

    if (!plan || !["BASIC", "PRO", "ELITE"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan invalid. Planuri disponibile: BASIC, PRO, ELITE" },
        { status: 400 }
      );
    }

    const result = await assignSubscription({
      ngoId: params.id,
      plan,
      durationMonths: durationMonths || null,
      assignedById: (session.user as any).id,
      assignedByEmail: (session.user as any).email || "Super Admin",
      notes,
      sendNotification: sendNotification !== false,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    const updatedNgo = await prisma.ngo.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartAt: true,
        subscriptionExpiresAt: true,
        subscriptionAssignedBy: true,
        subscriptionNotes: true,
      },
    });

    return NextResponse.json({
      ngo: updatedNgo,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Eroare la schimbarea planului:", error);
    return NextResponse.json(
      { error: "Eroare la schimbarea planului de abonament" },
      { status: 500 }
    );
  }
}

// POST - Renew existing subscription
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { durationMonths } = body;

    if (!durationMonths || durationMonths < 1 || durationMonths > 36) {
      return NextResponse.json(
        { error: "Durata invalida. Minim 1 luna, maxim 36 luni." },
        { status: 400 }
      );
    }

    const result = await renewSubscription({
      ngoId: params.id,
      durationMonths,
      renewedById: (session.user as any).id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error: any) {
    console.error("Eroare la reinnoirea abonamentului:", error);
    return NextResponse.json(
      { error: "Eroare la reinnoirea abonamentului" },
      { status: 500 }
    );
  }
}

// GET - Get subscription details for an NGO
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartAt: true,
        subscriptionExpiresAt: true,
        subscriptionAssignedBy: true,
        subscriptionNotes: true,
        autoRenew: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        createdAt: true,
        _count: {
          select: { donors: true, campaigns: true, donations: true },
        },
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    // Get audit history of subscription changes
    const history = await prisma.auditLog.findMany({
      where: {
        ngoId: params.id,
        action: { in: ["SUBSCRIPTION_ASSIGNED", "SUBSCRIPTION_EXPIRED", "SUBSCRIPTION_RENEWED", "SUBSCRIPTION_CHANGED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        action: true,
        details: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ ngo, history });
  } catch (error: any) {
    console.error("Eroare la obtinerea detaliilor abonamentului:", error);
    return NextResponse.json(
      { error: "Eroare la obtinerea detaliilor" },
      { status: 500 }
    );
  }
}
