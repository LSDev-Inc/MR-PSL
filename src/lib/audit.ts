import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AuditEvent } from "@/models";

type AuditInput = {
  actorId: string;
  actorRole: string;
  action: string;
  resource: string;
  result?: "success" | "failure";
  metadata?: Record<string, string | number | boolean>;
};

export async function recordAudit(input: AuditInput) {
  await connectDb();
  await AuditEvent.create({
    institutionId: INSTITUTION_ID,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    resource: input.resource,
    result: input.result ?? "success",
    metadata: input.metadata ?? {},
    expiresAt: new Date(Date.now() + env.AUDIT_RETENTION_DAYS * 86400000),
  });
}
