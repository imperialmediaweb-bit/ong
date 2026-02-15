import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json(
        { error: "Nu exista un ONG asociat contului" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    const body = await request.json();
    const { contactId, subject, body: htmlBody, followupDate } = body as {
      contactId: string;
      subject: string;
      body: string;
      followupDate?: string;
    };

    if (!contactId || !subject || !htmlBody) {
      return NextResponse.json(
        { error: "contactId, subject si body sunt obligatorii" },
        { status: 400 }
      );
    }

    // Fetch the sponsor company
    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Compania sponsor nu a fost gasita" },
        { status: 404 }
      );
    }

    // Fetch the contact and validate it belongs to the company
    const contact = await prisma.sponsorContact.findFirst({
      where: { id: contactId, companyId: company.id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contactul nu a fost gasit in cadrul acestei companii" },
        { status: 404 }
      );
    }

    // Check DNC flag
    if (contact.dncFlag) {
      return NextResponse.json(
        { error: "Contactul este marcat ca Do Not Contact (DNC). Nu se poate trimite email." },
        { status: 403 }
      );
    }

    // Validate contact has an email
    if (!contact.email) {
      return NextResponse.json(
        { error: "Contactul nu are o adresa de email configurata" },
        { status: 400 }
      );
    }

    // Fetch NGO for sender credentials
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
    });

    if (!ngo) {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }

    // Send the email
    const emailResult = await sendEmail(
      {
        to: contact.email,
        subject,
        html: htmlBody,
        from: ngo.senderEmail || undefined,
        fromName: ngo.senderName || ngo.name,
      },
      undefined
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || "Trimiterea email-ului a esuat" },
        { status: 502 }
      );
    }

    // On success: create interaction, update company, update contact status

    // Create SponsorInteraction
    await prisma.sponsorInteraction.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        type: "EMAIL_SENT",
        subject,
        body: htmlBody,
        createdBy: userId,
      },
    });

    // Update company lastContactedAt and optionally nextFollowupAt
    const companyUpdateData: any = {
      lastContactedAt: new Date(),
    };
    if (followupDate) {
      companyUpdateData.nextFollowupAt = new Date(followupDate);
    }

    await prisma.sponsorCompany.update({
      where: { id: company.id },
      data: companyUpdateData,
    });

    // Update contact status to CONTACTED if currently NEW
    if (contact.status === "NEW") {
      await prisma.sponsorContact.update({
        where: { id: contact.id },
        data: { status: "CONTACTED" },
      });
    }

    // Create audit log
    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_EMAIL_SENT",
      entityType: "SponsorCompany",
      entityId: company.id,
      details: {
        companyName: company.name,
        contactName: contact.fullName,
        contactEmail: contact.email,
        subject,
        followupDate: followupDate || null,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Sponsor send email error:", error);
    return NextResponse.json(
      { error: "Eroare interna de server" },
      { status: 500 }
    );
  }
}
