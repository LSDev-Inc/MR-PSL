import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/http";
import { INSTITUTION_ID } from "@/lib/tenant";
import { Campaign } from "@/models";

export const runtime = "nodejs";
const patchSchema = z
  .object({
    heroTitle: z.string().trim().min(6).max(120).optional(),
    heroSubtitle: z.string().trim().min(6).max(240).optional(),
    ctaPrimary: z.string().trim().min(2).max(40).optional(),
    ctaSecondary: z.string().trim().min(2).max(50).optional(),
    footerText: z.string().trim().min(10).max(220).optional(),
    closureMessage: z.string().trim().max(400).optional(),
    goals: z
      .array(
        z.object({ title: z.string().trim().min(2).max(60), description: z.string().trim().min(5).max(240) }).strict(),
      )
      .max(6)
      .optional(),
    status: z.enum(["open", "closed", "scheduled"]).optional(),
    opensAt: z.string().datetime().nullable().optional(),
    closesAt: z.string().datetime().nullable().optional(),
    retentionDays: z.number().int().min(1).max(3650).optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, "Inserisci almeno un campo.");

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "content.read") && !actorHasPermission(actor, "settings.read"))
    return jsonError("Permesso insufficiente.", 403);
  try {
    await connectDb();
    const campaign = await Campaign.findOne({ institutionId: INSTITUTION_ID })
      .select(
        "status opensAt closesAt closureMessage heroTitle heroSubtitle ctaPrimary ctaSecondary footerText goals retentionDays",
      )
      .lean();
    const full = campaign ?? {
      status: "closed",
      heroTitle: "Il cambiamento inizia da noi.",
      heroSubtitle: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
      ctaPrimary: "Scopri il programma",
      ctaSecondary: "Esprimi il tuo sostegno",
      footerText: "Iniziativa indipendente degli studenti. Non è un servizio ufficiale dell’Istituto.",
      closureMessage: "Il sondaggio è chiuso.",
      goals: [],
      retentionDays: 180,
    };
    const result = actorHasPermission(actor, "settings.read")
      ? full
      : {
          heroTitle: full.heroTitle,
          heroSubtitle: full.heroSubtitle,
          ctaPrimary: full.ctaPrimary,
          ctaSecondary: full.ctaSecondary,
          footerText: full.footerText,
          closureMessage: full.closureMessage,
          goals: full.goals,
        };
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch {
    return jsonError("Impostazioni non disponibili.", 503);
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Controlla i valori inseriti.");
  const data = parsed.data;
  const hasContentFields = [
    "heroTitle",
    "heroSubtitle",
    "ctaPrimary",
    "ctaSecondary",
    "footerText",
    "closureMessage",
    "goals",
  ].some(key => key in data);
  const hasSecurityFields = ["status", "opensAt", "closesAt", "retentionDays"].some(key => key in data);
  if (hasContentFields && !actorHasPermission(actor, "content.write"))
    return jsonError("Permesso insufficiente per modificare i contenuti.", 403);
  if (hasSecurityFields && !actorHasPermission(actor, "settings.write"))
    return jsonError("Permesso insufficiente per modificare le impostazioni.", 403);
  if (data.status === "scheduled" && (!data.opensAt || new Date(data.opensAt) <= new Date()))
    return jsonError("La data di apertura programmata deve essere futura.");
  if (data.opensAt && data.closesAt && new Date(data.closesAt) <= new Date(data.opensAt))
    return jsonError("La chiusura deve avvenire dopo l’apertura.");
  try {
    await connectDb();
    const update = {
      ...data,
      opensAt: data.opensAt ? new Date(data.opensAt) : data.opensAt,
      closesAt: data.closesAt ? new Date(data.closesAt) : data.closesAt,
    };
    await Campaign.updateOne(
      { institutionId: INSTITUTION_ID },
      { $set: update, $setOnInsert: { institutionId: INSTITUTION_ID } },
      { upsert: true, runValidators: true },
    );
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: hasSecurityFields ? "campaign.settings.update" : "campaign.content.update",
      resource: "campaign",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Non è stato possibile salvare le impostazioni.", 503);
  }
}
