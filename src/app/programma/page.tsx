import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { getPublicCampaign } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Programma",
  description: "Leggi e scarica il programma della candidatura studentesca al Polo Tecnico.",
  alternates: { canonical: "/programma" },
};
export const revalidate = 60;

export default async function ProgramPage() {
  const campaign = await getPublicCampaign();
  const program = campaign.program;
  return (
    <SiteShell>
      <section className="page-hero wrap">
        <p className="eyebrow">
          <span className="section-number">04</span> / IL DOCUMENTO
        </p>
        <h1>
          Le idee, nero
          <br />
          <em>su bianco.</em>
        </h1>
        <p>Il programma completo sarà pubblicato in un documento accessibile da leggere online e scaricare.</p>
      </section>
      <section className="content-section wrap">
        <div className="program-empty">
          <div className="program-document" aria-hidden="true">
            <strong>
              RAMADÙ
              <br />
              POLO TECNICO
            </strong>
            <span>PDF</span>
          </div>
          <div>
            {program?.url ? (
              <>
                <h2>{program.title ?? "Programma della candidatura"}</h2>
                <p>
                  Apri il documento in una nuova scheda o scarica il file. La pubblicazione e la data saranno aggiornate
                  dagli organizzatori.
                </p>
                <p>
                  <a className="button button-blue" href={program.url} target="_blank" rel="noreferrer">
                    Apri il programma <span aria-hidden="true">↗</span>
                  </a>
                </p>
                <small>
                  Documento PDF{program.size ? ` · ${(program.size / 1024 / 1024).toFixed(1)} MB` : ""}
                  {program.publishedAt
                    ? ` · pubblicato il ${new Date(program.publishedAt).toLocaleDateString("it-IT", { timeZone: "Europe/Rome" })}`
                    : ""}
                  . Se la visualizzazione non è supportata, usa il pulsante di apertura.
                </small>
              </>
            ) : (
              <>
                <h2>Documento in preparazione</h2>
                <p>
                  Il programma ufficiale della campagna non è ancora stato pubblicato. Torna qui per consultarlo appena
                  sarà disponibile.
                </p>
                <small>Non sono state inserite proposte non approvate dai candidati.</small>
              </>
            )}
          </div>
        </div>
        {program?.url && (
          <div className="pdf-viewer-wrap">
            <iframe className="pdf-viewer" src={program.url} title="Anteprima del programma in PDF" loading="lazy" />
          </div>
        )}
        <div className="privacy-callout">
          La partecipazione a questo sito non costituisce un voto. Le elezioni ufficiali si svolgono secondo le
          procedure stabilite dall’Istituto.
        </div>
      </section>
    </SiteShell>
  );
}
