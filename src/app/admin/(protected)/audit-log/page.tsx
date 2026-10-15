import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AuditEvent } from "@/models";

export const metadata: Metadata = { title: "Registro attività" };

export default async function AuditPage() {
  await requireAdmin("audit.read");
  await connectDb();
  const events = await AuditEvent.find({ institutionId: INSTITUTION_ID })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("actorId actorRole action resource result createdAt metadata")
    .lean();
  return (
    <div className="admin-content">
      <h1>Registro attività</h1>
      <p className="admin-subtitle">
        Eventi amministrativi sensibili. Il registro non contiene password, token o risposte associate a identità.
      </p>
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data e ora</th>
                <th>Attore</th>
                <th>Azione</th>
                <th>Risorsa</th>
                <th>Esito</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id.toString()}>
                  <td>{event.createdAt?.toLocaleString("it-IT")}</td>
                  <td>
                    {event.actorRole} · {event.actorId === "system" ? "Sistema" : event.actorId.slice(-7)}
                  </td>
                  <td>{event.action}</td>
                  <td>{event.resource}</td>
                  <td>{event.result === "success" ? "Completata" : "Non riuscita"}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Nessuna attività registrata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="chart-note">
          Sono mostrati gli ultimi 100 eventi. La conservazione del registro va configurata in base alle necessità
          dell’iniziativa.
        </p>
      </section>
    </div>
  );
}
