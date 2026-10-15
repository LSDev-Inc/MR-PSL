import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getPublicCampaign } from "@/lib/public-content";

export const revalidate = 60;

export default async function Home() {
  const campaign = await getPublicCampaign();
  const topics = campaign.goals;
  const titleWords = campaign.heroTitle.trim().split(/\s+/);
  const emphasis = titleWords.splice(-2).join(" ");
  return (
    <SiteShell>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> MASSIMILIANO RAMADÙ <span className="eyebrow-separator">/</span> POLO
            TECNICO
          </p>
          <h1>
            {titleWords.join(" ")}
            <br />
            <em>{emphasis}</em>
          </h1>
          <p className="hero-lede">{campaign.heroSubtitle}</p>
          <div className="hero-actions">
            <Link className="button button-blue" href="/programma">
              {campaign.ctaPrimary} <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/partecipa">
              {campaign.ctaSecondary} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="line" /> Un’iniziativa nata tra i banchi, aperta a tutti.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-topline">
            <span>UNA VOCE, MOLTE IDEE</span>
            <span>LT · 2026</span>
          </div>
          <div className="portrait-stage">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="portrait-placeholder portrait-left">
              <span className="portrait-index">01</span>
              <span className="portrait-silhouette">
                <i />
              </span>
              <span className="portrait-caption">
                PROFILO IN
                <br />
                AGGIORNAMENTO
              </span>
            </div>
            <div className="portrait-placeholder portrait-right">
              <span className="portrait-index">02</span>
              <span className="portrait-silhouette">
                <i />
              </span>
              <span className="portrait-caption">
                PROFILO IN
                <br />
                AGGIORNAMENTO
              </span>
            </div>
            <div className="art-cross">+</div>
            <div className="art-circle">
              RM
              <br />
              <small>PT</small>
            </div>
          </div>
          <div className="art-bottomline">
            <span>PROGETTO STUDENTESCO INDIPENDENTE</span>
            <span>41°35′N 12°49′E</span>
          </div>
          <div className="art-note">I ritratti dei candidati saranno pubblicati dopo la loro conferma.</div>
        </div>
        <a href="#progetto" className="scroll-cue">
          <span></span> SCORRI PER SCOPRIRE
        </a>
      </section>

      <section className="intro-band" id="progetto">
        <div className="wrap intro-grid">
          <p className="eyebrow dark-eyebrow">01 / IL PROGETTO</p>
          <div>
            <h2>
              Una scuola migliore
              <br />
              <span>si costruisce insieme.</span>
            </h2>
            <p className="body-large">
              Questo spazio racconta una candidatura studentesca per il Polo Tecnico dell’IIS Massimiliano Ramadù. Qui
              potrai conoscere le persone, leggere le idee e partecipare al confronto.
            </p>
            <Link className="text-link text-link-dark" href="/candidati">
              Conosci i candidati <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span className="section-number">02</span> / IL METODO
            </p>
            <h2>
              Prima di tutto,
              <br />
              <em>ascoltare.</em>
            </h2>
          </div>
        </div>
        <div className="topic-grid">
          {topics.map((topic, index) => (
            <article className="topic-card" key={topic.title}>
              <span className="topic-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </div>
              <span className="topic-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
        <div className="topic-disclaimer">
          <span className="info-mark">i</span> Temi iniziali da discutere con gli studenti: non rappresentano impegni
          già assunti.
        </div>
      </section>

      <section className="candidate-feature">
        <div className="wrap candidate-feature-inner">
          <div className="candidate-art" aria-hidden="true">
            <div className="candidate-art-ring" />
            <div className="candidate-art-type">
              IL
              <br />
              FUTURO
              <br />
              <i>È</i>
              <br />
              NOSTRO<span>.</span>
            </div>
            <span className="candidate-art-index">RAMADÙ / POLO TECNICO</span>
          </div>
          <div className="candidate-feature-copy">
            <p className="eyebrow">
              <span className="section-number">03</span> / LE PERSONE
            </p>
            <h2>
              Due percorsi.
              <br />
              <em>Un progetto comune.</em>
            </h2>
            <p>
              I profili completi, le esperienze e le parole dei candidati verranno presentati qui non appena saranno
              confermati.
            </p>
            <Link className="button button-outline" href="/candidati">
              Scopri chi siamo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="program-strip wrap">
        <div className="program-icon" aria-hidden="true">
          <span>PDF</span>
          <i>↗</i>
        </div>
        <div className="program-strip-copy">
          <p className="eyebrow">
            <span className="section-number">04</span> / IL DOCUMENTO
          </p>
          <h2>Le idee, nero su bianco.</h2>
          <p>Il programma completo è disponibile per la lettura e il download.</p>
        </div>
        <Link className="circle-link" href="/programma" aria-label="Vai alla pagina del programma">
          ↗
        </Link>
      </section>

      <section className="support-banner">
        <div className="wrap support-banner-inner">
          <div>
            <p className="eyebrow">05 / LA TUA VOCE</p>
            <h2>
              Fai sentire
              <br />
              <em>la tua voce.</em>
            </h2>
            <p>Scopri il progetto e facci sapere se vorresti sostenerlo.</p>
          </div>
          <div className="support-banner-action">
            <p>Un sondaggio informale, anonimo e non vincolante.</p>
            <Link className="button button-light" href="/partecipa">
              Partecipa al sondaggio <span aria-hidden="true">↗</span>
            </Link>
            <small>Non è una votazione ufficiale e non sostituisce le procedure elettorali dell’Istituto.</small>
          </div>
          <div className="banner-orbit" aria-hidden="true">
            R<span>.</span>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
