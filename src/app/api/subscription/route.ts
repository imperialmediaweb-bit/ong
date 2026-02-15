import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

const PLAN_ORDER: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 };
const PLAN_PRICES: Record<string, number> = { BASIC: 0, PRO: 149, ELITE: 399 };

// POST - Handle plan change: upgrade redirects to checkout, downgrade changes directly
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

    // Get current plan
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { subscriptionPlan: true, name: true },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO negasit" }, { status: 404 });
    }

    const currentPlanOrder = PLAN_ORDER[ngo.subscriptionPlan] ?? 0;
    const newPlanOrder = PLAN_ORDER[plan] ?? 0;
    const isUpgrade = newPlanOrder > currentPlanOrder;

    // ── UPGRADE: redirect to checkout/payment page ──
    if (isUpgrade) {
      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://www.binevo.ro";

      // If Stripe is configured, create Stripe checkout session
      if (process.env.STRIPE_SECRET_KEY) {
        const { createCheckoutSession } = await import("@/lib/stripe");
        const checkoutUrl = await createCheckoutSession({
          ngoId,
          plan,
          successUrl: `${appUrl}/dashboard/settings?subscription=success`,
          cancelUrl: `${appUrl}/dashboard/settings?subscription=cancelled`,
          customerEmail: session.user?.email || undefined,
        });
        return NextResponse.json({ url: checkoutUrl });
      }

      // No Stripe: redirect to internal checkout page
      return NextResponse.json({ url: `/checkout?plan=${plan}` });
    }

    // ── DOWNGRADE: change plan directly ──
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
        type: "SUBSCRIPTION_DOWNGRADED",
        title: "Abonament actualizat",
        message: `Abonamentul a fost schimbat la planul ${plan}.`,
        actionUrl: "/dashboard/settings",
      },
    });

    // Send email notification for downgrade
    if (session.user?.email) {
      try {
        await sendEmail({
          to: session.user.email,
          subject: `Abonament actualizat - Plan ${plan}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Abonament actualizat</h1>
              </div>
              <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p>Salut,</p>
                <p>Abonamentul organizatiei <strong>${ngo.name}</strong> a fost schimbat la planul <strong>${plan}</strong>.</p>
                <p style="color: #6b7280; font-size: 14px;">Noul plan este activ imediat. Functionalitatile disponibile au fost actualizate conform planului ales.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">Echipa Binevo</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send downgrade email:", emailErr);
      }
    }

    return NextResponse.json({ success: true, message: `Plan schimbat la ${plan}` });
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
