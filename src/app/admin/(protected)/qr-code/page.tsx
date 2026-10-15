import type { Metadata } from "next";
import { QrPoster } from "@/components/admin-editors";
import { requireAdmin } from "@/lib/auth";
import { getCampaignUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "QR e poster" };

export default async function QrCodePage() {
  await requireAdmin("qr.generate");
  const target = getCampaignUrl() ?? "";
  return (
    <div className="admin-content">
      <h1>QR code e poster</h1>
      <p className="admin-subtitle">Genera materiali per la diffusione della pagina pubblica di partecipazione.</p>
      {target ? (
        <>
          <section className="admin-panel">
            <h2>Destinazione</h2>
            <p className="qr-target">{target}</p>
            <p>La destinazione viene presa da APP_URL; localhost viene rifiutato in produzione.</p>
          </section>
          <section className="admin-panel qr-poster-panel">
            <h2>Generatore poster</h2>
            <p>
              Seleziona formato e tema, scarica un PNG ad alta risoluzione oppure usa la stampa del browser per creare
              un PDF.
            </p>
            <QrPoster target={target} />
          </section>
        </>
      ) : (
        <section className="admin-panel">
          <h2>Dominio non configurato</h2>
          <p>
            Imposta APP_URL con il dominio reale di produzione prima di scaricare un QR. Questo impedisce di distribuire
            per errore un codice che punta a localhost.
          </p>
        </section>
      )}
    </div>
  );
}
