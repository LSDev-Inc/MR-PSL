import { NextResponse } from "next/server";
import { actorHasPermission, getAdminActor } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { INSTITUTION_ID } from "@/lib/tenant";
import { SurveyResponse } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (!actor) return jsonError("Accesso richiesto.", 401);
  const csv = new URL(request.url).searchParams.get("format") === "csv";
  if (csv ? !actorHasPermission(actor, "participants.export") : !actorHasPermission(actor, "participants.read"))
    return jsonError("Permesso insufficiente.", 403);
  try {
    await connectDb();
    const rows = await SurveyResponse.aggregate([
      { $match: { institutionId: INSTITUTION_ID } },
      {
        $group: {
          _id: {
            date: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "Europe/Rome" } },
            choice: "$choice",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          total: { $sum: "$count" },
          yes: { $sum: { $cond: [{ $eq: ["$_id.choice", "yes"] }, "$count", 0] } },
          no: { $sum: { $cond: [{ $eq: ["$_id.choice", "no"] }, "$count", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    if (csv) {
      const body = [
        "data,risposte_totali,si,no",
        ...rows.map(row => `${row._id},${row.total},${row.yes},${row.no}`),
      ].join("\r\n");
      return new NextResponse(body, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": "attachment; filename=partecipazioni-aggregate.csv",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    return NextResponse.json(
      rows.map(row => ({ date: row._id, total: row.total, yes: row.yes, no: row.no })),
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return jsonError("Dati non disponibili.", 503);
  }
}
