import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!hasPermission(role, "automations:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "automations_basic")) {
      return NextResponse.json({ error: "Automations are not available on your plan" }, { status: 403 });
    }

    const existing = await prisma.automation.findFirst({
      where: { id: params.id, ngoId },
      include: {
        steps: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    // Validate that automation has at least one step before activating
    if (!existing.isActive && existing.steps.length === 0) {
      return NextResponse.json(
        { error: "Cannot activate an automation with no steps" },
        { status: 400 }
      );
    }

    const automation = await prisma.automation.update({
      where: { id: params.id },
      data: { isActive: !existing.isActive },
      include: {
        steps: { orderBy: { order: "asc" } },
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: automation.isActive ? "AUTOMATION_ACTIVATED" : "AUTOMATION_DEACTIVATED",
      entityType: "Automation",
      entityId: automation.id,
      details: { name: automation.name, isActive: automation.isActive },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: automation });
  } catch (error) {
    console.error("Automation toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
