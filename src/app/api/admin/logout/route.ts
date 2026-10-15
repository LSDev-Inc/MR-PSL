import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";
import { jsonError, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Richiesta non valida.", 403);
  await clearAdminSession();
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
