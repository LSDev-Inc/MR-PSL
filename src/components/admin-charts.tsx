"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Analytics = {
  total: number;
  yes: number;
  no: number;
  yesPercentage: number;
  noPercentage: number;
  today: number;
  status: "open" | "closed";
  refreshedAt: string;
  chartData: { date: string; label: string; total: number; yes: number; no: number }[];
  recentEvents: {
    id: string;
    action: string;
    actorRole: string;
    result: string;
    createdAt?: string;
    resource: string;
  }[];
};

function fmt(value: number) {
  return new Intl.NumberFormat("it-IT").format(value);
}

export function AdminCharts({ initial }: { initial: Analytics }) {
  const [data, setData] = useState(initial);
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/admin/analytics", { cache: "no-store" });
        if (response.ok) {
          setData(await response.json());
          setUpdated(true);
        }
      } catch {
        /* Keep the last successful snapshot visible. */
      }
    };
    const visibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    timer = setInterval(() => void refresh(), 15000);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return (
    <>
      <div className="admin-kpis">
        <article className="admin-card">
          <div className="admin-card-label">PARTECIPAZIONI TOTALI</div>
          <div className="admin-card-value">{fmt(data.total)}</div>
          <div className="admin-card-note">Risposte effettivamente registrate</div>
        </article>
        <article className="admin-card">
          <div className="admin-card-label">SÌ, MI INTERESSA</div>
          <div className="admin-card-value">{fmt(data.yes)}</div>
          <div className="admin-card-note">
            {data.yesPercentage.toLocaleString("it-IT", { maximumFractionDigits: 1 })}% delle risposte
          </div>
        </article>
        <article className="admin-card">
          <div className="admin-card-label">NO, NON AL MOMENTO</div>
          <div className="admin-card-value">{fmt(data.no)}</div>
          <div className="admin-card-note">
            {data.noPercentage.toLocaleString("it-IT", { maximumFractionDigits: 1 })}% delle risposte
          </div>
        </article>
        <article className="admin-card">
          <div className="admin-card-label">STATO SONDAGGIO</div>
          <div className="admin-card-value admin-status">{data.status === "open" ? "Aperto" : "Chiuso"}</div>
          <div className="admin-card-note">{fmt(data.today)} risposte oggi</div>
        </article>
      </div>
      <div className="admin-grid">
        <section className="admin-panel">
          <h2>Andamento partecipazioni</h2>
          <p>Risposte giornaliere effettivamente persistite · ultimi 30 giorni</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={data.chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#75a8ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#75a8ff" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(220,235,255,.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8090a5", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#8090a5", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0c1420",
                    border: "1px solid #40536d",
                    borderRadius: 3,
                    color: "#e8eef8",
                    fontSize: 10,
                  }}
                  labelStyle={{ color: "#99acc8" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Risposte"
                  stroke="#7eafff"
                  strokeWidth={2}
                  fill="url(#fillTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="admin-panel">
          <h2>Distribuzione risposte</h2>
          <p>Percentuale sul totale del sondaggio informale</p>
          <div className="response-meter">
            <span className="response-yes" style={{ width: `${data.total ? (data.yes / data.total) * 100 : 0}%` }} />
            <span className="response-no" style={{ width: `${data.total ? (data.no / data.total) * 100 : 0}%` }} />
          </div>
          <div className="response-legend">
            <span>Favorevoli · {data.yesPercentage.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</span>
            <span>No · {data.noPercentage.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</span>
          </div>
          {data.total === 0 && <p className="chart-empty">I dati appariranno dopo le prime risposte reali.</p>}
          <div className="chart-note">
            Queste percentuali descrivono soltanto le risposte raccolte. Non sono risultati elettorali e non
            rappresentano l’intera popolazione scolastica.
          </div>
        </section>
      </div>
      <section className="admin-panel recent-events">
        <h2>Attività recente</h2>
        <p>Ultime azioni registrate nell’audit log.</p>
        {data.recentEvents.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ora</th>
                  <th>Evento</th>
                  <th>Ruolo</th>
                  <th>Esito</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.slice(0, 6).map(event => (
                  <tr key={event.id}>
                    <td>
                      {event.createdAt
                        ? new Date(event.createdAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" })
                        : "—"}
                    </td>
                    <td>{event.action}</td>
                    <td>{event.actorRole}</td>
                    <td>{event.result === "success" ? "Completata" : "Non riuscita"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="chart-empty">Nessuna attività amministrativa ancora registrata.</p>
        )}
      </section>
      <p className="admin-refresh">
        {updated ? "Dati aggiornati" : "Ultimo aggiornamento"}:{" "}
        {new Date(data.refreshedAt).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}{" "}
        · aggiornamento automatico ogni 15 secondi mentre la pagina è visibile.
      </p>
    </>
  );
}
