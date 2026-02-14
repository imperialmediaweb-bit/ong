import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendPlatformEmail } from "@/lib/email-sender";
import { createAuditLog } from "@/lib/audit";

// POST - Send platform notification to all NGOs or specific users
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, message, type, targetType, targetIds, sendEmail } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Titlul si mesajul sunt obligatorii" }, { status: 400 });
    }

    // Determine target NGOs
    let ngoIds: string[] = [];

    if (targetType === "specific" && targetIds?.length) {
      ngoIds = targetIds;
    } else if (targetType === "all") {
      const ngos = await prisma.ngo.findMany({
        select: { id: true },
      });
      ngoIds = ngos.map((n) => n.id);
    } else if (targetType === "verified") {
      const ngos = await prisma.ngo.findMany({
        where: {
          verification: {
            status: "APPROVED",
          },
        },
        select: { id: true },
      });
      ngoIds = ngos.map((n) => n.id);
    } else {
      return NextResponse.json({ error: "Target invalid. Folositi: all, verified, specific" }, { status: 400 });
    }

    // Create in-app notifications for each NGO
    const notifications = await prisma.notification.createMany({
      data: ngoIds.map((ngoId) => ({
        ngoId,
        type: type || "SYSTEM",
        title,
        message,
        metadata: { sentBy: (session.user as any).email, sentAt: new Date().toISOString() } as any,
      })),
    });

    // Optionally send email notifications
    let emailsSent = 0;
    let emailErrors = 0;

    if (sendEmail) {
      const users = await prisma.user.findMany({
        where: {
          ngoId: { in: ngoIds },
          role: { in: ["NGO_ADMIN", "STAFF"] },
        },
        select: { email: true, name: true },
      });

      for (const user of users) {
        try {
          await sendPlatformEmail({
            to: user.email,
            subject: `[Binevo] ${title}`,
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:24px 30px;border-radius:12px 12px 0 0;">
                  <h1 style="color:#fff;font-size:20px;margin:0;">Notificare Platforma</h1>
                </div>
                <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                  <h2 style="color:#1f2937;font-size:18px;margin:0 0 12px;">${title}</h2>
                  <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 20px;">${message}</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Aceasta notificare a fost trimisa de administratorul platformei Binevo.</p>
                </div>
              </div>
            `,
          });
          emailsSent++;
        } catch {
          emailErrors++;
        }
      }
    }

    await createAuditLog({
      userId: (session.user as any).id,
      action: "ADMIN_NOTIFICATION_SENT",
      entityType: "Notification",
      details: {
        title,
        targetType,
        ngoCount: ngoIds.length,
        notificationsCreated: notifications.count,
        emailsSent,
        emailErrors,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      success: true,
      notificationsCreated: notifications.count,
      emailsSent,
      emailErrors,
      message: `Notificare trimisa catre ${ngoIds.length} ONG-uri`,
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Eroare la trimiterea notificarii" }, { status: 500 });
  }
}
