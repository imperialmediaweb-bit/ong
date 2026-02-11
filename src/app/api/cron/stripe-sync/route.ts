import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Cron job: Sync Stripe Connect account statuses daily.
 * Call via: GET /api/cron/stripe-sync?secret=CRON_SECRET
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all NGOs with a Stripe Connect account
    const ngos = await prisma.ngo.findMany({
      where: {
        stripeConnectId: { not: null },
        isActive: true,
      },
      select: {
        id: true,
        stripeConnectId: true,
        stripeConnectStatus: true,
      },
    });

    if (ngos.length === 0) {
      return NextResponse.json({ message: "No Stripe Connect accounts to sync", synced: 0 });
    }

    const { syncAccountStatus } = await import("@/lib/stripe-connect");

    let synced = 0;
    let errors = 0;

    for (const ngo of ngos) {
      if (!ngo.stripeConnectId) continue;

      try {
        const syncData = await syncAccountStatus(ngo.stripeConnectId);

        await prisma.ngo.update({
          where: { id: ngo.id },
          data: {
            stripeConnectStatus: syncData.status,
            stripeConnectOnboarded: syncData.onboarded,
            stripeChargesEnabled: syncData.chargesEnabled,
            stripePayoutsEnabled: syncData.payoutsEnabled,
            stripeRequirementsJson: syncData.requirementsJson as any,
            stripeLastSyncAt: new Date(),
          },
        });

        synced++;
      } catch (err: any) {
        console.error(`Failed to sync Stripe account for NGO ${ngo.id}:`, err.message);
        errors++;
      }
    }

    return NextResponse.json({
      message: `Stripe Connect sync completed`,
      total: ngos.length,
      synced,
      errors,
    });
  } catch (error: any) {
    console.error("Stripe sync cron error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
