/**
 * POST /api/webhooks/netopia
 * Netopia IPN (Instant Payment Notification) callback
 * Called by Netopia when a payment status changes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isNetopiaPaymentSuccessful, getNetopiaStatusLabel, NETOPIA_STATUS } from "@/lib/netopia";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Netopia IPN] Received:", JSON.stringify(body, null, 2));

    // Extract payment info from IPN
    const payment = body.payment;
    const order = body.order;

    if (!order?.orderID) {
      console.error("[Netopia IPN] Missing orderID");
      return NextResponse.json({ errorCode: 0, errorMessage: "" });
    }

    const orderId = order.orderID;
    const paymentStatus = payment?.status ?? order?.status;
    const ntpID = payment?.ntpID || order?.ntpID || "";

    console.log(`[Netopia IPN] Order: ${orderId}, Status: ${paymentStatus}, NTP: ${ntpID}`);

    // Look up the invoice by ID (our orderRef = invoice.id)
    const invoice = await prisma.invoice.findUnique({
      where: { id: orderId },
      include: { ngo: true },
    });

    if (!invoice) {
      console.error(`[Netopia IPN] Invoice not found: ${orderId}`);
      return NextResponse.json({ errorCode: 0, errorMessage: "" });
    }

    // Update invoice with Netopia transaction ID
    const updateData: any = {
      metadata: {
        ...(typeof invoice.metadata === "object" && invoice.metadata !== null ? invoice.metadata : {}),
        netopiaStatus: paymentStatus,
        netopiaStatusLabel: getNetopiaStatusLabel(paymentStatus),
        netopiaNtpID: ntpID,
        netopiaUpdatedAt: new Date().toISOString(),
      } as any,
    };

    if (isNetopiaPaymentSuccessful(paymentStatus)) {
      // Payment successful
      updateData.status = "PAID";
      updateData.paidAt = new Date();
      updateData.paymentMethod = "netopia";

      console.log(`[Netopia IPN] Invoice ${orderId} marked as PAID`);

      // Update NGO subscription if this is a subscription invoice
      if (invoice.subscriptionPlan && invoice.ngoId) {
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await prisma.ngo.update({
          where: { id: invoice.ngoId },
          data: {
            subscriptionPlan: invoice.subscriptionPlan as any,
            subscriptionStatus: "active",
            subscriptionStartAt: now,
            subscriptionExpiresAt: expiresAt,
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            ngoId: invoice.ngoId,
            type: "SUBSCRIPTION_UPGRADED",
            title: "Plata confirmata - Netopia",
            message: `Plata de ${invoice.totalAmount} ${invoice.currency} pentru abonamentul ${invoice.subscriptionPlan} a fost confirmata.`,
            actionUrl: "/dashboard/billing",
          },
        });
      }
    } else if (paymentStatus === NETOPIA_STATUS.DECLINED || paymentStatus === NETOPIA_STATUS.REJECTED) {
      console.log(`[Netopia IPN] Invoice ${orderId} payment declined/rejected`);
      updateData.metadata = {
        ...(updateData.metadata || {}),
        netopiaDeclinedAt: new Date().toISOString(),
      } as any;
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: updateData,
    });

    // Respond with success to Netopia
    return NextResponse.json({ errorCode: 0, errorMessage: "" });
  } catch (error: any) {
    console.error("[Netopia IPN] Error:", error.message);
    // Still return 200 to Netopia to prevent retries on our errors
    return NextResponse.json({ errorCode: 1, errorMessage: error.message });
  }
}
