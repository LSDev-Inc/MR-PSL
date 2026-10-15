import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { INSTITUTION_ID } from "@/lib/tenant";
import { Campaign, Candidate } from "@/models";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDb();
    const [campaign, candidates] = await Promise.all([
      Campaign.findOne({ institutionId: INSTITUTION_ID })
        .select(
          "status opensAt closesAt closureMessage heroTitle heroSubtitle ctaPrimary ctaSecondary footerText goals program.title program.url program.size program.publishedAt",
        )
        .lean(),
      Candidate.find({ institutionId: INSTITUTION_ID, published: true, demoOnly: { $ne: true } })
        .select("position name className biography statement photoUrl objectives socialLinks")
        .sort({ position: 1 })
        .lean(),
    ]);
    const now = Date.now();
    let status = campaign?.status ?? "closed";
    if (
      status === "scheduled" &&
      campaign?.opensAt &&
      campaign.opensAt.getTime() <= now &&
      (!campaign.closesAt || campaign.closesAt.getTime() > now)
    )
      status = "open";
    if (status === "open" && campaign?.closesAt && campaign.closesAt.getTime() <= now) status = "closed";
    return NextResponse.json(
      {
        institution: "Istituto di Istruzione Superiore Massimiliano Ramadù — Polo Tecnico",
        independentInitiative: true,
        status,
        closureMessage: campaign?.closureMessage ?? "Il sondaggio non è attualmente aperto.",
        heroTitle: campaign?.heroTitle ?? "Il cambiamento inizia da noi.",
        heroSubtitle: campaign?.heroSubtitle ?? "Due studenti. Idee concrete. Una scuola da costruire insieme.",
        ctaPrimary: campaign?.ctaPrimary ?? "Scopri il programma",
        ctaSecondary: campaign?.ctaSecondary ?? "Esprimi il tuo sostegno",
        footerText:
          campaign?.footerText ?? "Iniziativa indipendente degli studenti. Non è un servizio ufficiale dell’Istituto.",
        goals: campaign?.goals ?? [],
        program: campaign?.program ?? null,
        candidates,
      },
      { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json(
      { error: "I contenuti della campagna non sono disponibili in questo momento." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
