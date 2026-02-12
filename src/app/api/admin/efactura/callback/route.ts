/**
 * GET /api/admin/efactura/callback
 * OAuth2 callback from ANAF - exchanges authorization code for tokens
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { exchangeAnafCode } from "@/lib/efactura";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";
  const redirectTo = `${appUrl}/admin/payments`;

  if (error) {
    console.error("[ANAF OAuth] Error:", error);
    return NextResponse.redirect(`${redirectTo}?anaf_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${redirectTo}?anaf_error=no_code`);
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        anafClientId: true,
        anafClientSecret: true,
        anafSandbox: true,
        anafCallbackUrl: true,
      },
    });

    if (!settings?.anafClientId || !settings?.anafClientSecret) {
      return NextResponse.redirect(`${redirectTo}?anaf_error=not_configured`);
    }

    const callbackUrl = settings.anafCallbackUrl || `${appUrl}/api/admin/efactura/callback`;

    const result = await exchangeAnafCode(code, {
      clientId: settings.anafClientId,
      clientSecret: settings.anafClientSecret,
      callbackUrl,
      sandbox: settings.anafSandbox,
    });

    // Save tokens
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + result.expiresIn);

    await prisma.platformSettings.update({
      where: { id: "platform" },
      data: {
        anafAccessToken: result.accessToken,
        anafRefreshToken: result.refreshToken,
        anafTokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.redirect(`${redirectTo}?anaf_connected=true`);
  } catch (err: any) {
    console.error("[ANAF OAuth] Exchange error:", err.message);
    return NextResponse.redirect(`${redirectTo}?anaf_error=${encodeURIComponent(err.message)}`);
  }
}
