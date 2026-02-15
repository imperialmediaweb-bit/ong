import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Incepe procesul de onboarding Stripe Connect pentru ONG
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
        { error: "Doar administratorul ONG-ului poate configura platile" },
        { status: 403 }
      );
    }

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: {
        id: true,
        name: true,
        slug: true,
        stripeConnectId: true,
        stripeConnectStatus: true,
        stripeConnectOnboarded: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://www.binevo.ro";
    const returnUrl = `${appUrl}/dashboard/settings?connect=success`;
    const refreshUrl = `${appUrl}/dashboard/settings?connect=refresh`;

    // Verificam daca Stripe este configurat la nivel de platforma
    const { getStripeKeys } = await import("@/lib/stripe-keys");
    const stripeKeys = await getStripeKeys();
    if (!stripeKeys.secretKey) {
      return NextResponse.json(
        { error: "Platile cu cardul nu sunt disponibile momentan. Contacteaza administratorul platformei." },
        { status: 400 }
      );
    }
    if (!stripeKeys.enabled) {
      return NextResponse.json(
        { error: "Platile cu cardul sunt dezactivate de catre administratorul platformei." },
        { status: 400 }
      );
    }

    let accountId = ngo.stripeConnectId;

    // Daca nu exista cont Connect, il cream
    if (!accountId) {
      const { createConnectAccount } = await import("@/lib/stripe-connect");

      const userEmail = session.user.email || "";
      accountId = await createConnectAccount(ngo.id, userEmail, ngo.name);

      // Salvam ID-ul contului in baza de date
      await prisma.ngo.update({
        where: { id: ngoId },
        data: {
          stripeConnectId: accountId,
          stripeConnectStatus: "pending",
          stripeConnectOnboarded: false,
        },
      });
    }

    // Cream link-ul de onboarding
    const { createOnboardingLink } = await import("@/lib/stripe-connect");
    const onboardingUrl = await createOnboardingLink(accountId, returnUrl, refreshUrl);

    return NextResponse.json({
      url: onboardingUrl,
      accountId,
      message: "Redirectionare catre Stripe pentru configurarea contului",
    });
  } catch (error: any) {
    console.error("Connect onboard error:", error.message);
    return NextResponse.json(
      { error: "Eroare la configurarea Stripe Connect: " + error.message },
      { status: 500 }
    );
  }
}
