import type { Metadata } from "next";
import { CampaignContentForm } from "@/components/admin-editors";
import { actorHasPermission, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Contenuti campagna" };

export default async function ContentPage() {
  const actor = await requireAdmin("content.read");
  return (
    <div className="admin-content">
      <h1>Contenuti pubblici</h1>
      <p className="admin-subtitle">
        Aggiorna i testi della homepage e il messaggio mostrato alla chiusura del sondaggio.
      </p>
      <section className="admin-panel">
        <h2>Homepage e comunicazioni</h2>
        <p>I testi sono convalidati e non supportano codice HTML o script.</p>
        {actorHasPermission(actor, "content.write") ? (
          <CampaignContentForm />
        ) : (
          <p>Il tuo account può consultare ma non modificare i contenuti.</p>
        )}
      </section>
    </div>
  );
}
