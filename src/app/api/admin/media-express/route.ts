import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendPlatformEmail } from "@/lib/email-sender";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: any = {
      mediaExpressOrderId: { not: null },
    };

    if (status) {
      where.mediaExpressStatus = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { mediaExpressOrderId: { contains: search, mode: "insensitive" } },
        { ngo: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.pressRelease.findMany({
      where,
      include: {
        ngo: {
          select: {
            id: true,
            name: true,
            slug: true,
            senderEmail: true,
            billingEmail: true,
            users: {
              where: { role: "NGO_ADMIN" },
              select: { email: true, name: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.mediaExpressStatus === "pending").length,
      processing: orders.filter((o) => o.mediaExpressStatus === "processing").length,
      completed: orders.filter((o) => o.mediaExpressStatus === "completed").length,
      failed: orders.filter((o) => o.mediaExpressStatus === "failed").length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.mediaExpressPrice || 0), 0),
    };

    return NextResponse.json({ orders, stats });
  } catch (error: any) {
    console.error("Error fetching MediaExpress orders:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Update order status
    if (action === "update_status") {
      const { orderId, status } = body;

      await prisma.pressRelease.update({
        where: { id: orderId },
        data: { mediaExpressStatus: status },
      });

      return NextResponse.json({ success: true });
    }

    // Save links for an order
    if (action === "save_links") {
      const { orderId, links } = body;

      // links is an array of { url, publicationName }
      const report = {
        links: links || [],
        completedAt: new Date().toISOString(),
        totalLinks: (links || []).length,
      };

      await prisma.pressRelease.update({
        where: { id: orderId },
        data: {
          mediaExpressReport: report as any,
          mediaExpressStatus: "completed",
        },
      });

      return NextResponse.json({ success: true });
    }

    // Send report email to NGO user
    if (action === "send_report") {
      const { orderId } = body;

      const order = await prisma.pressRelease.findUnique({
        where: { id: orderId },
        include: {
          ngo: {
            select: {
              name: true,
              slug: true,
              senderEmail: true,
              billingEmail: true,
              users: {
                where: { role: "NGO_ADMIN" },
                select: { email: true, name: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Comanda nu a fost gasita" }, { status: 404 });
      }

      const report = order.mediaExpressReport as any;
      if (!report?.links?.length) {
        return NextResponse.json(
          { error: "Nu exista linkuri in raport. Adauga linkurile mai intai." },
          { status: 400 }
        );
      }

      // Determine recipient email
      const recipientEmail =
        order.ngo?.billingEmail ||
        order.ngo?.senderEmail ||
        order.ngo?.users?.[0]?.email;

      if (!recipientEmail) {
        return NextResponse.json(
          { error: "Nu exista email de contact pentru acest ONG." },
          { status: 400 }
        );
      }

      const recipientName = order.ngo?.users?.[0]?.name || order.ngo?.name || "";

      // Generate HTML email report
      const linksHtml = report.links
        .map(
          (link: any, i: number) => `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 12px; font-size: 14px; color: #666;">${i + 1}</td>
            <td style="padding: 10px 12px; font-size: 14px; font-weight: 500;">${link.publicationName || "Publicatie"}</td>
            <td style="padding: 10px 12px; font-size: 14px;">
              <a href="${link.url}" target="_blank" style="color: #7c3aed; text-decoration: underline; word-break: break-all;">${link.url}</a>
            </td>
          </tr>`
        )
        .join("");

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Raport MediaExpress</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">Articolul tau a fost publicat cu succes!</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <p style="font-size: 15px; color: #333; margin-bottom: 8px;">Buna${recipientName ? " " + recipientName : ""},</p>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 24px;">
        Raportul pentru comanda <strong>${order.mediaExpressOrderId}</strong> este gata.
        Articolul <strong>&quot;${order.title}&quot;</strong> a fost publicat in <strong>${report.links.length} publicatii</strong>.
      </p>

      <!-- Stats -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex:1; background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #16a34a;">${report.links.length}</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">Publicatii</div>
        </div>
        <div style="flex:1; background: #f5f3ff; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #7c3aed;">${order.mediaExpressPackage === "articol_50" ? "1.000" : "100"}</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">LEI</div>
        </div>
      </div>

      <!-- Links Table -->
      <h3 style="font-size: 16px; color: #333; margin-bottom: 12px;">Link-uri publicare:</h3>
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; width: 40px;">#</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Publicatie</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Link</th>
            </tr>
          </thead>
          <tbody>
            ${linksHtml}
          </tbody>
        </table>
      </div>

      <p style="font-size: 13px; color: #999; margin-top: 24px; text-align: center;">
        Acest raport a fost generat automat de platforma Binevo - MediaExpress.<br/>
        Data completare: ${new Date().toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
      <p>Binevo - Platforma pentru ONG-uri din Romania</p>
    </div>
  </div>
</body>
</html>`;

      // Send email
      const result = await sendPlatformEmail({
        to: recipientEmail,
        subject: `Raport MediaExpress - ${order.title}`,
        html: emailHtml,
        fromName: "Binevo MediaExpress",
      });

      if (!result.success) {
        return NextResponse.json(
          { error: `Eroare la trimiterea emailului: ${result.error}` },
          { status: 500 }
        );
      }

      // Update status
      await prisma.pressRelease.update({
        where: { id: orderId },
        data: {
          mediaExpressStatus: "completed",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Raportul a fost trimis cu succes la ${recipientEmail}`,
        sentTo: recipientEmail,
      });
    }

    return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in MediaExpress admin:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
