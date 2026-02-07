import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { encrypt } from "@/lib/encryption";
import { hasFeature, hasPermission } from "@/lib/permissions";

interface ImportRow {
  name?: string;
  email?: string;
  phone?: string;
  preferredChannel?: string;
  notes?: string;
  tags?: string;
}

function parseCSV(csvText: string): ImportRow[] {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: ImportRow = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"|"$/g, "") || "";
      if (header === "name") row.name = value;
      else if (header === "email") row.email = value;
      else if (header === "phone") row.phone = value;
      else if (header === "preferred channel" || header === "preferredchannel" || header === "channel") row.preferredChannel = value;
      else if (header === "notes") row.notes = value;
      else if (header === "tags") row.tags = value;
    });

    // Skip rows that have no meaningful data
    if (row.name || row.email || row.phone) {
      rows.push(row);
    }
  }

  return rows;
}

export async function POST(request: NextRequest) {
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
    if (!hasPermission(role, "donors:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "donors_manage")) {
      return NextResponse.json({ error: "Feature not available on your plan" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid data rows found in CSV" }, { status: 400 });
    }

    // Limit import size
    if (rows.length > 5000) {
      return NextResponse.json({ error: "Maximum 5000 rows per import" }, { status: 400 });
    }

    // Get existing tag names for this NGO
    const existingTags = await prisma.donorTag.findMany({
      where: { ngoId },
    });
    const tagMap = new Map(existingTags.map((t) => [t.name.toLowerCase(), t.id]));

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Validate email format if present
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push({ row: i + 2, message: `Invalid email: ${row.email}` });
          skipped++;
          continue;
        }

        const validChannels = ["EMAIL", "SMS", "BOTH"];
        const preferredChannel = row.preferredChannel && validChannels.includes(row.preferredChannel.toUpperCase())
          ? (row.preferredChannel.toUpperCase() as "EMAIL" | "SMS" | "BOTH")
          : "EMAIL";

        // Check for existing donor by email
        let existingDonor = null;
        if (row.email) {
          existingDonor = await prisma.donor.findFirst({
            where: { ngoId, email: row.email },
          });
        }

        // Encrypt PII
        const emailEncrypted = row.email ? encrypt(row.email) : null;
        const phoneEncrypted = row.phone ? encrypt(row.phone) : null;

        // Process tags
        const tagIds: string[] = [];
        if (row.tags) {
          const tagNames = row.tags.split(";").map((t) => t.trim()).filter(Boolean);
          for (const tagName of tagNames) {
            const existingId = tagMap.get(tagName.toLowerCase());
            if (existingId) {
              tagIds.push(existingId);
            } else {
              // Create the tag
              const newTag = await prisma.donorTag.create({
                data: { ngoId, name: tagName },
              });
              tagMap.set(tagName.toLowerCase(), newTag.id);
              tagIds.push(newTag.id);
            }
          }
        }

        if (existingDonor) {
          // Update existing donor
          await prisma.donor.update({
            where: { id: existingDonor.id },
            data: {
              name: row.name || existingDonor.name,
              phone: row.phone || existingDonor.phone,
              phoneEncrypted: phoneEncrypted || existingDonor.phoneEncrypted,
              preferredChannel,
              notes: row.notes || existingDonor.notes,
            },
          });

          // Add any new tags
          for (const tagId of tagIds) {
            await prisma.donorTagAssignment.upsert({
              where: {
                donorId_tagId: { donorId: existingDonor.id, tagId },
              },
              create: { donorId: existingDonor.id, tagId },
              update: {},
            });
          }

          updated++;
        } else {
          // Create new donor
          const donor = await prisma.donor.create({
            data: {
              ngoId,
              email: row.email || null,
              emailEncrypted,
              phone: row.phone || null,
              phoneEncrypted,
              name: row.name || null,
              preferredChannel,
              notes: row.notes || null,
            },
          });

          // Create tag assignments
          if (tagIds.length > 0) {
            await prisma.donorTagAssignment.createMany({
              data: tagIds.map((tagId) => ({
                donorId: donor.id,
                tagId,
              })),
            });
          }

          created++;
        }
      } catch (err: any) {
        errors.push({ row: i + 2, message: err.message });
        skipped++;
      }
    }

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "DONORS_IMPORTED",
      details: { totalRows: rows.length, created, updated, skipped, errorCount: errors.length },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({
      message: "Import completed",
      summary: {
        total: rows.length,
        created,
        updated,
        skipped,
      },
      errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
    });
  } catch (error) {
    console.error("Donors import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
