import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [userCount, ngoCount] = await Promise.all([
      prisma.user.count(),
      prisma.ngo.count(),
    ]);

    const users = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true, ngoId: true },
    });

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        users: userCount,
        ngos: ngoCount,
        userList: users.map((u) => ({
          email: u.email,
          role: u.role,
          active: u.isActive,
          hasNgo: !!u.ngoId,
        })),
      },
      seed: userCount > 0 ? "OK - seed ran" : "MISSING - seed NOT run, database is empty",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
}
