import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const role = (session.user as any).role;
    if (!ngoId || !hasPermission(role, "settings:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Niciun fisier selectat" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Fisierul este prea mare (max 5MB)" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tip de fisier invalid. Acceptam: JPG, PNG, WebP, SVG" },
        { status: 400 }
      );
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "png";
    const fileName = `logo-${ngoId}-${Date.now()}.${ext}`;
    const filePath = join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const logoUrl = `/uploads/logos/${fileName}`;

    await prisma.ngo.update({
      where: { id: ngoId },
      data: { logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (error: any) {
    console.error("Error uploading logo:", error);
    return NextResponse.json({ error: "Eroare la incarcarea logo-ului" }, { status: 500 });
  }
}
