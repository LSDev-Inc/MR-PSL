"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClientUuid } from "@/lib/client-uuid";

type CandidateData = {
  position: number;
  name: string;
  className: string;
  biography: string;
  statement: string;
  photoUrl: string;
  objectives: string[];
  published: boolean;
  demoOnly?: boolean;
};
const blank = (position: number): CandidateData => ({
  position,
  name: "",
  className: "",
  biography: "",
  statement: "",
  photoUrl: "",
  objectives: [],
  published: false,
});

function Message({ text, error = false }: { text: string; error?: boolean }) {
  return text ? (
    <p className={error ? "form-message form-error" : "form-message form-success"} role={error ? "alert" : "status"}>
      {text}
    </p>
  ) : null;
}

export function CandidateManager() {
  const [items, setItems] = useState([blank(1), blank(2)]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/admin/candidates", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Non è stato possibile caricare i profili.");
        const loaded: CandidateData[] = await response.json();
        setItems([1, 2].map(position => loaded.find(item => item.position === position) ?? blank(position)));
      })
      .catch((cause: Error) => setError(cause.message));
  }, []);
  function set(position: number, key: keyof CandidateData, value: string | boolean | string[]) {
    setItems(current => current.map(item => (item.position === position ? { ...item, [key]: value } : item)));
  }
  async function upload(position: number, file?: File) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    setError("");
    setMessage("Caricamento immagine…");
    try {
      const response = await fetch("/api/admin/images", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      set(position, "photoUrl", result.url);
      setMessage("Immagine caricata. Salva il profilo per pubblicarla.");
    } catch (cause) {
      setMessage("");
      setError(cause instanceof Error ? cause.message : "Caricamento non riuscito.");
    }
  }
  async function save(item: CandidateData) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { position, name, className, biography, statement, photoUrl, objectives, published } = item;
      const response = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position, name, className, biography, statement, photoUrl, objectives, published }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setItems(current =>
        current.map(entry => (entry.position === item.position ? { ...entry, demoOnly: false } : entry)),
      );
      setMessage(`Profilo ${item.position} salvato.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Salvataggio non riuscito.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor-stack">
      {items.map(item => (
        <section className="admin-panel editor-panel" key={item.position}>
          {item.demoOnly && (
            <div className="demo-warning">CONTENUTO DIMOSTRATIVO · NON PUBBLICATO NEL SITO PUBBLICO</div>
          )}
          <div className="editor-title">
            <div>
              <span className="profile-status">POSIZIONE 0{item.position}</span>
              <h2>{item.name || `Candidato ${item.position}`}</h2>
            </div>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={item.published}
                onChange={event => set(item.position, "published", event.target.checked)}
              />{" "}
              Pubblicato
            </label>
          </div>
          <form
            className="admin-form editor-form"
            onSubmit={event => {
              event.preventDefault();
              void save(item);
            }}
          >
            <label>
              Nome completo
              <input
                required
                minLength={2}
                maxLength={100}
                value={item.name}
                onChange={event => set(item.position, "name", event.target.value)}
              />
            </label>
            <label>
              Classe (facoltativa)
              <input
                maxLength={40}
                value={item.className}
                onChange={event => set(item.position, "className", event.target.value)}
              />
            </label>
            <label>
              Dichiarazione personale
              <textarea
                maxLength={500}
                value={item.statement}
                onChange={event => set(item.position, "statement", event.target.value)}
              />
            </label>
            <label>
              Biografia
              <textarea
                maxLength={1200}
                value={item.biography}
                onChange={event => set(item.position, "biography", event.target.value)}
              />
            </label>
            <label>
              Foto del candidato
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={event => void upload(item.position, event.target.files?.[0])}
              />
              <small>PNG, JPEG o WebP · massimo 5 MB. L’immagine viene archiviata nello storage della campagna.</small>
            </label>
            {item.photoUrl && <p className="image-uploaded">Immagine caricata · {item.photoUrl.split("/").at(-1)}</p>}
            <label>
              Obiettivi (uno per riga)
              <textarea
                maxLength={1000}
                value={item.objectives.join("\n")}
                onChange={event =>
                  set(item.position, "objectives", event.target.value.split("\n").filter(Boolean).slice(0, 8))
                }
              />
            </label>
            <button className="button button-blue" type="submit" disabled={busy}>
              {busy ? "Salvataggio…" : "Salva profilo"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
        </section>
      ))}
      <Message text={message} />
      <Message text={error} error />
    </div>
  );
}

type CampaignGoal = { title: string; description: string };
type CampaignSettings = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  footerText: string;
  closureMessage: string;
  goals: CampaignGoal[];
  status: "open" | "closed" | "scheduled";
  opensAt?: string;
  closesAt?: string;
  retentionDays: number;
};
const defaultGoals = [
  { title: "Ascolto", description: "Un canale chiaro per raccogliere idee, domande e punti di vista degli studenti." },
  { title: "Trasparenza", description: "Aggiornamenti comprensibili su proposte, passaggi e risultati del confronto." },
  { title: "Partecipazione", description: "Occasioni concrete per contribuire alla vita del Polo Tecnico." },
];
const defaultSettings: CampaignSettings = {
  heroTitle: "Il cambiamento inizia da noi.",
  heroSubtitle: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
  ctaPrimary: "Scopri il programma",
  ctaSecondary: "Esprimi il tuo sostegno",
  footerText: "Iniziativa indipendente degli studenti. Non è un servizio ufficiale dell’Istituto.",
  closureMessage: "Il sondaggio è chiuso. Puoi comunque consultare il programma e i profili.",
  goals: defaultGoals,
  status: "closed",
  retentionDays: 180,
};

export function CampaignContentForm() {
  const [value, setValue] = useState(defaultSettings);
  const [goalIds, setGoalIds] = useState(() => defaultSettings.goals.map((_, index) => `goal-${index}`));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/admin/settings", { cache: "no-store" })
      .then(async response => {
        if (response.ok) {
          const data = await response.json();
          const goals = data.goals?.length ? data.goals : defaultGoals;
          setValue({ ...defaultSettings, ...data, goals });
          setGoalIds(current =>
            goals.length === current.length
              ? current
              : goals.map((_: CampaignGoal, index: number) => current[index] ?? createClientUuid()),
          );
        }
      })
      .catch(() => setError("Contenuti non disponibili."));
  }, []);
  function updateGoal(index: number, key: keyof CampaignGoal, text: string) {
    setValue(current => ({
      ...current,
      goals: current.goals.map((goal, goalIndex) => (goalIndex === index ? { ...goal, [key]: text } : goal)),
    }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          heroTitle: value.heroTitle,
          heroSubtitle: value.heroSubtitle,
          ctaPrimary: value.ctaPrimary,
          ctaSecondary: value.ctaSecondary,
          footerText: value.footerText,
          closureMessage: value.closureMessage,
          goals: value.goals,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Contenuti salvati.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Salvataggio non riuscito.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="admin-form wide-form" onSubmit={save}>
        <label>
          Titolo homepage
          <input
            required
            minLength={6}
            maxLength={120}
            value={value.heroTitle}
            onChange={event => setValue({ ...value, heroTitle: event.target.value })}
          />
        </label>
        <label>
          Sottotitolo homepage
          <textarea
            required
            maxLength={240}
            value={value.heroSubtitle}
            onChange={event => setValue({ ...value, heroSubtitle: event.target.value })}
          />
        </label>
        <div className="admin-form-row">
          <label>
            Etichetta CTA programma
            <input
              required
              maxLength={40}
              value={value.ctaPrimary}
              onChange={event => setValue({ ...value, ctaPrimary: event.target.value })}
            />
          </label>
          <label>
            Etichetta CTA sondaggio
            <input
              required
              maxLength={50}
              value={value.ctaSecondary}
              onChange={event => setValue({ ...value, ctaSecondary: event.target.value })}
            />
          </label>
        </div>
        <label>
          Messaggio di chiusura
          <textarea
            maxLength={400}
            value={value.closureMessage}
            onChange={event => setValue({ ...value, closureMessage: event.target.value })}
          />
        </label>
        <label>
          Testo indipendenza e footer
          <textarea
            required
            minLength={10}
            maxLength={220}
            value={value.footerText}
            onChange={event => setValue({ ...value, footerText: event.target.value })}
          />
        </label>
        <div className="goals-editor">
          <div>
            <h3>Temi di confronto</h3>
            <p>Spunti iniziali modificabili. Non sono promesse fino all’approvazione dei candidati.</p>
          </div>
          {value.goals.map((goal, index) => (
            <div className="goal-row" key={goalIds[index]}>
              <label>
                Titolo
                <input
                  required
                  maxLength={60}
                  value={goal.title}
                  onChange={event => updateGoal(index, "title", event.target.value)}
                />
              </label>
              <label>
                Descrizione
                <textarea
                  required
                  maxLength={240}
                  value={goal.description}
                  onChange={event => updateGoal(index, "description", event.target.value)}
                />
              </label>
              <button
                className="table-button"
                type="button"
                onClick={() => {
                  setValue(current => ({
                    ...current,
                    goals: current.goals.filter((_, goalIndex) => goalIndex !== index),
                  }));
                  setGoalIds(current => current.filter((_, goalIndex) => goalIndex !== index));
                }}
              >
                Rimuovi tema
              </button>
            </div>
          ))}
          {value.goals.length < 6 && (
            <button
              className="admin-action-link"
              type="button"
              onClick={() => {
                setValue(current => ({ ...current, goals: [...current.goals, { title: "", description: "" }] }));
                setGoalIds(current => [...current, createClientUuid()]);
              }}
            >
              Aggiungi un tema
            </button>
          )}
        </div>
        <button className="button button-blue" type="submit" disabled={busy}>
          {busy ? "Salvataggio…" : "Salva contenuti"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <Message text={message} />
      <Message text={error} error />
    </>
  );
}

function toDateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function CampaignSettingsForm() {
  const [value, setValue] = useState(defaultSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/admin/settings", { cache: "no-store" })
      .then(async response => {
        if (response.ok) {
          const data = await response.json();
          setValue({
            ...defaultSettings,
            ...data,
            opensAt: toDateInput(data.opensAt),
            closesAt: toDateInput(data.closesAt),
          });
        }
      })
      .catch(() => setError("Impostazioni non disponibili."));
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: value.status,
          opensAt: value.opensAt ? new Date(value.opensAt).toISOString() : null,
          closesAt: value.closesAt ? new Date(value.closesAt).toISOString() : null,
          retentionDays: Number(value.retentionDays),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Impostazioni del sondaggio aggiornate.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Salvataggio non riuscito.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="admin-form wide-form" onSubmit={save}>
        <label>
          Stato del sondaggio
          <select
            value={value.status}
            onChange={event => setValue({ ...value, status: event.target.value as CampaignSettings["status"] })}
          >
            <option value="closed">Chiuso</option>
            <option value="open">Aperto</option>
            <option value="scheduled">Apertura programmata</option>
          </select>
        </label>
        <div className="admin-form-row">
          <label>
            Data e ora di apertura
            <input
              type="datetime-local"
              value={value.opensAt ?? ""}
              onChange={event => setValue({ ...value, opensAt: event.target.value })}
            />
          </label>
          <label>
            Data e ora di chiusura
            <input
              type="datetime-local"
              value={value.closesAt ?? ""}
              onChange={event => setValue({ ...value, closesAt: event.target.value })}
            />
          </label>
        </div>
        <label>
          Conservazione risposte (giorni)
          <input
            type="number"
            min={1}
            max={3650}
            value={value.retentionDays}
            onChange={event => setValue({ ...value, retentionDays: Number(event.target.value) })}
          />
          <small>
            Le risposte scadono automaticamente secondo questo periodo, soggetto ai requisiti di conservazione
            approvati.
          </small>
        </label>
        <button className="button button-blue" type="submit" disabled={busy}>
          {busy ? "Salvataggio…" : "Salva impostazioni"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <Message text={message} />
      <Message text={error} error />
      <p className="chart-note">
        Chiudere il sondaggio impedisce nuove risposte; le pagine pubbliche e il programma restano accessibili.
      </p>
    </>
  );
}

export function ProgramUploader() {
  const [title, setTitle] = useState("Programma della candidatura");
  const [file, setFile] = useState<File | null>(null);
  const [published, setPublished] = useState<{
    title: string;
    url: string;
    size: number;
    publishedAt: string | null;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void fetch("/api/admin/program", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Documento programma non disponibile.");
        setPublished(result.program);
        if (result.program?.title) setTitle(result.program.title);
      })
      .catch((cause: Error) => setError(cause.message));
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Seleziona prima un PDF.");
      return;
    }
    if (file.size < 8 || file.size > 10 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Seleziona un PDF valido entro 10 MB.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const signatureResponse = await fetch("/api/admin/program/signature", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ size: file.size }),
      });
      if (signatureResponse.status === 501) {
        const form = new FormData();
        form.set("title", title);
        form.set("file", file);
        const fallbackResponse = await fetch("/api/admin/program", { method: "POST", body: form });
        const fallbackResult = await fallbackResponse.json();
        if (!fallbackResponse.ok) throw new Error(fallbackResult.error ?? "Caricamento non riuscito.");
        setMessage("Programma pubblicato. La pagina pubblica è aggiornata.");
        setFile(null);
        setPublished(fallbackResult.program);
        if (fileInput.current) fileInput.current.value = "";
        return;
      }
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.error ?? "Preparazione del caricamento non riuscita.");
      if (
        typeof signature.uploadUrl !== "string" ||
        typeof signature.apiKey !== "string" ||
        typeof signature.publicId !== "string" ||
        typeof signature.timestamp !== "string" ||
        typeof signature.signature !== "string" ||
        !signature.publicId.startsWith("campaign-programs/")
      )
        throw new Error("La configurazione del caricamento Cloudinary non è valida.");

      setMessage("Caricamento del PDF su Cloudinary…");
      const cloudinaryData = new FormData();
      cloudinaryData.set("file", file);
      cloudinaryData.set("api_key", signature.apiKey);
      cloudinaryData.set("public_id", signature.publicId);
      cloudinaryData.set("timestamp", signature.timestamp);
      cloudinaryData.set("overwrite", "false");
      cloudinaryData.set("signature", signature.signature);
      const uploadResponse = await fetch(signature.uploadUrl, { method: "POST", body: cloudinaryData });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        const cloudinaryMessage = uploadResult.error?.message;
        if (typeof cloudinaryMessage === "string" && /missing permissions/i.test(cloudinaryMessage))
          throw new Error(
            "La chiave API Cloudinary non può creare file. In Cloudinary assegna alla chiave il ruolo Contributor (permesso Upload assets), poi riprova.",
          );
        throw new Error(
          typeof cloudinaryMessage === "string"
            ? cloudinaryMessage
            : "Cloudinary non ha accettato il PDF. Verifica la configurazione dello storage.",
        );
      }
      if (uploadResult.public_id !== signature.publicId || uploadResult.resource_type !== "image")
        throw new Error("Cloudinary ha restituito un file non riconosciuto.");

      setMessage("Verifica e pubblicazione del programma…");
      const response = await fetch("/api/admin/program", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, publicId: signature.publicId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Pubblicazione del programma non riuscita.");
      setMessage("Programma pubblicato. La pagina pubblica è aggiornata.");
      setFile(null);
      setPublished(result.program);
      if (fileInput.current) fileInput.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Caricamento non riuscito.");
    } finally {
      setBusy(false);
    }
  }
  async function removeProgram() {
    if (!published || !window.confirm("Rimuovere il programma dal sito? La copia nello storage resterà archiviata."))
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/program", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Rimozione non riuscita.");
      setPublished(null);
      setMessage("Programma rimosso dal sito. La copia originale è ancora nello storage.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rimozione non riuscita.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="admin-form wide-form" onSubmit={submit}>
        <label>
          Titolo documento
          <input
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={event => setTitle(event.target.value)}
          />
        </label>
        <label>
          File PDF
          <input
            ref={fileInput}
            type="file"
            required
            accept="application/pdf,.pdf"
            onChange={event => setFile(event.target.files?.[0] ?? null)}
          />
          <small>
            PDF fino a 10 MB. Il contenuto viene verificato prima del salvataggio. Il file è pubblico per consentire la
            lettura del programma.
          </small>
        </label>
        <button className="button button-blue" type="submit" disabled={busy}>
          {busy ? "Caricamento…" : "Carica e pubblica"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      {published && (
        <section className="admin-panel" aria-label="Documento pubblicato">
          <span className="profile-status">DOCUMENTO ATTIVO</span>
          <h2>{published.title}</h2>
          <p>
            PDF · {(published.size / 1024 / 1024).toFixed(1)} MB
            {published.publishedAt ? ` · pubblicato il ${new Date(published.publishedAt).toLocaleString("it-IT")}` : ""}
          </p>
          <div className="admin-actions">
            <a className="admin-action-link" href={published.url} target="_blank" rel="noreferrer">
              Apri PDF pubblico
            </a>
            <a className="admin-action-link" href="/programma" target="_blank" rel="noreferrer">
              Apri pagina Programma
            </a>
            <button className="table-button" type="button" disabled={busy} onClick={() => void removeProgram()}>
              Rimuovi dal sito
            </button>
          </div>
        </section>
      )}
      <Message text={message} />
      <Message text={error} error />
    </>
  );
}

export function QrPoster({ target }: { target: string }) {
  const [format, setFormat] = useState<"a4" | "square" | "story">("a4");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [error, setError] = useState("");
  const qrSrc = `/api/admin/qr?format=svg&view=1`;
  async function exportPng() {
    setError("");
    try {
      const response = await fetch("/api/admin/qr?format=png&view=1", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }
      const qrBlob = await response.blob();
      const qrUrl = URL.createObjectURL(qrBlob);
      const image = new window.Image();
      image.src = qrUrl;
      await image.decode();
      const dimensions = format === "a4" ? [2480, 3508] : format === "square" ? [1080, 1080] : [1080, 1920];
      const canvas = document.createElement("canvas");
      canvas.width = dimensions[0];
      canvas.height = dimensions[1];
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Esportazione non supportata dal browser.");
      const dark = theme === "dark";
      const bg = dark ? "#080B12" : "#F4F3EE";
      const fg = dark ? "#F7F8FA" : "#0A101C";
      const accent = dark ? "#78A9FF" : "#3479EE";
      const w = canvas.width;
      const h = canvas.height;
      const scale = w / 1080;
      context.fillStyle = bg;
      context.fillRect(0, 0, w, h);
      context.strokeStyle = dark ? "rgba(120,169,255,.12)" : "rgba(10,16,28,.1)";
      context.lineWidth = Math.max(1, scale);
      for (let x = 0; x < w; x += 48 * scale) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, h);
        context.stroke();
      }
      for (let y = 0; y < h; y += 48 * scale) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(w, y);
        context.stroke();
      }
      const margin = 92 * scale;
      context.fillStyle = accent;
      context.font = `700 ${Math.round(19 * scale)}px Arial`;
      context.letterSpacing = `${3 * scale}px`;
      context.fillText("RAMADÙ  /  POLO TECNICO", margin, margin + 15 * scale);
      const isStory = format === "story";
      const isSquare = format === "square";
      const titleY = isStory ? h * 0.23 : isSquare ? h * 0.22 : h * 0.18;
      context.fillStyle = fg;
      context.font = `700 ${Math.round((isStory ? 76 : 86) * scale)}px Arial`;
      context.letterSpacing = `${-4 * scale}px`;
      context.fillText("LA TUA VOCE", margin, titleY);
      context.fillText("CONTA.", margin, titleY + 91 * scale);
      context.fillStyle = accent;
      context.font = `400 ${Math.round(27 * scale)}px Georgia`;
      context.letterSpacing = "0px";
      context.fillText("Scopri i candidati, leggi il programma", margin, titleY + 150 * scale);
      context.fillText("e partecipa al sondaggio.", margin, titleY + 190 * scale);
      const qrSize = isStory ? 500 * scale : isSquare ? 340 * scale : 1350;
      const qrX = (w - qrSize) / 2;
      const qrY = isStory ? h * 0.56 : isSquare ? h * 0.42 : 1440;
      context.fillStyle = "#ffffff";
      context.fillRect(qrX - 18 * scale, qrY - 18 * scale, qrSize + 36 * scale, qrSize + 36 * scale);
      context.drawImage(image, qrX, qrY, qrSize, qrSize);
      context.fillStyle = dark ? "#B7C5D8" : "#45566C";
      context.textAlign = "center";
      context.font = `700 ${Math.round(21 * scale)}px Arial`;
      context.letterSpacing = `${2 * scale}px`;
      context.fillText("INQUADRA IL QR CODE", w / 2, qrY + qrSize + 70 * scale);
      context.fillStyle = accent;
      context.font = `600 ${Math.round(20 * scale)}px Arial`;
      context.letterSpacing = "0px";
      context.fillText(target, w / 2, h - 110 * scale);
      context.fillStyle = dark ? "#7F8FA5" : "#66778B";
      context.font = `400 ${Math.round(16 * scale)}px Arial`;
      context.fillText(
        "Iniziativa studentesca indipendente · non è un servizio ufficiale dell’Istituto",
        w / 2,
        h - 56 * scale,
      );
      const anchor = document.createElement("a");
      anchor.download = `ramadu-poster-${format}-${theme}.png`;
      anchor.href = canvas.toDataURL("image/png");
      anchor.click();
      URL.revokeObjectURL(qrUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Esportazione non riuscita.");
    }
  }
  return (
    <>
      <div className="qr-controls">
        <label>
          Formato
          <select value={format} onChange={event => setFormat(event.target.value as typeof format)}>
            <option value="a4">A4 verticale</option>
            <option value="square">Social quadrato</option>
            <option value="story">Storia verticale</option>
          </select>
        </label>
        <label>
          Versione
          <select value={theme} onChange={event => setTheme(event.target.value as typeof theme)}>
            <option value="dark">Scura premium</option>
            <option value="light">Chiara per stampa</option>
          </select>
        </label>
      </div>
      <div className={`poster-preview poster-${format} poster-${theme}`}>
        <div className="poster-heading">
          <p>
            RAMADÙ <span>/</span> POLO TECNICO
          </p>
          <h2>
            LA TUA VOCE
            <br />
            <em>CONTA.</em>
          </h2>
          <p>
            Scopri i candidati, leggi il programma
            <br />e partecipa al sondaggio.
          </p>
        </div>
        <div className="poster-qr">
          <Image
            src={qrSrc}
            alt="QR code per raggiungere la pagina di partecipazione"
            width={300}
            height={300}
            unoptimized
          />
        </div>
        <p className="poster-instruction">INQUADRA IL QR CODE</p>
        <p className="poster-fallback">{target}</p>
        <p className="poster-independent">
          Iniziativa studentesca indipendente · non è un servizio ufficiale dell’Istituto
        </p>
      </div>
      <div className="admin-actions">
        <button className="admin-action-link" type="button" onClick={() => void exportPng()}>
          Scarica poster PNG ↗
        </button>
        <a className="admin-action-link" href="/api/admin/qr?format=svg">
          QR in SVG ↗
        </a>
        <a className="admin-action-link" href="/api/admin/qr?format=png">
          QR in PNG ↗
        </a>
        <button className="admin-action-link" type="button" onClick={() => window.print()}>
          Stampa / salva PDF ↗
        </button>
      </div>
      <p className="chart-note">
        Il poster usa un QR ad alto contrasto con livello di correzione H e zona libera. Verifica la scansione del file
        scaricato prima della stampa.
      </p>
      <Message text={error} error />
    </>
  );
}

type UserRow = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  disabled: boolean;
  lastLoginAt: string | null;
};

const permissionOptions = [
  ["dashboard.read", "Leggi dashboard"],
  ["analytics.read", "Leggi analisi"],
  ["participants.read", "Leggi partecipazioni"],
  ["participants.export", "Esporta aggregati"],
  ["candidates.read", "Leggi candidati"],
  ["candidates.write", "Modifica candidati"],
  ["program.read", "Leggi programma"],
  ["program.write", "Modifica programma"],
  ["content.read", "Leggi contenuti"],
  ["content.write", "Modifica contenuti"],
  ["qr.generate", "Genera QR"],
  ["users.read", "Leggi utenti"],
  ["users.create", "Invita utenti"],
  ["users.update", "Modifica utenti"],
  ["users.disable", "Disattiva utenti"],
  ["audit.read", "Leggi audit"],
  ["settings.read", "Leggi impostazioni"],
  ["settings.write", "Modifica impostazioni"],
] as const;

export function UserManager({ superAdmin = false }: { superAdmin?: boolean }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [purpose, setPurpose] = useState<"invite" | "reset">("invite");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    if (response.ok) setUsers(await response.json());
  }, []);
  useEffect(() => {
    void load().catch(() => setError("Elenco account non disponibile."));
  }, [load]);
  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setLink("");
    try {
      const response = await fetch("/api/admin/users/invitations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, purpose, role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLink(result.link);
      setMessage(
        `Link monouso valido per ${result.expiresInMinutes} minuti. Consegnalo al destinatario tramite un canale sicuro.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invito non riuscito.");
    } finally {
      setBusy(false);
    }
  }
  async function disable(user: UserRow, disabled: boolean) {
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      setMessage(disabled ? "Account disattivato e sessioni revocate." : "Account riattivato.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Aggiornamento non riuscito.");
    }
  }
  async function updateRole(user: UserRow, nextRole: string) {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      setMessage("Ruolo aggiornato. Le sessioni attive sono state revocate.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Aggiornamento non riuscito.");
    }
  }
  async function updatePermissions(user: UserRow, permission: string, enabled: boolean) {
    const permissions = enabled
      ? [...new Set([...user.permissions, permission])]
      : user.permissions.filter(item => item !== permission);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Aggiornamento non riuscito.");
    }
  }
  return (
    <div className="editor-stack">
      <section className="admin-panel">
        <h2>{purpose === "invite" ? "Invita un amministratore" : "Avvia un reset password"}</h2>
        <p>
          Il link è monouso, scade dopo 30 minuti e non contiene password preimpostate. Il sistema non invia email:
          consegna il collegamento tramite un canale sicuro.
        </p>
        <form className="admin-form wide-form" onSubmit={invite}>
          <label>
            Operazione
            <select value={purpose} onChange={event => setPurpose(event.target.value as typeof purpose)}>
              <option value="invite">Nuovo account</option>
              <option value="reset">Reimpostazione password</option>
            </select>
          </label>
          <label>
            Email account
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          {purpose === "invite" && (
            <label>
              Ruolo iniziale
              <select value={role} onChange={event => setRole(event.target.value)}>
                <option value="ADMIN">ADMIN</option>
                <option value="EDITOR">EDITOR</option>
                <option value="ANALYST">ANALYST</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </label>
          )}
          <button className="button button-blue" type="submit" disabled={busy}>
            {busy ? "Creazione…" : purpose === "invite" ? "Crea link invito" : "Crea link reset"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>
        {link && (
          <div className="invite-link">
            <p>{message}</p>
            <input readOnly aria-label="Link invito monouso" value={link} onFocus={event => event.target.select()} />
            <button
              className="admin-action-link"
              type="button"
              onClick={() => void navigator.clipboard.writeText(link)}
            >
              Copia link
            </button>
          </div>
        )}
        <Message text={!link ? message : ""} />
        <Message text={error} error />
      </section>
      <section className="admin-panel">
        <h2>Account registrati</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Ultimo accesso</th>
                <th>Stato</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    {superAdmin && user.role !== "SUPER_ADMIN" ? (
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={event => void updateRole(user, event.target.value)}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("it-IT") : "Mai"}</td>
                  <td>{user.disabled ? "Disattivato" : "Attivo"}</td>
                  <td>
                    {user.role === "SUPER_ADMIN" ? (
                      "—"
                    ) : (
                      <button className="table-button" type="button" onClick={() => void disable(user, !user.disabled)}>
                        {user.disabled ? "Riattiva" : "Disattiva"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {superAdmin && (
          <div className="permission-grid">
            {users
              .filter(user => user.role !== "SUPER_ADMIN")
              .map(user => (
                <details key={user.id}>
                  <summary>{user.email} · Permessi speciali</summary>
                  <div>
                    {permissionOptions.map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={user.permissions.includes(key)}
                          onChange={event => void updatePermissions(user, key, event.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        )}
        <p className="chart-note">
          Il ruolo ADMIN non eredita la gestione dei ruoli. Solo SUPER_ADMIN può assegnare permessi granulari. Ogni
          modifica revoca le sessioni attive dell’account interessato.
        </p>
      </section>
    </div>
  );
}
