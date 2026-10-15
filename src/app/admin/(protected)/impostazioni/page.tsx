import type { Metadata } from "next";
import { CampaignSettingsForm } from "@/components/admin-editors";
import { actorHasPermission, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Impostazioni campagna" };

export default async function SettingsPage() {
  const actor = await requireAdmin("settings.read");
  return (
    <div className="admin-content">
      <h1>Impostazioni campagna</h1>
      <p className="admin-subtitle">Controlla apertura, chiusura e periodo di conservazione delle risposte.</p>
      <section className="admin-panel">
        <h2>Stato del sondaggio</h2>
        <p>Il sondaggio resta facoltativo e non ufficiale. Le modifiche di stato vengono applicate sul server.</p>
        {actorHasPermission(actor, "settings.write") ? (
          <CampaignSettingsForm />
        ) : (
          <p>Il tuo account può consultare le impostazioni ma non cambiarle.</p>
        )}
      </section>
    </div>
  );
}
