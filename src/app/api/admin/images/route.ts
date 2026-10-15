import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { isCloudinaryConfigured, uploadCloudinaryImage } from "@/lib/cloudinary";
import { env } from "@/lib/env";
import { jsonError, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function detectImage(buffer: Buffer): { extension: string; mime: string } | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return { extension: "png", mime: "image/png" };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: "jpg", mime: "image/jpeg" };
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP")
    return { extension: "webp", mime: "image/webp" };
  return null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "candidates.write")) return jsonError("Permesso insufficiente.", 403);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Caricamento non valido.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 12 || file.size > MAX_FILE_SIZE)
    return jsonError("L’immagine deve pesare al massimo 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = detectImage(bytes);
  if (!type) return jsonError("Sono accettati solo file PNG, JPEG o WebP validi. I file SVG non sono ammessi.");
  const fileId = randomUUID();
  const key = `campaign-images/${fileId}.${type.extension}`;
  try {
    let url: string;
    if (isCloudinaryConfigured()) {
      const uploaded = await uploadCloudinaryImage(bytes, {
        publicId: `campaign-images/${fileId}`,
        filename: `${fileId}.${type.extension}`,
        contentType: type.mime,
      });
      url = uploaded.url;
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
          Key: key,
          Body: bytes,
          ContentType: type.mime,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      url = `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    } else if (env.NODE_ENV !== "production") {
      const directory = path.join(process.cwd(), "public", "uploads", "campaign-images");
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${path.basename(key)}`), bytes, { flag: "wx" });
      url = `/uploads/${key}`;
    } else
      return jsonError(
        "Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET prima di caricare immagini in produzione.",
        503,
      );
    await recordAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: "candidate.image.upload",
      resource: "candidate-image",
      metadata: { size: file.size, mime: type.mime },
    });
    return NextResponse.json({ ok: true, url }, { headers: { "cache-control": "no-store" } });
  } catch {
    return jsonError("Caricamento non riuscito su Cloudinary. Controlla le credenziali e riprova.", 503);
  }
}
