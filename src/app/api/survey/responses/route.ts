import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { env, requireAuthSecret } from "@/lib/env";
import { jsonError, sameOrigin } from "@/lib/http";
import { requestAddress, takeRateLimit } from "@/lib/rate-limit";
import { INSTITUTION_ID } from "@/lib/tenant";
import { surveyResponseSchema } from "@/lib/validation/survey";
import { Campaign, SurveyResponse } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  const cookieStore = await cookies();
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonError("La richiesta non è valida.");
  }
  const parsed = surveyResponseSchema.safeParse(data);
  if (!parsed.success) return jsonError("Seleziona una risposta e conferma di aver letto l’informativa.");
  try {
    await connectDb();
    const idempotencyHash = createHmac("sha256", requireAuthSecret()).update(parsed.data.idempotencyKey).digest("hex");
    const existing = await SurveyResponse.findOne({ institutionId: INSTITUTION_ID, idempotencyHash })
      .select("_id")
      .lean();
    if (existing) {
      cookieStore.set("ramadu_survey_done", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: Math.min(env.SURVEY_RETENTION_DAYS * 86400, 31536000),
      });
      return NextResponse.json({ ok: true }, { status: 200, headers: { "cache-control": "no-store" } });
    }
    if (cookieStore.get("ramadu_survey_done")?.value === "1")
      return jsonError("Hai già inviato una risposta da questo browser.", 409);
    const campaign = await Campaign.findOne({ institutionId: INSTITUTION_ID })
      .select("status opensAt closesAt retentionDays")
      .lean();
    const now = new Date();
    const open =
      campaign?.status === "open" ||
      (campaign?.status === "scheduled" &&
        Boolean(campaign.opensAt && campaign.opensAt <= now && (!campaign.closesAt || campaign.closesAt > now)));
    if (!open || (campaign?.closesAt && campaign.closesAt <= now))
      return jsonError("Il sondaggio non è al momento aperto. Puoi comunque consultare il progetto.", 409);
    const limit = await takeRateLimit("survey", requestAddress(request), 5, 15 * 60 * 1000);
    if (!limit.allowed)
      return NextResponse.json(
        { error: "Hai effettuato troppe richieste. Riprova più tardi." },
        { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds), "cache-control": "no-store" } },
      );
    const expiresAt = new Date(now.getTime() + (campaign?.retentionDays ?? env.SURVEY_RETENTION_DAYS) * 86400000);
    try {
      await SurveyResponse.create({
        institutionId: INSTITUTION_ID,
        choice: parsed.data.choice,
        idempotencyHash,
        expiresAt,
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 11000) {
        cookieStore.set("ramadu_survey_done", "1", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: Math.min((campaign?.retentionDays ?? env.SURVEY_RETENTION_DAYS) * 86400, 31536000),
        });
        return NextResponse.json({ ok: true }, { status: 200, headers: { "cache-control": "no-store" } });
      }
      throw error;
    }
    cookieStore.set("ramadu_survey_done", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.min((campaign?.retentionDays ?? env.SURVEY_RETENTION_DAYS) * 86400, 31536000),
    });
    return NextResponse.json({ ok: true }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch {
    return jsonError("Il servizio non è disponibile in questo momento. Riprova più tardi.", 503);
  }
}
