import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SYSTEM_EMAIL_TEMPLATES, SYSTEM_SMS_TEMPLATES } from "@/lib/campaign-templates";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  return NextResponse.json({
    emailTemplates: SYSTEM_EMAIL_TEMPLATES,
    smsTemplates: SYSTEM_SMS_TEMPLATES,
  });
}
