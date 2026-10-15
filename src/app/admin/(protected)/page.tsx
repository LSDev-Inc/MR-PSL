import Link from "next/link";
import { AdminCharts } from "@/components/admin-charts";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics";

export default async function AdminDashboardPage() {
  await requireAdmin("dashboard.read");
  const data = await getAnalytics();
  return (
    <div className="admin-content">
      <h1>Buongiorno.</h1>
      <p className="admin-subtitle">Ecco una panoramica aggiornata delle partecipazioni al sondaggio informale.</p>
      <AdminCharts initial={data} />
      <section className="admin-panel quick-actions">
        <h2>Attività campagna</h2>
        <p>Gestisci le informazioni pubbliche e lo stato del sondaggio.</p>
        <div className="admin-actions">
          <Link className="admin-action-link" href="/admin/contenuti">
            Modifica contenuti ↗
          </Link>
          <Link className="admin-action-link" href="/admin/qr-code">
            Genera QR e poster ↗
          </Link>
          <Link className="admin-action-link" href="/admin/impostazioni">
            Stato sondaggio ↗
          </Link>
        </div>
        <p className="chart-note">
          I dati sono risposte anonime effettivamente registrate. Non sono risultati elettorali e non rappresentano
          tutti gli studenti.
        </p>
      </section>
    </div>
  );
}
