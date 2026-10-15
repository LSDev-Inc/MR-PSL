import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { SurveyForm } from "@/components/survey-form";
import { getPublicCampaign } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Partecipa al sondaggio",
  description: "Esprimi il tuo interesse attraverso un sondaggio facoltativo, anonimo e informale.",
  alternates: { canonical: "/partecipa" },
};
export const revalidate = 60;

export default async function ParticipatePage() {
  const campaign = await getPublicCampaign();
  return (
    <SiteShell>
      <section className="page-hero wrap">
        <p className="eyebrow">
          <span className="status-dot" /> LA TUA OPINIONE CONTA
        </p>
        <h1>
          Fai sentire
          <br />
          <em>la tua voce.</em>
        </h1>
        <p>Scopri il progetto e facci sapere se vorresti sostenerlo. Bastano pochi secondi.</p>
      </section>
      <section className="wrap">
        <div className="survey-wrap">
          {campaign.status === "open" ? (
            <SurveyForm />
          ) : (
            <>
              <div className="survey-card survey-closed">
                <p className="survey-step">SONDAGGIO NON DISPONIBILE</p>
                <h2>Il confronto continua.</h2>
                <p>{campaign.closureMessage}</p>
                <a className="button button-outline" href="/programma">
                  Leggi il programma <span aria-hidden="true">↗</span>
                </a>
              </div>
              <p className="survey-legal">
                Il sondaggio è facoltativo e non vincolante: non è un voto elettorale e non sostituisce le procedure
                ufficiali dell’Istituto.
              </p>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
