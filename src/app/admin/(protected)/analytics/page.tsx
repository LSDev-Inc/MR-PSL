import type { Metadata } from "next";
import { AdminCharts } from "@/components/admin-charts";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics";

export const metadata: Metadata = { title: "Analisi" };

export default async function AnalyticsPage() {
  await requireAdmin("analytics.read");
  const data = await getAnalytics();
  return (
    <div className="admin-content">
      <h1>Analisi delle partecipazioni</h1>
      <p className="admin-subtitle">
        Solo dati aggregati, aggiornati automaticamente. Nessun profilo studente è associato alle risposte.
      </p>
      <AdminCharts initial={data} />
      <section className="admin-panel">
        <h2>Come leggere i dati</h2>
        <p>
          Le percentuali sono calcolate sulle sole risposte persistite: “sì” o “no” diviso il totale delle risposte
          valide. Con zero risposte la percentuale è zero. Questi dati non sono risultati ufficiali e non vengono estesi
          all’intera popolazione scolastica.
        </p>
      </section>
    </div>
  );
}
