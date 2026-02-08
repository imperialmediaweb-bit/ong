import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - Create Stripe checkout session for subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  const role = (session.user as any).role;

  if (!ngoId || role !== "NGO_ADMIN") {
    return NextResponse.json({ error: "Doar adminul ONG poate gestiona abonamentul" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { plan } = body;

    if (!["BASIC", "PRO", "ELITE"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
    }

    // If Stripe is not configured, just update the plan directly (for demo)
    if (!process.env.STRIPE_SECRET_KEY) {
      await prisma.ngo.update({
        where: { id: ngoId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
        },
      });

      await prisma.notification.create({
        data: {
          ngoId,
          type: "SUBSCRIPTION_UPGRADED",
          title: "Abonament actualizat",
          message: `Abonamentul a fost schimbat la planul ${plan}.`,
          actionUrl: "/dashboard/settings",
        },
      });

      return NextResponse.json({ success: true, message: `Plan schimbat la ${plan}` });
    }

    // Stripe checkout
    const { createCheckoutSession } = await import("@/lib/stripe");
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutUrl = await createCheckoutSession({
      ngoId,
      plan,
      successUrl: `${appUrl}/dashboard/settings?subscription=success`,
      cancelUrl: `${appUrl}/dashboard/settings?subscription=cancelled`,
      customerEmail: session.user?.email || undefined,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Subscription error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get current subscription status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const ngo = await prisma.ngo.findUnique({
    where: { id: ngoId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      subscriptionExpiresAt: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!ngo) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 404 });
  }

  return NextResponse.json({
    plan: ngo.subscriptionPlan,
    status: ngo.subscriptionStatus,
    currentPeriodEnd: ngo.currentPeriodEnd,
    expiresAt: ngo.subscriptionExpiresAt,
    trialEndsAt: ngo.trialEndsAt,
    hasStripe: !!ngo.stripeCustomerId,
  });
}
