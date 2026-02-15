import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Creeaza link catre dashboard-ul Stripe Express pentru gestionarea platilor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const role = (session.user as any).role;

    if (!ngoId || role !== "NGO_ADMIN") {
      return NextResponse.json(
        { error: "Doar administratorul ONG-ului poate accesa dashboard-ul Stripe" },
        { status: 403 }
      );
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

    if (!ngo.stripeConnectId) {
      return NextResponse.json(
        { error: "Contul Stripe Connect nu a fost configurat. Va rugam sa finalizati procesul de onboarding." },
        { status: 400 }
      );
    }

    if (!ngo.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "Procesul de onboarding nu este finalizat. Va rugam sa completati configurarea contului Stripe." },
        { status: 400 }
      );
    }

    // Verificam daca Stripe este configurat la nivel de platforma
    const { getStripeKeys } = await import("@/lib/stripe-keys");
    const stripeKeys = await getStripeKeys();
    if (!stripeKeys.secretKey || !stripeKeys.enabled) {
      return NextResponse.json(
        { error: "Platile cu cardul nu sunt disponibile momentan. Contacteaza administratorul platformei." },
        { status: 400 }
      );
    }

    const { createDashboardLink } = await import("@/lib/stripe-connect");
    const url = await createDashboardLink(ngo.stripeConnectId);

    return NextResponse.json({
      url,
      message: "Link catre dashboard-ul Stripe generat cu succes",
    });
  } catch (error: any) {
    console.error("Connect dashboard error:", error.message);
    return NextResponse.json(
      { error: "Eroare la generarea link-ului dashboard: " + error.message },
      { status: 500 }
    );
  }
}
