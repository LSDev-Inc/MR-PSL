import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().url().optional(),
  MONGODB_DATABASE: z.string().trim().min(1).default("ramadu"),
  APP_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
  CLOUDINARY_API_KEY: z.string().trim().optional(),
  CLOUDINARY_API_SECRET: z.string().trim().optional(),
  NEXT_PUBLIC_PROGRAM_PDF_URL: z.string().url().optional(),
  SURVEY_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(180),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(365),
});

export const env = envSchema.parse(process.env);

function containsPlaceholder(value: string) {
  return /(?:^|[._-])(?:example|replace_with|your|change_me|changeme|username|password|clustername|hostname)(?:$|[._-])/i.test(
    value,
  );
}

export function requireDatabase() {
  if (!env.MONGODB_URI) throw new Error("Database non configurato: imposta MONGODB_URI nel file .env o .env.local.");
  let parsed: URL;
  try {
    parsed = new URL(env.MONGODB_URI);
  } catch {
    throw new Error("Database non configurato: MONGODB_URI non è valido.");
  }
  const databaseName = parsed.pathname.replace(/^\//, "").split("/")[0] ?? "";
  if ([parsed.hostname, parsed.username, parsed.password, databaseName].some(containsPlaceholder))
    throw new Error(
      "Database non configurato: MONGODB_URI contiene ancora un segnaposto. Usa host, utente e password reali di MongoDB Atlas.",
    );
  return env.MONGODB_URI;
}

export function requireAuthSecret() {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || /^(REPLACE_WITH|YOUR_)/i.test(env.AUTH_SECRET))
    throw new Error(
      "Autenticazione non configurata: imposta AUTH_SECRET (almeno 32 caratteri) nel file .env o .env.local.",
    );
  return env.AUTH_SECRET;
}
