import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { createAdminSession } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/http";
import { requestAddress, takeRateLimit } from "@/lib/rate-limit";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AdminUser } from "@/models";

export const runtime = "nodejs";
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) }).strict();

function serviceFailureReason(error: unknown) {
  if (!(error instanceof Error)) return "unexpected";
  if (error.message.startsWith("Database non configurato")) return "mongodb_config";
  if (error.message.startsWith("Autenticazione non configurata")) return "auth_secret_config";
  if (/MongoServerSelectionError|MongoNetworkError|MongoTimeoutError/.test(error.name)) return "mongodb_unreachable";
  const code = "code" in error ? error.code : undefined;
  if (code === 18 || /authentication failed/i.test(error.message)) return "mongodb_auth";
  if (code === 13) return "mongodb_permission";
  return "login_dependency";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Inserisci un indirizzo email e una password validi.");
  let stage = "database_connect";
  try {
    await connectDb();
    stage = "rate_limit";
    const address = requestAddress(request);
    const rate = await takeRateLimit("admin-login", `${address}:${parsed.data.email.toLowerCase()}`, 8, 15 * 60 * 1000);
    if (!rate.allowed)
      return NextResponse.json(
        { error: "Troppi tentativi. Riprova più tardi." },
        { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds), "cache-control": "no-store" } },
      );
    stage = "user_lookup";
    const user = await AdminUser.findOne({
      institutionId: INSTITUTION_ID,
      email: parsed.data.email.toLowerCase(),
    }).select("+passwordHash email role permissions authVersion disabledAt");
    const valid = user && !user.disabledAt && (await compare(parsed.data.password, user.passwordHash));
    if (!valid) {
      stage = "failed_login_audit";
      await recordAudit({
        actorId: "system",
        actorRole: "SYSTEM",
        action: "admin.login.failed",
        resource: "admin-session",
        result: "failure",
      });
      return jsonError("Credenziali non riconosciute.", 401);
    }
    stage = "user_update";
    user.lastLoginAt = new Date();
    await user.save();
    stage = "session_create";
    await createAdminSession(user, request);
    stage = "success_login_audit";
    await recordAudit({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "admin.login",
      resource: "admin-session",
    });
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const errorCode =
      error && typeof error === "object" && "code" in error && (typeof error.code === "number" || typeof error.code === "string")
        ? error.code
        : undefined;
    console.error("[admin-login] servizio non disponibile", {
      reason: serviceFailureReason(error),
      stage,
      errorName: error instanceof Error ? error.name : "unknown",
      errorCode,
    });
    if (
      process.env.NODE_ENV !== "production" &&
      error instanceof Error &&
      /^(Database non configurato|Autenticazione non configurata)/.test(error.message)
    ) {
      return jsonError(error.message, 503);
    }
    return jsonError("Accesso temporaneamente non disponibile. Verifica la configurazione del servizio.", 503);
  }
}
