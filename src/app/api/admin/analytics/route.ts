import { NextResponse } from "next/server";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getAdminActor();
  if (!actor)
    return NextResponse.json(
      { error: "Accesso richiesto." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  if (!actorHasPermission(actor, "analytics.read"))
    return NextResponse.json({ error: "Permesso insufficiente." }, { status: 403 });
  try {
    return NextResponse.json(await getAnalytics(), { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Dati non disponibili." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
