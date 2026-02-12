/**
 * GET/PATCH /api/admin/efactura
 * Super Admin - manage e-Factura (ANAF SPV) configuration
 *
 * POST /api/admin/efactura
 * Generate and/or upload e-Factura for a specific invoice
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        eFacturaEnabled: true,
        eFacturaAutoSend: true,
        anafClientId: true,
        anafClientSecret: true,
        anafAccessToken: true,
        anafRefreshToken: true,
        anafTokenExpiresAt: true,
        anafSandbox: true,
        anafCui: true,
        anafCallbackUrl: true,
      },
    });

    const maskKey = (key: string | null) => {
      if (!key) return null;
      if (key.length <= 8) return "****";
      return key.substring(0, 4) + "****" + key.substring(key.length - 4);
    };

    return NextResponse.json({
      eFacturaEnabled: settings?.eFacturaEnabled || false,
      eFacturaAutoSend: settings?.eFacturaAutoSend || false,
      anafClientId: maskKey(settings?.anafClientId || null),
      anafHasSecret: !!settings?.anafClientSecret,
      anafHasToken: !!settings?.anafAccessToken,
      anafTokenExpiresAt: settings?.anafTokenExpiresAt?.toISOString() || null,
      anafSandbox: settings?.anafSandbox ?? true,
      anafCui: settings?.anafCui || "",
      anafCallbackUrl: settings?.anafCallbackUrl || "",
      anafIsConnected: !!settings?.anafAccessToken && (
        !settings.anafTokenExpiresAt || new Date() < settings.anafTokenExpiresAt
      ),
    });
  } catch (error: any) {
    console.error("e-Factura GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const allowedFields = [
      "eFacturaEnabled",
      "eFacturaAutoSend",
      "anafClientId",
      "anafClientSecret",
      "anafSandbox",
      "anafCui",
      "anafCallbackUrl",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] === "string" && body[field].includes("****")) continue;
        data[field] = body[field];
      }
    }

    await prisma.platformSettings.upsert({
      where: { id: "platform" },
      create: { id: "platform", ...data },
      update: data,
    });

    return NextResponse.json({
      message: "Setarile e-Factura au fost salvate",
    });
  } catch (error: any) {
    console.error("e-Factura PATCH error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Generate/Upload e-Factura for a specific invoice
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { invoiceId, action } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "ID factura lipsa" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    const { generateUblXml, getEFacturaConfig, ensureValidToken, uploadToAnaf, checkEFacturaStatus } =
      await import("@/lib/efactura");

    if (action === "generate") {
      // Generate UBL XML
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      const xml = generateUblXml({
        invoiceNumber: invoice.invoiceNumber,
        invoiceSeries: invoice.invoiceSeries || undefined,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        currency: invoice.currency,
        sellerName: invoice.sellerName,
        sellerCui: invoice.sellerCui || undefined,
        sellerRegCom: invoice.sellerRegCom || undefined,
        sellerAddress: invoice.sellerAddress || undefined,
        sellerCity: invoice.sellerCity || undefined,
        sellerCounty: invoice.sellerCounty || undefined,
        sellerEmail: invoice.sellerEmail || undefined,
        sellerPhone: invoice.sellerPhone || undefined,
        sellerIban: invoice.sellerIban || undefined,
        sellerBankName: invoice.sellerBankName || undefined,
        sellerVatPayer: invoice.sellerVatPayer,
        buyerName: invoice.buyerName,
        buyerCui: invoice.buyerCui || undefined,
        buyerRegCom: invoice.buyerRegCom || undefined,
        buyerAddress: invoice.buyerAddress || undefined,
        buyerCity: invoice.buyerCity || undefined,
        buyerCounty: invoice.buyerCounty || undefined,
        buyerEmail: invoice.buyerEmail || undefined,
        buyerPhone: invoice.buyerPhone || undefined,
        items: (items as any[]).map((item: any) => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unit: item.unit || "BUC",
          unitPrice: item.unitPrice || 0,
          vatRate: item.vatRate || 0,
          totalNet: item.totalNet || 0,
          totalVat: item.totalVat || 0,
          totalGross: item.totalGross || item.totalNet || 0,
        })),
        subtotal: invoice.subtotal,
        vatAmount: invoice.vatAmount,
        totalAmount: invoice.totalAmount,
        notes: invoice.notes || undefined,
      });

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          eFacturaXml: xml,
          eFacturaStatus: "generated",
        },
      });

      return NextResponse.json({
        message: "XML e-Factura generat cu succes",
        xml,
      });
    }

    if (action === "upload") {
      const config = await getEFacturaConfig();
      if (!config) {
        return NextResponse.json({ error: "e-Factura nu este configurat" }, { status: 400 });
      }

      const validConfig = await ensureValidToken(config);

      const xml = invoice.eFacturaXml;
      if (!xml) {
        return NextResponse.json({ error: "XML-ul nu a fost generat. Generati mai intai." }, { status: 400 });
      }

      const result = await uploadToAnaf(xml, validConfig);

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          eFacturaStatus: result.success ? "uploaded" : "error",
          eFacturaUploadId: result.indexIncarcare || undefined,
          eFacturaErrors: result.errors ? (result.errors as any) : undefined,
          eFacturaSentAt: result.success ? new Date() : undefined,
        },
      });

      if (result.success) {
        return NextResponse.json({
          message: "e-Factura incarcata cu succes in ANAF",
          indexIncarcare: result.indexIncarcare,
        });
      } else {
        return NextResponse.json({
          error: "Eroare la incarcarea in ANAF",
          errors: result.errors,
        }, { status: 400 });
      }
    }

    if (action === "check") {
      const config = await getEFacturaConfig();
      if (!config) {
        return NextResponse.json({ error: "e-Factura nu este configurat" }, { status: 400 });
      }

      const validConfig = await ensureValidToken(config);

      if (!invoice.eFacturaUploadId) {
        return NextResponse.json({ error: "Factura nu a fost incarcata in ANAF" }, { status: 400 });
      }

      const result = await checkEFacturaStatus(invoice.eFacturaUploadId, validConfig);

      let newStatus = invoice.eFacturaStatus;
      if (result.status === "ok") {
        newStatus = "validated";
      } else if (result.status === "nok") {
        newStatus = "rejected";
      }

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          eFacturaStatus: newStatus,
          eFacturaId: result.downloadId || undefined,
          eFacturaErrors: result.errors ? (result.errors as any) : undefined,
          eFacturaValidAt: result.status === "ok" ? new Date() : undefined,
        },
      });

      return NextResponse.json({
        status: result.status,
        eFacturaStatus: newStatus,
        errors: result.errors,
      });
    }

    return NextResponse.json({ error: "Actiune invalida" }, { status: 400 });
  } catch (error: any) {
    console.error("e-Factura POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
