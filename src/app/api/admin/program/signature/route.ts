import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { createProgramUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";
import { jsonError, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "program.write")) return jsonError("Permesso insufficiente.", 403);
  if (!isCloudinaryConfigured()) return jsonError("Cloudinary non configurato.", 501);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const size = body && typeof body === "object" ? (body as { size?: unknown }).size : undefined;
  if (typeof size !== "number" || !Number.isInteger(size) || size < 8 || size > MAX_FILE_SIZE)
    return jsonError("Il PDF deve pesare al massimo 10 MB.");

  const publicId = `campaign-programs/${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  try {
    return NextResponse.json(
      { ...createProgramUploadSignature(publicId, timestamp), publicId, timestamp },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return jsonError("Non è stato possibile preparare il caricamento Cloudinary.", 503);
  }
}
