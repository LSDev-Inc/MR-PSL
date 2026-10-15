import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { getPublicCampaign } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "I candidati",
  description: "Conosci gli studenti candidati per il Polo Tecnico dell’IIS Massimiliano Ramadù.",
  alternates: { canonical: "/candidati" },
};
export const revalidate = 60;

export default async function CandidatesPage() {
  const campaign = await getPublicCampaign();
  const candidates = ([1, 2] as const).map(position => ({
    position,
    candidate: campaign.candidates.find(item => item.position === position),
  }));
  return (
    <SiteShell>
      <section className="page-hero wrap">
        <p className="eyebrow">
          <span className="section-number">03</span> / LE PERSONE
        </p>
        <h1>
          Le persone
          <br />
          <em>dietro le idee.</em>
        </h1>
        <p>
          Una candidatura è fatta di ascolto, responsabilità e persone. I profili saranno pubblicati dopo la conferma
          dei candidati.
        </p>
      </section>
      <section className="content-section wrap">
        <div className="profile-grid">
          {candidates.map(({ candidate, position }) => (
            <article className="profile-card" key={position}>
              <div className="profile-art">
                {candidate?.photoUrl ? (
                  <div
                    className="profile-photo"
                    role="img"
                    aria-label={`Ritratto di ${candidate.name}`}
                    style={{ backgroundImage: `url("${candidate.photoUrl}")` }}
                  />
                ) : (
                  <span className="profile-symbol">0{position}</span>
                )}
                <span className="profile-label">
                  {candidate?.className ?? (candidate ? "CANDIDATO · POLO TECNICO" : "RITRATTO DA AGGIUNGERE")}
                </span>
              </div>
              <div className="profile-info">
                <span className="profile-status">
                  {candidate ? "CANDIDATO · POLO TECNICO" : "PROFILO IN PREPARAZIONE"}
                </span>
                <h2>{candidate?.name ?? (position === 1 ? "Primo candidato" : "Secondo candidato")}</h2>
                <p>
                  {candidate?.statement ??
                    candidate?.biography ??
                    "Nome, classe, biografia e dichiarazione personale saranno inseriti dai responsabili della campagna dopo la verifica delle informazioni."}
                </p>
                {candidate?.objectives.length ? (
                  <ul className="profile-objectives">
                    {candidate.objectives.map(objective => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {campaign.candidates.length === 0 && (
          <div className="notice-card">
            <strong>Informazioni trasparenti</strong>
            <p>
              In questa versione non sono stati inventati nomi, esperienze o promesse. I ritratti e le schede reali
              saranno pubblicati solo con i contenuti forniti e approvati dai candidati.
            </p>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
