import type { Metadata } from "next";
import { ProgramUploader } from "@/components/admin-editors";
import { actorHasPermission, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Programma" };

export default async function AdminProgramPage() {
  const actor = await requireAdmin("program.read");
  return (
    <div className="admin-content">
      <h1>Documento programma</h1>
      <p className="admin-subtitle">
        Carica e pubblica il PDF della campagna. Il file viene verificato e salvato fuori dal database.
      </p>
      <section className="admin-panel">
        <h2>Documento pubblico</h2>
        <p>
          Accettiamo PDF fino a 10 MB. Il file viene caricato su Cloudinary e sara accessibile dalla pagina Programma.
        </p>
        {actorHasPermission(actor, "program.write") ? (
          <ProgramUploader />
        ) : (
          <p>Il tuo account può consultare le informazioni ma non sostituire il documento.</p>
        )}
      </section>
    </div>
  );
}
