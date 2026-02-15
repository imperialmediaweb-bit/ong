import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SYSTEM_EMAIL_TEMPLATES, SYSTEM_SMS_TEMPLATES } from "@/lib/campaign-templates";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
  }

  const role = (session.user as any).role;
  const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
  if (!hasFeature(plan, "campaigns_email", role)) {
    return NextResponse.json({ error: "Campaniile nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
  }

  return NextResponse.json({
    emailTemplates: SYSTEM_EMAIL_TEMPLATES,
    smsTemplates: SYSTEM_SMS_TEMPLATES,
  });
}
