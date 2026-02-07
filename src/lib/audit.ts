import prisma from "./db";

interface AuditParams {
  ngoId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        ngoId: params.ngoId || undefined,
        userId: params.userId || undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
