import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminActor } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Accesso amministratori",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  if (await getAdminActor()) redirect("/admin");
  return (
    <main className="login-page">
      <section className="login-card">
        <Link href="/" className="wordmark">
          <span className="wordmark-mark">
            R<span>.</span>
          </span>
          <span className="wordmark-copy">
            <strong>RAMADÙ</strong>
            <small>POLO TECNICO · AREA RISERVATA</small>
          </span>
        </Link>
        <h1>Accesso organizzatori</h1>
        <p>Inserisci le credenziali del tuo account amministrativo.</p>
        <AdminLoginForm />
        <p className="login-footnote">
          Accesso riservato ai responsabili autorizzati della campagna.{" "}
          <Link href="/informazioni">Informazioni sull’iniziativa</Link>
        </p>
      </section>
    </main>
  );
}
