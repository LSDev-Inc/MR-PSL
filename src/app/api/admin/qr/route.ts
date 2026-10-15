import { NextResponse } from "next/server";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { campaignQrPng, campaignQrSvg } from "@/lib/qr-code";
import { getCampaignUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  if (!actorHasPermission(actor, "qr.generate")) return jsonError("Permesso insufficiente.", 403);
  const target = getCampaignUrl();
  if (!target) return jsonError("Imposta APP_URL con il dominio HTTPS reale prima di generare il QR.", 503);
  const format = new URL(request.url).searchParams.get("format") ?? "svg";
  const inline = new URL(request.url).searchParams.get("view") === "1";
  try {
    if (format === "png") {
      const buffer = await campaignQrPng(target);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "content-type": "image/png",
          "content-disposition": `${inline ? "inline" : "attachment"}; filename=ramadu-partecipa.png`,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (format !== "svg") return jsonError("Formato non supportato.");
    const svg = await campaignQrSvg(target);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "content-disposition": `${inline ? "inline" : "attachment"}; filename=ramadu-partecipa.svg`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return jsonError("Non è stato possibile generare il QR code.", 500);
  }
}
