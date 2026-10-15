"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { createClientUuid } from "@/lib/client-uuid";
import { type SurveyFormInput, surveyFormSchema } from "@/lib/validation/survey";

export function SurveyForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SurveyFormInput>({ resolver: zodResolver(surveyFormSchema), defaultValues: { acknowledged: false } });
  const choice = watch("choice");
  const acknowledged = watch("acknowledged");

  async function submit(values: SurveyFormInput) {
    setBusy(true);
    setError("");
    if (!values.choice || !values.acknowledged) {
      setBusy(false);
      return;
    }
    if (!idempotencyKey.current) idempotencyKey.current = createClientUuid();
    try {
      const response = await fetch("/api/survey/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, idempotencyKey: idempotencyKey.current }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Non è stato possibile registrare la risposta. Riprova tra poco.");
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Si è verificato un errore. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="survey-card survey-success" role="status" aria-live="polite">
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <p className="survey-step">RISPOSTA REGISTRATA</p>
        <h2>Grazie per aver partecipato.</h2>
        <p>
          Il tuo contributo ci aiuta a capire cosa pensano gli studenti. La risposta è anonima e non costituisce un voto
          ufficiale.
        </p>
        <a className="button button-outline" href="/">
          Torna alla pagina iniziale <span aria-hidden="true">→</span>
        </a>
      </div>
    );

  return (
    <form className="survey-card" onSubmit={handleSubmit(submit)} noValidate>
      <input type="hidden" {...register("choice")} />
      <p className="survey-step">SONDAGGIO RAPPRESENTANTI D'ISTITUTO · FACOLTATIVO</p>
      <h2>
        Vorresti sostenere
        <br />
        questo progetto?
      </h2>
      <p>
        Scegli la risposta che ti rappresenta. Entrambe le opzioni hanno lo stesso valore e puoi partecipare senza
        indicare chi sei.
      </p>
      {error && (
        <div className="survey-alert" role="alert">
          {error}
        </div>
      )}
      <fieldset className="survey-options" aria-label="La tua risposta">
        <button
          className="survey-option"
          type="button"
          aria-pressed={choice === "yes"}
          onClick={() => setValue("choice", "yes", { shouldValidate: true })}
        >
          <span>Sì, mi interessa</span>
          <span aria-hidden="true">↗</span>
        </button>
        <button
          className="survey-option"
          type="button"
          aria-pressed={choice === "no"}
          onClick={() => setValue("choice", "no", { shouldValidate: true })}
        >
          <span>No, non al momento</span>
          <span aria-hidden="true">→</span>
        </button>
      </fieldset>
      {errors.choice && (
        <p className="form-error" role="alert">
          Scegli una risposta.
        </p>
      )}
      <label className="survey-consent">
        <input type="checkbox" {...register("acknowledged")} />
        <span>
          Ho letto l’
          <a href="/privacy" className="text-link">
            informativa privacy
          </a>{" "}
          e so che questo è un sondaggio anonimo e non ufficiale.
        </span>
      </label>
      {errors.acknowledged && (
        <p className="form-error" role="alert">
          Conferma di aver letto l’informativa per continuare.
        </p>
      )}
      <button className="button button-blue survey-submit" type="submit" disabled={!choice || !acknowledged || busy}>
        {busy ? "Invio in corso…" : "Invia la risposta"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="survey-legal">
        La risposta è volontaria e non vincolante. Non è un voto elettorale, non verifica l’identità e non sostituisce
        le procedure ufficiali dell’Istituto. Per evitare doppi invii accidentali, il browser ricorda che hai già
        partecipato.
      </p>
    </form>
  );
}
