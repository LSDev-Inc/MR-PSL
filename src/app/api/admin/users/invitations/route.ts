import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/http";
import { getSiteBaseUrl } from "@/lib/site-url";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AdminInvite, AdminUser } from "@/models";

export const runtime = "nodejs";
const inviteSchema = z
  .object({
    email: z.string().email().max(254),
    purpose: z.enum(["invite", "reset"]),
    role: z.enum(["ADMIN", "EDITOR", "ANALYST", "VIEWER"]).optional(),
  })
  .strict();

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "users.create")) return jsonError("Permesso insufficiente.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Email o tipo di invito non valido.");
  try {
    await connectDb();
    const email = parsed.data.email.toLowerCase();
    const existing = await AdminUser.findOne({ institutionId: INSTITUTION_ID, email }).select("role");
    if (parsed.data.purpose === "invite" && existing)
      return jsonError("Esiste già un account con questo indirizzo.", 409);
    if (parsed.data.purpose === "reset" && !existing)
      return jsonError("Non è stato trovato un account con questo indirizzo.", 404);
    const role = parsed.data.purpose === "reset" && existing ? existing.role : (parsed.data.role ?? "VIEWER");
    const token = randomBytes(32).toString("base64url");
    const requestUrl = new URL(request.url);
    const publicBase = getSiteBaseUrl()?.toString();
    const base =
      publicBase ??
      (process.env.NODE_ENV === "production"
        ? null
        : (request.headers.get("origin") ?? `${requestUrl.protocol}//${requestUrl.host}`));
    if (!base) return jsonError("APP_URL deve indicare il dominio HTTPS pubblico prima di creare inviti.", 503);
    await AdminInvite.deleteMany({ institutionId: INSTITUTION_ID, email });
    await AdminInvite.create({
      institutionId: INSTITUTION_ID,
      email,
      role,
      purpose: parsed.data.purpose,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      createdBy: actor.id,
    });
    const link = new URL("/admin/accetta-invito", base);
    link.hash = `token=${token}`;
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: parsed.data.purpose === "reset" ? "admin.password-reset.invite" : "admin.account.invite",
      resource: "admin-user",
      metadata: { role },
    });
    return NextResponse.json(
      { ok: true, link: link.toString(), expiresInMinutes: 30 },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return jsonError("Non è stato possibile creare l’invito.", 503);
  }
}
