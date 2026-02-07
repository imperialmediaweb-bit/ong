import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { automationSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission } from "@/lib/permissions";

export async function GET(
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
    if (!hasPermission(role, "automations:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const automation = await prisma.automation.findFirst({
      where: { id: params.id, ngoId },
      include: {
        steps: {
          orderBy: { order: "asc" },
          include: {
            campaign: { select: { id: true, name: true } },
          },
        },
        executions: {
          orderBy: { startedAt: "desc" },
          take: 20,
        },
      },
    });

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    return NextResponse.json({ data: automation });
  } catch (error) {
    console.error("Automation GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
    });

    if (!existing) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = automationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for advanced features
    const hasAdvancedActions = data.steps.some((step) =>
      ["AI_SUGGESTION", "CONDITION"].includes(step.action)
    );
    if (hasAdvancedActions && !hasFeature(plan, "automations_advanced")) {
      return NextResponse.json(
        { error: "Advanced automation features are not available on your plan" },
        { status: 403 }
      );
    }

    const automation = await prisma.$transaction(async (tx) => {
      // Remove existing steps
      await tx.automationStep.deleteMany({
        where: { automationId: params.id },
      });

      // Update automation and create new steps
      return tx.automation.update({
        where: { id: params.id },
        data: {
          name: data.name,
          description: data.description || null,
          trigger: data.trigger,
          triggerConfig: data.triggerConfig || undefined,
          steps: {
            create: data.steps.map((step) => ({
              order: step.order,
              action: step.action,
              config: step.config,
              delayMinutes: step.delayMinutes,
            })),
          },
        },
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "AUTOMATION_UPDATED",
      entityType: "Automation",
      entityId: automation.id,
      details: { name: data.name, trigger: data.trigger },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: automation });
  } catch (error) {
    console.error("Automation PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await prisma.automation.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    await prisma.automation.delete({ where: { id: params.id } });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "AUTOMATION_DELETED",
      entityType: "Automation",
      entityId: params.id,
      details: { name: existing.name },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ message: "Automation deleted successfully" });
  } catch (error) {
    console.error("Automation DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
