import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { type AdminActor, actorHasPermission, getAdminActor } from "@/lib/auth";
import {
  getCloudinaryImageAsset,
  isCloudinaryConfigured,
  isCloudinaryImageUrl,
  uploadCloudinaryImage,
} from "@/lib/cloudinary";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { jsonError, sameOrigin } from "@/lib/http";
import { revalidatePublicCampaign } from "@/lib/public-content";
import { INSTITUTION_ID } from "@/lib/tenant";
import { Campaign } from "@/models";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function publishProgram(
  actor: AdminActor,
  program: { title: string; url: string; size: number; fileKey: string },
) {
  const publishedAt = new Date();
  await connectDb();
  await Campaign.updateOne(
    { institutionId: INSTITUTION_ID },
    {
      $set: {
        program: { title: program.title, url: program.url, size: program.size, publishedAt, fileKey: program.fileKey },
      },
      $setOnInsert: { institutionId: INSTITUTION_ID },
    },
    { upsert: true, runValidators: true },
  );
  revalidatePublicCampaign();
  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "campaign.program.replace",
    resource: "campaign-program",
    metadata: { size: program.size },
  });
  return NextResponse.json(
    {
      ok: true,
      program: { url: program.url, title: program.title, size: program.size, publishedAt: publishedAt.toISOString() },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "program.read")) return jsonError("Permesso insufficiente.", 403);
  try {
    await connectDb();
    const campaign = await Campaign.findOne({ institutionId: INSTITUTION_ID }).select("program").lean();
    const program = campaign?.program?.url
      ? {
          title: campaign.program.title ?? "Programma della candidatura",
          url: campaign.program.url,
          size: campaign.program.size ?? 0,
          publishedAt: campaign.program.publishedAt?.toISOString() ?? null,
        }
      : null;
    return NextResponse.json({ program }, { headers: { "cache-control": "no-store" } });
  } catch {
    return jsonError("Documento programma non disponibile.", 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "program.write")) return jsonError("Permesso insufficiente.", 403);

  try {
    await connectDb();
    const campaign = await Campaign.findOne({ institutionId: INSTITUTION_ID })
      .select("program.size program.url")
      .lean();
    if (!campaign?.program?.url) return NextResponse.json({ ok: true, removed: false });

    await Campaign.updateOne({ institutionId: INSTITUTION_ID }, { $unset: { program: 1 } });
    revalidatePublicCampaign();
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: "campaign.program.unpublish",
      resource: "campaign-program",
      metadata: { size: campaign.program.size ?? 0 },
    });
    return NextResponse.json(
      { ok: true, removed: true, storageRetained: true },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return jsonError("Non è stato possibile rimuovere il programma dal sito.", 503);
  }
}

async function publishCloudinaryProgram(request: Request, actor: AdminActor) {
  if (!isCloudinaryConfigured()) return jsonError("Cloudinary non configurato.", 503);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const title = body && typeof body === "object" ? (body as { title?: unknown }).title : undefined;
  const publicId = body && typeof body === "object" ? (body as { publicId?: unknown }).publicId : undefined;
  if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 120)
    return jsonError("Inserisci un titolo compreso tra 3 e 120 caratteri.");
  if (typeof publicId !== "string" || !/^campaign-programs\/[0-9a-f-]{36}$/i.test(publicId))
    return jsonError("Identificativo del PDF non valido.");

  let asset: Awaited<ReturnType<typeof getCloudinaryImageAsset>>;
  try {
    asset = await getCloudinaryImageAsset(publicId);
  } catch {
    return jsonError("Non riesco a verificare il PDF su Cloudinary. Controlla la configurazione e riprova.", 503);
  }
  if (asset.format !== "pdf" || asset.size < 8 || asset.size > MAX_FILE_SIZE || !isCloudinaryImageUrl(asset.url))
    return jsonError("Il file caricato non è un PDF valido entro il limite di 10 MB.");

  try {
    return await publishProgram(actor, {
      title: title.trim(),
      url: asset.url,
      size: asset.size,
      fileKey: asset.publicId,
    });
  } catch {
    return jsonError("PDF verificato, ma non è stato possibile pubblicarlo nel database.", 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "program.write")) return jsonError("Permesso insufficiente.", 403);

  if (request.headers.get("content-type")?.includes("application/json"))
    return publishCloudinaryProgram(request, actor);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Caricamento non valido.");
  }
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  if (
    !(file instanceof File) ||
    file.size < 8 ||
    file.size > MAX_FILE_SIZE ||
    file.type !== "application/pdf" ||
    title.length < 3 ||
    title.length > 120
  )
    return jsonError("Carica un PDF valido (massimo 10 MB) e inserisci un titolo.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-")
    return jsonError("Il contenuto del file non corrisponde a un PDF.");
  const fileId = randomUUID();
  const fileKey = `campaign-programs/${fileId}.pdf`;
  const cloudinaryPublicId = `campaign-programs/${fileId}`;
  try {
    let url: string;
    let storedFileKey: string;
    if (isCloudinaryConfigured()) {
      const uploaded = await uploadCloudinaryImage(bytes, {
        publicId: cloudinaryPublicId,
        filename: `${fileId}.pdf`,
        contentType: "application/pdf",
      });
      url = uploaded.url;
      storedFileKey = uploaded.publicId;
    } else if (
      env.STORAGE_ENDPOINT &&
      env.STORAGE_BUCKET &&
      env.STORAGE_ACCESS_KEY_ID &&
      env.STORAGE_SECRET_ACCESS_KEY &&
      env.STORAGE_PUBLIC_BASE_URL
    ) {
      const client = new S3Client({
        endpoint: env.STORAGE_ENDPOINT,
        region: env.STORAGE_REGION,
        forcePathStyle: true,
        credentials: { accessKeyId: env.STORAGE_ACCESS_KEY_ID, secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY },
      });
      await client.send(
        new PutObjectCommand({
          Bucket: env.STORAGE_BUCKET,
          Key: fileKey,
          Body: bytes,
          ContentType: "application/pdf",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: { title: encodeURIComponent(title) },
        }),
      );
      url = `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${fileKey}`;
      storedFileKey = fileKey;
    } else if (env.NODE_ENV !== "production") {
      const directory = path.join(process.cwd(), "public", "uploads", "campaign-programs");
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${path.basename(fileKey)}`), bytes, { flag: "wx" });
      url = `/uploads/${fileKey}`;
      storedFileKey = fileKey;
    } else
      return jsonError(
        "Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET prima di caricare documenti in produzione.",
        503,
      );

    try {
      return await publishProgram(actor, { title, url, size: file.size, fileKey: storedFileKey });
    } catch {
      return jsonError("PDF caricato, ma non è stato possibile pubblicarlo nel database.", 503);
    }
  } catch {
    return jsonError("Caricamento non riuscito su Cloudinary. Controlla le credenziali e riprova.", 503);
  }
}
