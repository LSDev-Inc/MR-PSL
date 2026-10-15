import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/http";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AdminInvite, AdminSession, AdminUser } from "@/models";

export const runtime = "nodejs";
const acceptSchema = z
  .object({
    token: z.string().min(30).max(100),
    password: z
      .string()
      .min(14)
      .max(128)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
  })
  .strict();

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Richiesta non valida.");
  }
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success)
    return jsonError(
      "La password deve contenere almeno 14 caratteri, una maiuscola, una minuscola, un numero e un simbolo.",
    );
  try {
    await connectDb();
    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const invite = await AdminInvite.findOne({
      institutionId: INSTITUTION_ID,
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!invite) return jsonError("Il link è scaduto o è già stato utilizzato. Chiedi un nuovo invito.", 410);
    const passwordHash = await hash(parsed.data.password, 12);
    if (invite.purpose === "invite") {
      await AdminUser.create({
        institutionId: INSTITUTION_ID,
        email: invite.email,
        passwordHash,
        role: invite.role,
        permissions: [],
      });
    } else {
      const user = await AdminUser.findOne({ institutionId: INSTITUTION_ID, email: invite.email });
      if (!user) return jsonError("Account non disponibile. Chiedi un nuovo invito.", 404);
      user.passwordHash = passwordHash;
      user.authVersion += 1;
      user.disabledAt = undefined;
      await user.save();
      await AdminSession.updateMany(
        { userId: user._id, institutionId: INSTITUTION_ID, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
    }
    await AdminInvite.deleteOne({ _id: invite._id });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Non è stato possibile completare la configurazione dell’account.", 503);
  }
}
