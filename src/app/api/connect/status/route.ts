import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Verifica statusul contului Stripe Connect al ONG-ului
export async function GET(req: NextRequest) {
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
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    // Daca nu exista cont Connect
    if (!ngo.stripeConnectId) {
      return NextResponse.json({
        connected: false,
        status: "not_created",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        message: "Contul Stripe Connect nu a fost creat inca",
      });
    }

    // Verificam statusul real de la Stripe
    const { getAccountStatus } = await import("@/lib/stripe-connect");
    const accountStatus = await getAccountStatus(ngo.stripeConnectId);

    // Actualizam statusul in baza de date daca s-a schimbat
    let newStatus = ngo.stripeConnectStatus;
    let newOnboarded = ngo.stripeConnectOnboarded;

    if (accountStatus.chargesEnabled && accountStatus.payoutsEnabled) {
      newStatus = "active";
      newOnboarded = true;
    } else if (accountStatus.detailsSubmitted && !accountStatus.chargesEnabled) {
      newStatus = "restricted";
    } else {
      newStatus = "pending";
    }

    if (newStatus !== ngo.stripeConnectStatus || newOnboarded !== ngo.stripeConnectOnboarded) {
      await prisma.ngo.update({
        where: { id: ngoId },
        data: {
          stripeConnectStatus: newStatus,
          stripeConnectOnboarded: newOnboarded,
          stripeChargesEnabled: accountStatus.chargesEnabled,
          stripePayoutsEnabled: accountStatus.payoutsEnabled,
          stripeRequirementsJson: {
            currentlyDue: accountStatus.currentlyDue,
            eventuallyDue: accountStatus.eventuallyDue,
            disabledReason: accountStatus.disabledReason,
          } as any,
          stripeLastSyncAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      connected: accountStatus.chargesEnabled,
      status: newStatus,
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted,
      requiresAction: accountStatus.requiresAction,
      message: accountStatus.chargesEnabled
        ? "Contul Stripe Connect este activ si poate primi plati"
        : accountStatus.detailsSubmitted
          ? "Contul este in curs de verificare de catre Stripe"
          : "Configurarea contului Stripe Connect nu este finalizata",
    });
  } catch (error: any) {
    console.error("Connect status error:", error.message);
    return NextResponse.json(
      { error: "Eroare la verificarea statusului: " + error.message },
      { status: 500 }
    );
  }
}
