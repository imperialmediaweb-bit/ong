/**
 * POST /api/invoices/upload-proof
 * Public endpoint - upload bank transfer proof for invoice
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const paymentToken = formData.get("paymentToken") as string;
    const proofFile = formData.get("proof") as File;
    const note = formData.get("note") as string;

    if (!paymentToken) {
      return NextResponse.json({ error: "Token lipsa" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { paymentToken },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Factura este deja platita" }, { status: 400 });
    }

    let proofUrl: string | null = null;

    if (proofFile && proofFile.size > 0) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (proofFile.size > maxSize) {
        return NextResponse.json({ error: "Fisierul este prea mare (max 10MB)" }, { status: 400 });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(proofFile.type)) {
        return NextResponse.json(
          { error: "Tip de fisier invalid. Acceptam: JPG, PNG, WebP, PDF" },
          { status: 400 }
        );
      }

      // Save file
      const uploadDir = join(process.cwd(), "public", "uploads", "proofs");
      await mkdir(uploadDir, { recursive: true });

      const ext = proofFile.name.split(".").pop() || "jpg";
      const fileName = `proof-${invoice.id}-${Date.now()}.${ext}`;
      const filePath = join(uploadDir, fileName);

      const bytes = await proofFile.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      proofUrl = `/uploads/proofs/${fileName}`;
    }

    // Update invoice with proof
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentProofUrl: proofUrl,
        paymentProofNote: note || null,
        paymentMethod: "bank_transfer",
        // Don't mark as PAID yet - admin needs to verify
        internalNotes: `Dovada transfer bancar incarcata la ${new Date().toLocaleString("ro-RO")}. ${note ? `Nota: ${note}` : ""}`,
      },
    });

    // Notify admin
    if (invoice.ngoId) {
      await prisma.notification.create({
        data: {
          ngoId: invoice.ngoId,
          type: "DONATION_RECEIVED" as any,
          title: `Dovada plata incarcata - ${invoice.invoiceNumber}`,
          message: `A fost incarcata o dovada de plata pentru factura ${invoice.invoiceNumber}. Verificati si confirmati plata.`,
          actionUrl: `/admin/invoices/${invoice.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Dovada de plata a fost incarcata cu succes. Vom verifica si confirma plata in cel mai scurt timp.",
    });
  } catch (error: any) {
    console.error("Error uploading proof:", error);
    return NextResponse.json({ error: "Eroare la incarcarea dovezii" }, { status: 500 });
  }
}
