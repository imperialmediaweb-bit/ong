import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const role = (session.user as any).role;
    if (!hasPermission(role, "donors:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "export_csv")) {
      return NextResponse.json({ error: "CSV export is not available on your plan" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const tags = searchParams.get("tags") || "";

    // Build where clause
    const where: any = {
      ngoId,
      isAnonymized: false,
    };

    if (status) {
      where.status = status;
    }

    if (tags) {
      const tagIds = tags.split(",").filter(Boolean);
      if (tagIds.length > 0) {
        where.tags = {
          some: { tagId: { in: tagIds } },
        };
      }
    }

    const donors = await prisma.donor.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Preferred Channel",
      "Status",
      "Email Consent",
      "SMS Consent",
      "Privacy Consent",
      "Total Donated",
      "Donation Count",
      "Last Donation",
      "Tags",
      "Notes",
      "Created At",
    ];

    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = donors.map((donor) => [
      escapeCSV(donor.id),
      escapeCSV(donor.name),
      escapeCSV(donor.email),
      escapeCSV(donor.phone),
      escapeCSV(donor.preferredChannel),
      escapeCSV(donor.status),
      donor.emailConsent ? "Yes" : "No",
      donor.smsConsent ? "Yes" : "No",
      donor.privacyConsent ? "Yes" : "No",
      donor.totalDonated.toString(),
      donor.donationCount.toString(),
      donor.lastDonationAt ? donor.lastDonationAt.toISOString() : "",
      escapeCSV(donor.tags.map((t) => t.tag.name).join("; ")),
      escapeCSV(donor.notes),
      donor.createdAt.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "DONORS_EXPORTED",
      details: { count: donors.length, filters: { status, tags } },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="donors-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Donors export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
