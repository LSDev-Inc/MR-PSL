import { NextResponse } from "next/server";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AdminUser } from "@/models";

export const runtime = "nodejs";

export async function GET() {
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "users.read")) return jsonError("Permesso insufficiente.", 403);
  try {
    await connectDb();
    const users = await AdminUser.find({ institutionId: INSTITUTION_ID })
      .sort({ email: 1 })
      .select("email role permissions disabledAt lastLoginAt createdAt")
      .lean();
    return NextResponse.json(
      users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        disabled: Boolean(user.disabledAt),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt?.toISOString() ?? null,
      })),
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return jsonError("Elenco utenti non disponibile.", 503);
  }
}
