import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Informativa sulla raccolta delle risposte al sondaggio informale e sui dati tecnici del sito.",
  alternates: { canonical: "/privacy" },
};

export const revalidate = 60;

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="page-hero wrap">
        <p className="eyebrow">DATI / RISERVATEZZA</p>
        <h1>
          La tua risposta
          <br />
          <em>resta anonima.</em>
        </h1>
        <p>
          La piattaforma è stata progettata per ridurre al minimo i dati raccolti. Questa pagina descrive il
          funzionamento attuale.
        </p>
      </section>
      <section className="content-section wrap content-narrow">
        <div className="privacy-callout">
          Questo sito è un’iniziativa studentesca indipendente. Il sondaggio non è ufficiale, non è un voto e non
          sostituisce le procedure elettorali dell’Istituto.
        </div>
        <h2>Risposte al sondaggio</h2>
        <p>
          La risposta “Sì, mi interessa” o “No, non al momento” è registrata senza nome, cognome, numero di telefono,
          indirizzo o documento d’identità. La risposta è conservata separata da profili personali e non viene usata per
          pubblicità o profilazione. Ogni record include una chiave casuale di idempotenza protetta da hash, senza
          tabella di corrispondenza con studenti.
        </p>
        <h2>Prevenzione degli invii ripetuti</h2>
        <p>
          Per evitare invii accidentali, il browser riceve un cookie tecnico con il solo indicatore “già partecipato”;
          non contiene la scelta. Per limitare gli abusi, il server conserva per 15 minuti un hash con chiave
          dell’indirizzo di rete, non l’indirizzo in chiaro. Gli amministratori non possono risalire dalla risposta
          all’identità di uno studente. La protezione non garantisce una risposta per ogni singola persona: i cookie
          possono essere cancellati e non viene verificata l’identità.
        </p>
        <h2>Minori e partecipazione volontaria</h2>
        <p>
          La partecipazione è facoltativa. Non chiediamo dati personali per rispondere. Se in futuro verrà attivata una
          raccolta identificativa, dovrà essere valutata e descritta separatamente prima dell’attivazione.
        </p>
        <h2>Conservazione e responsabile</h2>
        <p>
          Le risposte scadono secondo il numero di giorni configurato nell’area amministrativa; il valore iniziale è 180
          giorni. Prima della pubblicazione, i responsabili devono indicare chi gestisce il trattamento, il recapito per
          le richieste, la base giuridica, i fornitori tecnici e il periodo effettivo di conservazione. Queste
          informazioni non sono ancora state approvate: il sito non dichiara una conformità normativa già verificata.
        </p>
        <h2>Cookie e servizi esterni</h2>
        <p>
          La versione attuale non integra strumenti pubblicitari o tracker di terze parti. Il cookie tecnico del
          sondaggio dura al massimo quanto la conservazione configurata (fino a un anno); il cookie amministrativo è
          HTTP-only, SameSite Strict e scade dopo quattro ore. I font vengono serviti dal sistema locale del
          dispositivo.
        </p>
      </section>
    </SiteShell>
  );
}
