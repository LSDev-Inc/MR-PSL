import type { Metadata } from "next";
import { actorHasPermission, requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics";

export const metadata: Metadata = { title: "Partecipazioni" };

export default async function ParticipationsPage() {
  const actor = await requireAdmin("participants.read");
  const data = await getAnalytics();
  return (
    <div className="admin-content">
      <h1>Partecipazioni</h1>
      <p className="admin-subtitle">Consultazione aggregata delle risposte. Non è disponibile un elenco nominativo.</p>
      <section className="admin-panel privacy-panel">
        <span className="privacy-panel-icon">◌</span>
        <div>
          <h2>Risposte separate da ogni identità</h2>
          <p>
            Il sondaggio non raccoglie nomi o numeri di telefono. Le risposte vengono conservate senza un identificativo
            personale; questa schermata mostra soltanto conteggi aggregati e andamento giornaliero.
          </p>
        </div>
      </section>
      <div className="admin-kpis participation-kpis">
        <article className="admin-card">
          <div className="admin-card-label">TOTALE RISPOSTE</div>
          <div className="admin-card-value">{data.total.toLocaleString("it-IT")}</div>
          <div className="admin-card-note">Risposte effettivamente archiviate</div>
        </article>
        <article className="admin-card">
          <div className="admin-card-label">RISPOSTE SÌ</div>
          <div className="admin-card-value">{data.yes.toLocaleString("it-IT")}</div>
          <div className="admin-card-note">Aggregate senza identità</div>
        </article>
        <article className="admin-card">
          <div className="admin-card-label">RISPOSTE NO</div>
          <div className="admin-card-value">{data.no.toLocaleString("it-IT")}</div>
          <div className="admin-card-note">Aggregate senza identità</div>
        </article>
      </div>
      <section className="admin-panel">
        <h2>Partecipazione giornaliera</h2>
        <p>Ultimi 30 giorni</p>
        {actorHasPermission(actor, "participants.export") && (
          <div className="admin-actions">
            <a href="/api/admin/participations?format=csv" className="admin-action-link">
              Esporta CSV aggregato ↗
            </a>
          </div>
        )}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Risposte</th>
                <th>Sì</th>
                <th>No</th>
              </tr>
            </thead>
            <tbody>
              {data.chartData
                .filter(item => item.total > 0)
                .slice()
                .reverse()
                .map(item => (
                  <tr key={item.date}>
                    <td>{new Date(`${item.date}T12:00:00`).toLocaleDateString("it-IT")}</td>
                    <td>{item.total}</td>
                    <td>{item.yes}</td>
                    <td>{item.no}</td>
                  </tr>
                ))}
              {data.chartData.every(item => item.total === 0) && (
                <tr>
                  <td className="table-empty" colSpan={4}>
                    Nessuna partecipazione ancora registrata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="chart-note">
          Le risposte non sono voti ufficiali. Non vengono mostrate suddivisioni per classi, perché non è stata attivata
          una raccolta di classi separata e soggetta a soglie di riservatezza.
        </p>
      </section>
    </div>
  );
}
