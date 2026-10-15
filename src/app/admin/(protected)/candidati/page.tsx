import type { Metadata } from "next";
import { CandidateManager } from "@/components/admin-editors";
import { actorHasPermission, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Gestione candidati" };

export default async function AdminCandidatesPage() {
  const actor = await requireAdmin("candidates.read");
  return (
    <div className="admin-content">
      <h1>Candidati</h1>
      <p className="admin-subtitle">
        Gestisci i due profili, aggiungi le immagini e pubblica solo i contenuti verificati dai candidati.
      </p>
      {actorHasPermission(actor, "candidates.write") ? (
        <CandidateManager />
      ) : (
        <p className="admin-panel">Il tuo account può consultare i profili ma non modificarli.</p>
      )}
    </div>
  );
}
