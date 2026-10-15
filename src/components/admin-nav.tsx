import Link from "next/link";
import type { AdminActor } from "@/lib/auth";
import { actorHasPermission } from "@/lib/auth";

const items = [
  ["Panoramica", "/admin", "dashboard.read"],
  ["Analisi", "/admin/analytics", "analytics.read"],
  ["Partecipazioni", "/admin/partecipazioni", "participants.read"],
  ["Candidati", "/admin/candidati", "candidates.read"],
  ["Programma", "/admin/programma", "program.read"],
  ["Contenuti", "/admin/contenuti", "content.read"],
  ["QR e poster", "/admin/qr-code", "qr.generate"],
  ["Utenti", "/admin/utenti", "users.read"],
  ["Audit log", "/admin/audit-log", "audit.read"],
  ["Impostazioni", "/admin/impostazioni", "settings.read"],
] as const;

export function AdminNavigation({ actor }: { actor: AdminActor }) {
  return (
    <>
      <aside className="admin-sidebar">
        <Link href="/" className="wordmark">
          <span className="wordmark-mark">
            R<span>.</span>
          </span>
          <span className="wordmark-copy">
            <strong>RAMADÙ</strong>
            <small>CONSOLE ORGANIZZATORI</small>
          </span>
        </Link>
        <p className="admin-label">CAMPAGNA</p>
        <nav className="admin-nav" aria-label="Menu amministrazione">
          {items
            .filter(([, , permission]) => actorHasPermission(actor, permission))
            .map(([label, href]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
        </nav>
        <p className="admin-sidebar-bottom">
          Iniziativa indipendente
          <br />
          IIS Massimiliano Ramadù
          <br />
          Polo Tecnico
        </p>
      </aside>
      <header className="admin-topbar">
        <span>
          AMMINISTRAZIONE / <strong>{actor.role.replaceAll("_", " ")}</strong>
        </span>
        <div className="admin-user">
          <span>{actor.email}</span>
          <span className="admin-avatar" aria-hidden="true">
            {actor.email.slice(0, 1).toUpperCase()}
          </span>
          <form action="/api/admin/logout" method="post" className="logout-form">
            <button type="submit">Esci</button>
          </form>
        </div>
      </header>
    </>
  );
}
