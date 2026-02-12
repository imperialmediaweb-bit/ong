import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { generateSlug } from "@/lib/utils";
import { notifyWelcomeUser, notifyNewNgoRegistration } from "@/lib/platform-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, ngoName } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Generate a unique slug for the NGO
    let slug = generateSlug(ngoName);
    const existingNgo = await prisma.ngo.findUnique({ where: { slug } });
    if (existingNgo) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    // Create the NGO and the admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const ngo = await tx.ngo.create({
        data: {
          name: ngoName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: "NGO_ADMIN",
          ngoId: ngo.id,
        },
      });

      return { user, ngo };
    });

    await createAuditLog({
      ngoId: result.ngo.id,
      userId: result.user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: result.user.id,
      details: { email, ngoName },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    // Send welcome email to new user (non-blocking)
    notifyWelcomeUser({
      userName: name || email,
      userEmail: email,
    }).catch(() => {});

    // Alert super admins about new NGO registration (non-blocking)
    notifyNewNgoRegistration({
      ngoName,
      ngoId: result.ngo.id,
      adminEmail: email,
      registeredBy: name || email,
    }).catch(() => {});

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        ngo: {
          id: result.ngo.id,
          name: result.ngo.name,
          slug: result.ngo.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
