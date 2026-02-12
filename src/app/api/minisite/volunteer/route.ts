import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { notifyVolunteerRequest } from "@/lib/platform-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, ngoSlug } = body;

    if (!name || !email || !ngoSlug) {
      return NextResponse.json({ error: "Campuri obligatorii lipsa" }, { status: 400 });
    }

    // Find NGO by slug
    const ngo = await prisma.ngo.findUnique({
      where: { slug: ngoSlug },
      select: { id: true, name: true },
    });

    if (!ngo) {
      return NextResponse.json({ error: "Organizatia nu a fost gasita" }, { status: 404 });
    }

    // Log volunteer request as audit
    try {
      await prisma.auditLog.create({
        data: {
          ngoId: ngo.id,
          action: "VOLUNTEER_REQUEST",
          entityType: "volunteer",
          details: {
            name,
            email,
            phone: phone || null,
            message: message || null,
            source: "minisite",
          } as any,
        },
      });
    } catch {
      // Audit log is non-critical
    }

    // Send email notifications (non-blocking)
    notifyVolunteerRequest({
      volunteerName: name,
      volunteerEmail: email,
      volunteerPhone: phone,
      volunteerMessage: message,
      ngoName: ngo.name,
      ngoId: ngo.id,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Volunteer form error:", error);
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}
