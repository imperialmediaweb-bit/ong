import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: "ok",
    database: "unknown",
    tables: {},
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not set",
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (error: any) {
    checks.database = `error: ${error.message}`;
    checks.status = "degraded";
  }

  // Test core tables
  const tables = [
    { name: "User", fn: () => prisma.user.count() },
    { name: "Ngo", fn: () => prisma.ngo.count() },
    { name: "Donor", fn: () => prisma.donor.count() },
    { name: "Campaign", fn: () => prisma.campaign.count() },
    { name: "Donation", fn: () => prisma.donation.count() },
    { name: "AuditLog", fn: () => prisma.auditLog.count() },
  ];

  for (const table of tables) {
    try {
      const count = await table.fn();
      checks.tables[table.name] = { status: "ok", count };
    } catch (error: any) {
      checks.tables[table.name] = { status: "error", error: error.message.slice(0, 100) };
      checks.status = "degraded";
    }
  }

  // Test new tables
  const newTables = [
    "SponsorCompany", "SponsorContact", "BlogPost",
    "FormularAnaf", "SponsorshipContract", "Connection", "DirectMessage",
  ];

  for (const name of newTables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${name}"`);
      checks.tables[name] = { status: "ok" };
    } catch (error: any) {
      checks.tables[name] = { status: "missing", error: error.message.slice(0, 100) };
      checks.status = "degraded";
    }
  }

  return NextResponse.json(checks, {
    status: checks.status === "ok" ? 200 : 503,
  });
}
