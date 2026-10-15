import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db";
import { INSTITUTION_ID } from "@/lib/tenant";
import { Campaign, Candidate } from "@/models";

export const PUBLIC_CAMPAIGN_CACHE_TAG = "public-campaign";
const PUBLIC_CAMPAIGN_CACHE_SECONDS = 60;

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

type PublicCampaignSnapshot = {
  campaign: {
    heroTitle?: string;
    heroSubtitle?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    footerText?: string;
    status?: string;
    opensAt?: number;
    closesAt?: number;
    closureMessage?: string;
    goals?: { title: string; description: string }[];
    program?: { title?: string; url?: string; size?: number; publishedAt?: number };
  } | null;
  candidates: PublicCampaign["candidates"];
};

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

function defaultCampaign(): PublicCampaign {
  return {
    heroTitle: "Il cambiamento inizia da noi.",
    heroSubtitle: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
    ctaPrimary: "Scopri il programma",
    ctaSecondary: "Esprimi il tuo sostegno",
    footerText: "Iniziativa indipendente degli studenti. Non è un servizio ufficiale dell’Istituto.",
    status: "closed",
    closureMessage: "Il sondaggio non è ancora aperto.",
    goals: defaultGoals,
    program: null,
    candidates: [],
  };
}

const getCachedPublicCampaignSnapshot = unstable_cache(
  async (): Promise<PublicCampaignSnapshot> => {
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

    return {
      campaign: campaign
        ? {
            heroTitle: campaign.heroTitle,
            heroSubtitle: campaign.heroSubtitle,
            ctaPrimary: campaign.ctaPrimary,
            ctaSecondary: campaign.ctaSecondary,
            footerText: campaign.footerText,
            status: campaign.status,
            opensAt: campaign.opensAt?.getTime(),
            closesAt: campaign.closesAt?.getTime(),
            closureMessage: campaign.closureMessage,
            goals: campaign.goals,
            program: campaign.program?.url
              ? {
                  title: campaign.program.title,
                  url: campaign.program.url,
                  size: campaign.program.size,
                  publishedAt: campaign.program.publishedAt?.getTime(),
                }
              : undefined,
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
  },
  ["ramadu-public-campaign-v1"],
  { revalidate: PUBLIC_CAMPAIGN_CACHE_SECONDS, tags: [PUBLIC_CAMPAIGN_CACHE_TAG] },
);

export async function getPublicCampaign(): Promise<PublicCampaign> {
  const defaults = defaultCampaign();
  try {
    const { campaign, candidates } = await getCachedPublicCampaignSnapshot();
    const now = Date.now();
    const open =
      (campaign?.status === "open" ||
        (campaign?.status === "scheduled" && campaign.opensAt !== undefined && campaign.opensAt <= now)) &&
      (campaign.closesAt === undefined || campaign.closesAt > now);

    return {
      heroTitle: campaign?.heroTitle ?? defaults.heroTitle,
      heroSubtitle: campaign?.heroSubtitle ?? defaults.heroSubtitle,
      ctaPrimary: campaign?.ctaPrimary ?? defaults.ctaPrimary,
      ctaSecondary: campaign?.ctaSecondary ?? defaults.ctaSecondary,
      footerText: campaign?.footerText ?? defaults.footerText,
      status: open ? "open" : "closed",
      closureMessage: campaign?.closureMessage ?? defaults.closureMessage,
      goals: campaign?.goals?.length ? campaign.goals : defaults.goals,
      program: campaign?.program?.url
        ? {
            title: campaign.program.title,
            url: campaign.program.url,
            size: campaign.program.size,
            publishedAt: campaign.program.publishedAt ? new Date(campaign.program.publishedAt) : undefined,
          }
        : null,
      candidates,
    };
  } catch {
    // Keep public pages available with safe defaults if MongoDB is temporarily unavailable.
    return defaults;
  }
}

export function revalidatePublicCampaign() {
  revalidateTag(PUBLIC_CAMPAIGN_CACHE_TAG, { expire: 0 });
  for (const path of ["/", "/programma", "/candidati", "/partecipa", "/informazioni", "/privacy"]) {
    revalidatePath(path, "page");
  }
}
