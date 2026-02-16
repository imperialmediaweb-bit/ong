import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendPlatformEmail } from "@/lib/email-sender";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email invalid" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: "Daca exista un cont cu acest email, vei primi un link de resetare.",
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return successResponse;
    }

    // Rate limit: max 1 token per 2 minutes per user
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });

    if (recentToken) {
      return successResponse;
    }

    // Invalidate old tokens
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    await sendPlatformEmail({
      to: email,
      subject: "Resetare parola - Binevo",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 20px;">Resetare Parola</h1>
          </div>
          <div style="padding: 24px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151;">Salut${user.name ? ` ${user.name}` : ""},</p>
            <p style="color: #374151;">Am primit o cerere de resetare a parolei pentru contul tau. Apasa butonul de mai jos pentru a seta o parola noua:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Reseteaza Parola
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Link-ul este valid timp de 1 ora.</p>
            <p style="color: #6b7280; font-size: 14px;">Daca nu ai cerut resetarea parolei, ignora acest email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Daca butonul nu functioneaza, copiaza acest link in browser:<br/><a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a></p>
          </div>
        </div>
      `,
    });

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Eroare interna" },
      { status: 500 }
    );
  }
}
