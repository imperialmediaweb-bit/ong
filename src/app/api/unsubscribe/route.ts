import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const unsubscribeSchema = z.object({
  donorId: z.string().min(1),
  channel: z.enum(["email", "sms", "all"]).default("all"),
});

// GET: Handles one-click unsubscribe from email links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get("did") || "";

    if (!donorId) {
      return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
    }

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      include: { ngo: { select: { id: true, name: true } } },
    });

    if (!donor) {
      return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 404 });
    }

    if (donor.isAnonymized) {
      return NextResponse.json({ error: "This record has been anonymized" }, { status: 400 });
    }

    // Unsubscribe from email by default (since this comes from email links)
    await prisma.donor.update({
      where: { id: donorId },
      data: {
        emailConsent: false,
        status: "UNSUBSCRIBED",
      },
    });

    // Record the consent change
    await prisma.consentRecord.create({
      data: {
        donorId,
        type: "EMAIL_MARKETING",
        granted: false,
        source: "unsubscribe_link",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    await createAuditLog({
      ngoId: donor.ngoId,
      action: "DONOR_UNSUBSCRIBED",
      entityType: "Donor",
      entityId: donorId,
      details: { channel: "email", source: "unsubscribe_link" },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    // Return a simple HTML page confirming unsubscription
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f9fafb;
            color: #374151;
          }
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 480px;
          }
          h1 { color: #111827; margin-bottom: 0.5rem; }
          p { color: #6b7280; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Unsubscribed</h1>
          <p>You have been successfully unsubscribed from email communications from <strong>${donor.ngo?.name || "this organization"}</strong>.</p>
          <p>If this was a mistake, please contact the organization directly.</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Unsubscribe GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Programmatic unsubscribe (for forms)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { donorId, channel } = parsed.data;

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    if (donor.isAnonymized) {
      return NextResponse.json({ error: "This record has been anonymized" }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const updateData: any = {};
    const consentRecords: any[] = [];

    if (channel === "email" || channel === "all") {
      updateData.emailConsent = false;
      consentRecords.push({
        donorId,
        type: "EMAIL_MARKETING",
        granted: false,
        source: "unsubscribe_form",
        ipAddress,
        userAgent,
      });
    }

    if (channel === "sms" || channel === "all") {
      updateData.smsConsent = false;
      consentRecords.push({
        donorId,
        type: "SMS_MARKETING",
        granted: false,
        source: "unsubscribe_form",
        ipAddress,
        userAgent,
      });
    }

    // If all consents are revoked, mark as unsubscribed
    if (channel === "all") {
      updateData.status = "UNSUBSCRIBED";
    } else if (channel === "email" && !donor.smsConsent) {
      updateData.status = "UNSUBSCRIBED";
    } else if (channel === "sms" && !donor.emailConsent) {
      updateData.status = "UNSUBSCRIBED";
    }

    await prisma.$transaction(async (tx) => {
      await tx.donor.update({
        where: { id: donorId },
        data: updateData,
      });

      if (consentRecords.length > 0) {
        await tx.consentRecord.createMany({
          data: consentRecords,
        });
      }
    });

    // Add to SMS opt-out list if unsubscribing from SMS
    if ((channel === "sms" || channel === "all") && donor.phone) {
      await prisma.smsOptOut.upsert({
        where: {
          phoneNumber_ngoId: {
            phoneNumber: donor.phone,
            ngoId: donor.ngoId,
          },
        },
        create: {
          phoneNumber: donor.phone,
          ngoId: donor.ngoId,
        },
        update: {},
      });
    }

    await createAuditLog({
      ngoId: donor.ngoId,
      action: "DONOR_UNSUBSCRIBED",
      entityType: "Donor",
      entityId: donorId,
      details: { channel, source: "unsubscribe_form" },
      ipAddress: ipAddress || undefined,
    });

    return NextResponse.json({ message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Unsubscribe POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
