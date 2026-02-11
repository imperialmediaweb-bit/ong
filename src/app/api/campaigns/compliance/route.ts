import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - check compliance status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) return NextResponse.json({ error: "Fara ONG" }, { status: 403 });

  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: {
        tosAcceptedAt: true,
        gdprAcceptedAt: true,
        antiSpamAcceptedAt: true,
        tosAcceptedBy: true,
        legalRepresentative: true,
        cui: true,
        isVerifiedSender: true,
        dailyEmailLimit: true,
        dailySmsLimit: true,
        emailsSentToday: true,
        smsSentToday: true,
        lastLimitReset: true,
      },
    });

    const isCompliant = !!(
      ngo?.tosAcceptedAt &&
      ngo?.gdprAcceptedAt &&
      ngo?.antiSpamAcceptedAt
    );

    return NextResponse.json({
      ...ngo,
      isCompliant,
      canSendCampaigns: isCompliant,
    });
  } catch (error) {
    console.error("Compliance check error:", error);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

// POST - accept TOS / GDPR / Anti-spam
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const ngoId = (session.user as any).ngoId;
  const userId = (session.user as any).id;
  if (!ngoId) return NextResponse.json({ error: "Fara ONG" }, { status: 403 });

  try {
    const { acceptTos, acceptGdpr, acceptAntiSpam, legalRepresentative, cui } = await request.json();

    const updates: any = {};
    const now = new Date();

    if (acceptTos) {
      updates.tosAcceptedAt = now;
      updates.tosAcceptedBy = userId;
    }
    if (acceptGdpr) {
      updates.gdprAcceptedAt = now;
    }
    if (acceptAntiSpam) {
      updates.antiSpamAcceptedAt = now;
    }
    if (legalRepresentative) {
      updates.legalRepresentative = legalRepresentative;
    }
    if (cui) {
      updates.cui = cui;
    }

    await prisma.ngo.update({
      where: { id: ngoId },
      data: updates,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        ngoId,
        userId,
        action: "COMPLIANCE_ACCEPTED",
        entityType: "NGO",
        entityId: ngoId,
        details: {
          acceptTos: !!acceptTos,
          acceptGdpr: !!acceptGdpr,
          acceptAntiSpam: !!acceptAntiSpam,
          timestamp: now.toISOString(),
        } as any,
      },
    });

    return NextResponse.json({ success: true, message: "Acceptare inregistrata cu succes." });
  } catch (error) {
    console.error("Compliance accept error:", error);
    return NextResponse.json({ error: "Eroare la salvare" }, { status: 500 });
  }
}
