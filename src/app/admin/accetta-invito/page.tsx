import type { Metadata } from "next";
import Link from "next/link";
import { InviteAcceptForm } from "@/components/invite-accept-form";

export const metadata: Metadata = {
  title: "Configura account",
  robots: { index: false, follow: false, nocache: true },
};

export default function AcceptInvitePage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <Link href="/" className="wordmark">
          <span className="wordmark-mark">
            R<span>.</span>
          </span>
          <span className="wordmark-copy">
            <strong>RAMADÙ</strong>
            <small>POLO TECNICO · ACCESSO RISERVATO</small>
          </span>
        </Link>
        <h1>Configura il tuo account</h1>
        <p>Scegli una password personale. Il link è monouso e scade dopo 30 minuti.</p>
        <InviteAcceptForm />
      </section>
    </main>
  );
}
