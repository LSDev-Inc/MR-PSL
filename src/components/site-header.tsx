import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["Il progetto", "/#progetto"],
  ["Candidati", "/candidati"],
  ["Programma", "/programma"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Ramadù, pagina iniziale">
        <span className="wordmark-mark">
          R<span>.</span>
        </span>
        <span className="wordmark-copy">
          <strong>RAMADÙ</strong>
          <small>POLO TECNICO · INIZIATIVA STUDENTESCA</small>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigazione principale">
        {links.map(([label, href]) => (
          <Link href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
      <Link href="/partecipa" className="button button-small button-light header-cta">
        Partecipa <span aria-hidden="true">↗</span>
      </Link>
      <details className="mobile-menu">
        <summary aria-label="Apri il menu">
          <span></span>
          <span></span>
        </summary>
        <nav aria-label="Navigazione mobile">
          {links.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
          <Link href="/partecipa">
            Esprimi il tuo sostegno <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </details>
    </header>
  );
}
