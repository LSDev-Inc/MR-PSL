import Link from "next/link";
import { getPublicCampaign } from "@/lib/public-content";

export async function SiteFooter() {
  const campaign = await getPublicCampaign();
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" className="wordmark">
          <span className="wordmark-mark">
            R<span>.</span>
          </span>
          <span className="wordmark-copy">
            <strong>RAMADÙ</strong>
            <small>POLO TECNICO · INIZIATIVA STUDENTESCA</small>
          </span>
        </Link>
        <p>
          Idee in circolo.
          <br />
          <span>La scuola, insieme.</span>
        </p>
      </div>
      <div className="footer-bottom">
        <p>{campaign.footerText}</p>
        <nav aria-label="Informazioni">
          <Link href="/privacy">Privacy</Link>
          <Link href="/informazioni">Informazioni</Link>
          <Link href="/admin/login">Area organizzatori</Link>
        </nav>
      </div>
    </footer>
  );
}
