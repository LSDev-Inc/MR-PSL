import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/http";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AdminSession, AdminUser } from "@/models";

export const runtime = "nodejs";
const changeSchema = z
  .object({
    disabled: z.boolean().optional(),
    role: z.enum(["ADMIN", "EDITOR", "ANALYST", "VIEWER"]).optional(),
    permissions: z.array(z.string().max(80)).max(18).optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const parsed = changeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Modifica non valida.");
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return jsonError("Utente non trovato.", 404);
  const changes = parsed.data;
  if ("disabled" in changes && !actorHasPermission(actor, "users.disable"))
    return jsonError("Permesso insufficiente.", 403);
  if (("role" in changes || "permissions" in changes) && actor.role !== "SUPER_ADMIN")
    return jsonError("Solo SUPER_ADMIN può modificare ruoli e permessi.", 403);
  if (actor.id === id && changes.disabled === true)
    return jsonError("Non puoi disattivare il tuo account mentre sei collegato.", 409);
  try {
    await connectDb();
    const target = await AdminUser.findOne({ _id: id, institutionId: INSTITUTION_ID });
    if (!target) return jsonError("Utente non trovato.", 404);
    if (target.role === "SUPER_ADMIN")
      return jsonError("Il SUPER_ADMIN non può essere modificato da questa schermata.", 403);
    const effectiveChanges = changes as Record<string, unknown>;
    const sensitive =
      "role" in effectiveChanges || "permissions" in effectiveChanges || effectiveChanges.disabled === true;
    if ("disabled" in effectiveChanges) target.disabledAt = effectiveChanges.disabled ? new Date() : undefined;
    if (typeof effectiveChanges.role === "string") target.role = effectiveChanges.role as typeof target.role;
    if (Array.isArray(effectiveChanges.permissions)) {
      const allowed = new Set([
        "dashboard.read",
        "analytics.read",
        "participants.read",
        "participants.export",
        "candidates.read",
        "candidates.write",
        "program.read",
        "program.write",
        "content.read",
        "content.write",
        "qr.generate",
        "users.read",
        "users.create",
        "users.update",
        "users.disable",
        "audit.read",
        "settings.read",
        "settings.write",
      ]);
      if (effectiveChanges.permissions.some(item => typeof item !== "string" || !allowed.has(item)))
        return jsonError("Sono stati indicati permessi non riconosciuti.");
      target.permissions = effectiveChanges.permissions as string[];
    }
    if (sensitive) target.authVersion += 1;
    await target.save();
    if (sensitive)
      await AdminSession.updateMany(
        { userId: target._id, institutionId: INSTITUTION_ID, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: changes.disabled === true ? "admin.account.disable" : "admin.account.update",
      resource: `admin-user-${id}`,
      metadata: { role: target.role, disabled: Boolean(target.disabledAt) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Non è stato possibile aggiornare l’account.", 503);
  }
}
