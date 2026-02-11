import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      include: {
        miniSiteConfig: {
          select: { contactEmail: true },
        },
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "Organizatia nu a fost gasita" }, { status: 404 });
    }

    const contactEmail = ngo.miniSiteConfig?.contactEmail;
    if (!contactEmail) {
      return NextResponse.json(
        { error: "Organizatia nu are o adresa de email configurata" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { contractHtml, contractNumber, companyName, companyEmail, amount } = body;

    if (!contractHtml || !contractNumber) {
      return NextResponse.json(
        { error: "Date incomplete pentru trimiterea contractului" },
        { status: 400 }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .email-header { background: #1e40af; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
          .email-body { padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; }
          .email-footer { padding: 16px 24px; background: #f3f4f6; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
          .info-row { margin-bottom: 8px; }
          .info-label { font-weight: bold; color: #374151; }
          .contract-box { margin-top: 20px; padding: 24px; background: white; border: 1px solid #d1d5db; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="email-header">
          <h2 style="margin:0">Nou contract de sponsorizare generat</h2>
          <p style="margin:8px 0 0;opacity:0.9">Nr. ${contractNumber}</p>
        </div>
        <div class="email-body">
          <p>Un nou contract de sponsorizare a fost generat pe mini-site-ul ${ngo.name}.</p>

          <div class="info-row"><span class="info-label">Firma sponsor:</span> ${companyName || "N/A"}</div>
          <div class="info-row"><span class="info-label">Email firma:</span> ${companyEmail || "N/A"}</div>
          <div class="info-row"><span class="info-label">Suma:</span> ${amount ? `${parseFloat(amount).toLocaleString("ro-RO")} RON` : "N/A"}</div>
          <div class="info-row"><span class="info-label">Nr. contract:</span> ${contractNumber}</div>

          <p style="margin-top:16px"><strong>Pasii urmatori:</strong></p>
          <ol>
            <li>Verificati datele din contractul de mai jos</li>
            <li>Printati contractul in 2 exemplare</li>
            <li>Semnati si stampilati</li>
            <li>Trimiteti un exemplar semnat catre firma sponsor${companyEmail ? ` la adresa <a href="mailto:${companyEmail}">${companyEmail}</a>` : ""}</li>
          </ol>

          <div class="contract-box">
            ${contractHtml}
          </div>
        </div>
        <div class="email-footer">
          <p>Acest email a fost trimis automat de pe mini-site-ul ${ngo.name} prin platforma Binevo.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: contactEmail,
      subject: `Contract sponsorizare ${contractNumber} - ${companyName || "Sponsor"}`,
      html: emailHtml,
      fromName: "Binevo - Contracte",
    });

    if (!result.success) {
      console.error("Contract email send failed:", result.error);
      return NextResponse.json(
        { error: "Nu s-a putut trimite emailul. Incercati din nou." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Contractul a fost trimis la ${contactEmail}`,
    });
  } catch (error: any) {
    console.error("Contract send-email error:", error);
    return NextResponse.json(
      { error: error.message || "Eroare interna" },
      { status: 500 }
    );
  }
}
