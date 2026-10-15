import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { isCloudinaryImageUrl } from "@/lib/cloudinary";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { jsonError, sameOrigin } from "@/lib/http";
import { revalidatePublicCampaign } from "@/lib/public-content";
import { INSTITUTION_ID } from "@/lib/tenant";
import { Candidate } from "@/models";

export const runtime = "nodejs";
const candidateSchema = z
  .object({
    position: z.number().int().min(1).max(2),
    name: z.string().trim().min(2).max(100),
    className: z.string().trim().max(40).optional().default(""),
    biography: z.string().trim().max(1200).optional().default(""),
    statement: z.string().trim().max(500).optional().default(""),
    photoUrl: z.string().trim().max(500).optional().default(""),
    objectives: z.array(z.string().trim().min(1).max(180)).max(8).optional().default([]),
    published: z.boolean().default(false),
  })
  .strict();

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "candidates.read")) return jsonError("Permesso insufficiente.", 403);
  try {
    await connectDb();
    const candidates = await Candidate.find({ institutionId: INSTITUTION_ID }).sort({ position: 1 }).lean();
    return NextResponse.json(
      candidates.map(({ _id, institutionId: _institutionId, ...item }) => ({ id: _id.toString(), ...item })),
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return jsonError("Profili non disponibili.", 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "candidates.write")) return jsonError("Permesso insufficiente.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const parsed = candidateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Controlla i dati inseriti nel profilo.");
  const localImage = parsed.data.photoUrl.startsWith("/uploads/campaign-images/");
  const storageBase = env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const storedImage = Boolean(storageBase && parsed.data.photoUrl.startsWith(`${storageBase}/campaign-images/`));
  const cloudinaryImage = isCloudinaryImageUrl(parsed.data.photoUrl);
  if (parsed.data.photoUrl && !localImage && !storedImage && !cloudinaryImage)
    return jsonError("Usa un’immagine caricata nella libreria della campagna.");
  try {
    await connectDb();
    await Candidate.updateOne(
      { institutionId: INSTITUTION_ID, position: parsed.data.position },
      { $set: { ...parsed.data, institutionId: INSTITUTION_ID, demoOnly: false } },
      { upsert: true, runValidators: true },
    );
    revalidatePublicCampaign();
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: "candidate.profile.update",
      resource: `candidate-position-${parsed.data.position}`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Non è stato possibile salvare il profilo.", 503);
  }
}
