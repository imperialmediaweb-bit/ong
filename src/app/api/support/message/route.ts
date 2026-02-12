import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { notifySuperAdmin } from "@/lib/platform-notifications";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subiect si mesaj sunt obligatorii" }, { status: 400 });
    }

    const user = session.user as any;

    // Log as audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        ngoId: user.ngoId || null,
        action: "SUPPORT_MESSAGE",
        entityType: "support",
        details: {
          subject,
          message,
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
        } as any,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      },
    });

    // Send email notification to super admins
    notifySuperAdmin({
      subject: `Mesaj Suport: ${subject}`,
      title: "Mesaj Suport Nou",
      body: `
        <p>Un utilizator a trimis un mesaj de suport:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;width:100px;">De la:</td>
              <td style="font-weight:600;">${user.name || user.email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Email:</td>
              <td>${user.email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Rol:</td>
              <td>${user.role}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Subiect:</td>
              <td style="font-weight:600;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Mesaj:</p>
            <p style="margin:0;white-space:pre-wrap;">${message}</p>
          </div>
        </div>
      `,
      ctaText: "Vezi in Admin",
      ctaUrl: `${process.env.APP_URL || "http://localhost:3000"}/admin/notifications`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support message error:", error);
    return NextResponse.json({ error: "Eroare la trimiterea mesajului" }, { status: 500 });
  }
}
