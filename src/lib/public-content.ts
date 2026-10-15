import { connectDb } from "@/lib/db";
import { INSTITUTION_ID } from "@/lib/tenant";
import { Campaign, Candidate } from "@/models";

export type PublicCampaign = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  footerText: string;
  status: "open" | "closed";
  closureMessage: string;
  goals: { title: string; description: string }[];
  program: { title?: string; url?: string; size?: number; publishedAt?: Date } | null;
  candidates: {
    position: number;
    name: string;
    className?: string;
    biography?: string;
    statement?: string;
    photoUrl?: string;
    objectives: string[];
    socialLinks: { label: string; url: string }[];
  }[];
};

export async function getPublicCampaign(): Promise<PublicCampaign> {
  const defaultGoals = [
    {
      title: "Ascolto",
      description: "Un canale chiaro per raccogliere idee, domande e punti di vista degli studenti.",
    },
    {
      title: "Trasparenza",
      description: "Aggiornamenti comprensibili su proposte, passaggi e risultati del confronto.",
    },
    { title: "Partecipazione", description: "Occasioni concrete per contribuire alla vita del Polo Tecnico." },
  ];
  const defaults: PublicCampaign = {
    heroTitle: "Il cambiamento inizia da noi.",
    heroSubtitle: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
    ctaPrimary: "Scopri il programma",
    ctaSecondary: "Esprimi il tuo sostegno",
    footerText: "Iniziativa indipendente degli studenti. Non è un servizio ufficiale dell’Istituto.",
    status: "closed" as "open" | "closed",
    closureMessage: "Il sondaggio non è ancora aperto.",
    goals: defaultGoals,
    program: null as null | { title?: string; url?: string; size?: number; publishedAt?: Date },
    candidates: [] as Array<{
      position: number;
      name: string;
      className?: string;
      biography?: string;
      statement?: string;
      photoUrl?: string;
      objectives: string[];
      socialLinks: { label: string; url: string }[];
    }>,
  };
  try {
    await connectDb();
    const [campaign, candidates] = await Promise.all([
      Campaign.findOne({ institutionId: INSTITUTION_ID })
        .select(
          "heroTitle heroSubtitle ctaPrimary ctaSecondary footerText goals status opensAt closesAt closureMessage program",
        )
        .lean(),
      Candidate.find({ institutionId: INSTITUTION_ID, published: true, demoOnly: { $ne: true } })
        .select("position name className biography statement photoUrl objectives socialLinks")
        .sort({ position: 1 })
        .lean(),
    ]);
    const now = new Date();
    const open =
      (campaign?.status === "open" ||
        (campaign?.status === "scheduled" && campaign.opensAt && campaign.opensAt <= now)) &&
      (!campaign.closesAt || campaign.closesAt > now);
    return {
      heroTitle: campaign?.heroTitle ?? defaults.heroTitle,
      heroSubtitle: campaign?.heroSubtitle ?? defaults.heroSubtitle,
      ctaPrimary: campaign?.ctaPrimary ?? defaults.ctaPrimary,
      ctaSecondary: campaign?.ctaSecondary ?? defaults.ctaSecondary,
      footerText: campaign?.footerText ?? defaults.footerText,
      status: open ? ("open" as const) : ("closed" as const),
      closureMessage: campaign?.closureMessage ?? defaults.closureMessage,
      goals: campaign?.goals?.length ? campaign.goals : defaults.goals,
      program: campaign?.program?.url
        ? {
            title: campaign.program.title,
            url: campaign.program.url,
            size: campaign.program.size,
            publishedAt: campaign.program.publishedAt,
          }
        : null,
      candidates: candidates.map(item => ({
        position: item.position,
        name: item.name,
        className: item.className,
        biography: item.biography,
        statement: item.statement,
        photoUrl: item.photoUrl,
        objectives: item.objectives ?? [],
        socialLinks: item.socialLinks ?? [],
      })),
    };
  } catch {
    return defaults;
  }
}
