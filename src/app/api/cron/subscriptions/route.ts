/**
 * Cron Job: Check subscription expirations
 * Should be called daily (e.g., via Railway cron or external service)
 *
 * GET /api/cron/subscriptions?key=CRON_SECRET
 *
 * Actions:
 * 1. Send warning emails for subscriptions expiring in 7 days
 * 2. Auto-downgrade expired subscriptions to BASIC
 * 3. Send expiration notification emails
 */

import { NextRequest, NextResponse } from "next/server";
import { checkExpiringSubscriptions } from "@/lib/subscription-manager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify cron secret (optional, for security)
  const cronSecret = process.env.CRON_SECRET;
  const key = req.nextUrl.searchParams.get("key");

  if (cronSecret && key !== cronSecret) {
    return NextResponse.json({ error: "Cheie invalida" }, { status: 401 });
  }

  try {
    const results = await checkExpiringSubscriptions();

    console.log("[CRON] Subscription check results:", results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        subscriptionsExpiring: results.expiring,
        subscriptionsExpired: results.expired,
        subscriptionsRenewed: results.renewed,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error("[CRON] Subscription check error:", error);
    return NextResponse.json(
      { error: "Eroare la verificarea abonamentelor", details: error.message },
      { status: 500 }
    );
  }
}
