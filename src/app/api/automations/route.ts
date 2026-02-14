import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { automationSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission, fetchEffectivePlan } from "@/lib/permissions";

export async function GET(request: NextRequest) {
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

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "automations_basic")) {
      return NextResponse.json({ error: "Automatizarile nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const trigger = searchParams.get("trigger") || "";
    const isActive = searchParams.get("isActive");

    const where: any = { ngoId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (trigger) {
      where.trigger = trigger;
    }

    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const [automations, total] = await Promise.all([
      prisma.automation.findMany({
        where,
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: { executions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.automation.count({ where }),
    ]);

    return NextResponse.json({
      data: automations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Automations GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "automations_basic")) {
      return NextResponse.json({ error: "Automatizarile nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    // Check automation limit
    const { isOverAutomationLimit } = await import("@/lib/permissions");
    const activeAutomationCount = await prisma.automation.count({ where: { ngoId, isActive: true } });
    if (isOverAutomationLimit(plan, activeAutomationCount)) {
      const { PLAN_LIMITS } = await import("@/lib/permissions");
      return NextResponse.json(
        {
          error: `Ai atins limita de ${PLAN_LIMITS[plan].maxAutomations} automatizari active pentru planul ${plan}. Fa upgrade pentru mai multe.`,
          code: "AUTOMATION_LIMIT_REACHED",
        },
        { status: 403 }
      );
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

    // Check for advanced automation features
    const hasAdvancedActions = data.steps.some((step) =>
      ["AI_SUGGESTION", "CONDITION"].includes(step.action)
    );
    if (hasAdvancedActions && !hasFeature(plan, "automations_advanced")) {
      return NextResponse.json(
        { error: "Advanced automation features are not available on your plan" },
        { status: 403 }
      );
    }

    const automation = await prisma.automation.create({
      data: {
        ngoId,
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

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "AUTOMATION_CREATED",
      entityType: "Automation",
      entityId: automation.id,
      details: { name: data.name, trigger: data.trigger, stepsCount: data.steps.length },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: automation }, { status: 201 });
  } catch (error) {
    console.error("Automations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
