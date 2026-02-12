/**
 * GET/PATCH /api/admin/payment-processors
 * Super Admin - manage platform payment processor configuration
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        // Stripe
        stripeEnabled: true,
        stripeSecretKey: true,
        stripePublishableKey: true,
        stripeWebhookSecret: true,
        stripeConnectWebhookSecret: true,

        // Netopia
        netopiaEnabled: true,
        netopiaApiKey: true,
        netopiaMerchantId: true,
        netopiaPublicKey: true,
        netopiaPrivateKey: true,
        netopiaSandbox: true,
        netopiaNotifyUrl: true,

        // PayPal
        paypalPlatformEnabled: true,
        paypalPlatformClientId: true,
        paypalPlatformSecret: true,
        paypalPlatformSandbox: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        stripeEnabled: false,
        netopiaEnabled: false,
        paypalPlatformEnabled: false,
      });
    }

    // Mask sensitive keys for display
    const maskKey = (key: string | null) => {
      if (!key) return null;
      if (key.length <= 8) return "****";
      return key.substring(0, 6) + "****" + key.substring(key.length - 4);
    };

    return NextResponse.json({
      // Stripe
      stripeEnabled: settings.stripeEnabled,
      stripeSecretKey: maskKey(settings.stripeSecretKey),
      stripePublishableKey: settings.stripePublishableKey, // publishable keys are safe to show
      stripeWebhookSecret: maskKey(settings.stripeWebhookSecret),
      stripeConnectWebhookSecret: maskKey(settings.stripeConnectWebhookSecret),
      stripeHasKeys: !!settings.stripeSecretKey,

      // Netopia
      netopiaEnabled: settings.netopiaEnabled,
      netopiaApiKey: maskKey(settings.netopiaApiKey),
      netopiaMerchantId: settings.netopiaMerchantId,
      netopiaHasPublicKey: !!settings.netopiaPublicKey,
      netopiaHasPrivateKey: !!settings.netopiaPrivateKey,
      netopiaSandbox: settings.netopiaSandbox,
      netopiaNotifyUrl: settings.netopiaNotifyUrl,

      // PayPal
      paypalPlatformEnabled: settings.paypalPlatformEnabled,
      paypalPlatformClientId: maskKey(settings.paypalPlatformClientId),
      paypalPlatformSandbox: settings.paypalPlatformSandbox,
      paypalHasKeys: !!settings.paypalPlatformClientId,
    });
  } catch (error: any) {
    console.error("Payment processors GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const allowedFields = [
      "stripeEnabled",
      "stripeSecretKey",
      "stripePublishableKey",
      "stripeWebhookSecret",
      "stripeConnectWebhookSecret",
      "netopiaEnabled",
      "netopiaApiKey",
      "netopiaMerchantId",
      "netopiaPublicKey",
      "netopiaPrivateKey",
      "netopiaSandbox",
      "netopiaNotifyUrl",
      "paypalPlatformEnabled",
      "paypalPlatformClientId",
      "paypalPlatformSecret",
      "paypalPlatformSandbox",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Skip masked values (don't overwrite with mask)
        if (typeof body[field] === "string" && body[field].includes("****")) {
          continue;
        }
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Niciun camp de actualizat" }, { status: 400 });
    }

    await prisma.platformSettings.upsert({
      where: { id: "platform" },
      create: { id: "platform", ...data },
      update: data,
    });

    return NextResponse.json({
      message: "Setarile procesoarelor de plati au fost actualizate",
    });
  } catch (error: any) {
    console.error("Payment processors PATCH error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
