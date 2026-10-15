import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Informazioni",
  description: "Informazioni sull’iniziativa studentesca indipendente per il Polo Tecnico.",
  alternates: { canonical: "/informazioni" },
};

export const revalidate = 60;

export default function InformationPage() {
  return (
    <SiteShell>
      <section className="page-hero wrap">
        <p className="eyebrow">CHI SIAMO / TRASPARENZA</p>
        <h1>
          Un progetto
          <br />
          <em>degli studenti.</em>
        </h1>
        <p>
          Una piattaforma indipendente per raccontare una candidatura e raccogliere opinioni in modo informale e
          volontario.
        </p>
      </section>
      <section className="content-section wrap content-narrow">
        <h2>Per chi è pensato</h2>
        <p>
          Questo progetto riguarda il Polo Tecnico dell’Istituto di Istruzione Superiore Massimiliano Ramadù, in Via
          Luigi Einaudi 11, 04012 Cisterna di Latina (LT). L’Istituto comprende anche un Polo Liceale, che non è
          l’ambito di questa iniziativa.
        </p>
        <h2>Iniziativa indipendente</h2>
        <p>
          Il sito è realizzato come iniziativa studentesca indipendente e non è un servizio ufficiale dell’Istituto. Non
          deve essere interpretato come un canale istituzionale né come un’espressione di approvazione da parte della
          scuola.
        </p>
        <h2>Sondaggio informale</h2>
        <p>
          Le risposte raccolte attraverso la pagina “Partecipa” servono a capire l’interesse verso il progetto. Il
          sondaggio è facoltativo, non vincolante e non equivale al voto elettorale. Non verifica l’identità di chi
          partecipa e non può garantire una risposta per ogni singolo studente.
        </p>
        <h2>Contatti dell’iniziativa</h2>
        <p>
          Prima della pubblicazione, gli organizzatori devono inserire un recapito valido e il nominativo del referente
          responsabile. Fino ad allora, non vengono mostrati contatti personali inventati.
        </p>
        <div className="notice-card">
          <strong>Contenuti e autorizzazioni</strong>
          <p>
            Nomi, fotografie, programma e contatti devono essere forniti e approvati dai candidati o dai responsabili
            della campagna prima della pubblicazione.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
