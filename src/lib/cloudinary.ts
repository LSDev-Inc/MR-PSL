import { createHash } from "node:crypto";
import { env } from "@/lib/env";

const MAX_UPLOAD_DURATION_MS = 25_000;

function credentials() {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

function signatureFor(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export function isCloudinaryConfigured() {
  return credentials() !== null;
}

export function createProgramUploadSignature(publicId: string, timestamp: string) {
  const config = credentials();
  if (!config) throw new Error("Cloudinary non configurato.");
  const params = { overwrite: "false", public_id: publicId, timestamp };
  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    signature: signatureFor(params, config.apiSecret),
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
  };
}

export async function getCloudinaryImageAsset(publicId: string) {
  const config = credentials();
  if (!config) throw new Error("Cloudinary non configurato.");
  const encodedPublicId = publicId.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/image/upload/${encodedPublicId}`,
    {
      headers: {
        authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
        accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(MAX_UPLOAD_DURATION_MS),
    },
  );
  if (!response.ok) throw new Error(`Cloudinary resource lookup failed with status ${response.status}.`);
  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object") throw new Error("Risposta Cloudinary non valida.");
  const result = payload as {
    public_id?: unknown;
    secure_url?: unknown;
    format?: unknown;
    resource_type?: unknown;
    bytes?: unknown;
  };
  if (
    result.public_id !== publicId ||
    result.resource_type !== "image" ||
    typeof result.format !== "string" ||
    typeof result.secure_url !== "string" ||
    typeof result.bytes !== "number"
  )
    throw new Error("Cloudinary ha restituito un documento non valido.");
  return {
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format.toLowerCase(),
    size: result.bytes,
  };
}

export function isCloudinaryImageUrl(value: string) {
  const config = credentials();
  if (!config) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.port === "" &&
      url.pathname.startsWith(`/${config.cloudName}/image/upload/`)
    );
  } catch {
    return false;
  }
}

export async function uploadCloudinaryImage(
  bytes: Buffer,
  options: { publicId: string; filename: string; contentType: string },
) {
  const config = credentials();
  if (!config) throw new Error("Cloudinary non configurato.");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signatureFor({ public_id: options.publicId, timestamp }, config.apiSecret);
  const form = new FormData();
  const blobBytes = new Uint8Array(bytes.length);
  blobBytes.set(bytes);
  form.set("file", new Blob([blobBytes], { type: options.contentType }), options.filename);
  form.set("api_key", config.apiKey);
  form.set("public_id", options.publicId);
  form.set("timestamp", timestamp);
  form.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: "POST",
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(MAX_UPLOAD_DURATION_MS),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(`Cloudinary upload failed with status ${response.status}.`);
  }

  const result = payload as { secure_url?: unknown; public_id?: unknown; bytes?: unknown; resource_type?: unknown };
  if (
    typeof result.secure_url !== "string" ||
    typeof result.public_id !== "string" ||
    typeof result.bytes !== "number" ||
    result.resource_type !== "image" ||
    !isCloudinaryImageUrl(result.secure_url) ||
    result.public_id !== options.publicId
  ) {
    throw new Error("Cloudinary ha restituito una risposta di caricamento non valida.");
  }

  return { url: result.secure_url, publicId: result.public_id, size: result.bytes };
}
